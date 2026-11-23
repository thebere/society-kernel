import { describe, expect, test } from "vitest";
import { agencies } from "../domains/supply-chain/agencies";
import { consolidateKLine, deriveSituationSignature } from "../domains/supply-chain/memory";
import { runtimes } from "../domains/supply-chain/runtimes";
import { agencyIds } from "../domains/supply-chain/types";
import { recallKLines } from "../memory/kline";
import { similarity } from "../memory/similarity";
import { activation } from "../primitives/activation";
import type { AgencyId, Polyneme, RoleId } from "../primitives/types";
import { runCycle } from "../society/cycle";
import { executeDispatch } from "../society/execution";
import { applyEffect, type Effect } from "../workspace/effect";
import { createEmptyWorkspace } from "../workspace/workspace";

describe("canonical supply-chain episode integration", () => {
  test("composes a cycle and local execution, then consolidates and recalls organization without changing a new episode", async () => {
    const bindings: readonly { roleId: RoleId; first: string; second: string }[] = [
      { roleId: "SUPPLIER", first: "supplier_alpha", second: "supplier_beta" },
      { roleId: "COMPONENT", first: "component_ax14", second: "component_k92" },
      { roleId: "SHIPMENT", first: "shipment_2049", second: "shipment_7711" },
      { roleId: "FACILITY", first: "facility_west", second: "facility_east" },
      { roleId: "PRODUCTION_ORDER", first: "production_order_812", second: "production_order_926" },
    ];
    const polynemes: readonly Polyneme[] = [
      { kind: "polyneme", conceptId: "SHIPMENT_DELAY", strength: activation(0.9) },
      { kind: "polyneme", conceptId: "INVENTORY_RISK", strength: activation(0.8) },
      { kind: "polyneme", conceptId: "SUPPLIER_RELIABILITY_RISK", strength: activation(0.75) },
      { kind: "polyneme", conceptId: "PRODUCTION_IMPACT", strength: activation(0.6) },
      { kind: "polyneme", conceptId: "HIGH_PRIORITY_ORDER", strength: activation(0.9) },
      { kind: "polyneme", conceptId: "COMPLIANCE_UNVERIFIED", strength: activation(0.85) },
    ];
    const episode: readonly Effect[] = [
      ...bindings.map(({ roleId, first }): Effect => ({
        action: "bind_pronome", roleId, value: first,
      })),
      { action: "record_fact", key: "shipment.status", value: "delayed" },
      { action: "record_fact", key: "inventory.daysRemaining", value: 2 },
      { action: "record_fact", key: "supplier.onTimeRate", value: 0.71 },
      { action: "record_fact", key: "productionOrder.priority", value: "high" },
      { action: "record_fact", key: "alternativeSupplier.compliance", value: "unverified" },
      ...polynemes.map(({ conceptId, strength }): Effect => ({
        action: "emit_polyneme", conceptId, strength,
      })),
      { action: "invoke_isonome", operationId: "VERIFY", strength: activation(0.8) },
      { action: "invoke_isonome", operationId: "ESCALATE", strength: activation(0.6) },
      { action: "invoke_isonome", operationId: "COMPARE", strength: activation(0.7) },
    ];
    const empty = createEmptyWorkspace();
    const workspace = episode.reduce((state, effect) => applyEffect(state, effect), empty);
    const workspaceSnapshot = structuredClone(workspace);
    const configurationSnapshot = structuredClone(agencies);

    expect(empty).toStrictEqual(createEmptyWorkspace());
    expect(workspace.polynemes).toEqual(polynemes);
    expect(workspace.agencyActivations).toEqual([]);

    const cycle = runCycle(workspace, agencies);

    // Propagation first encounters these agencies in this order. Consolidation
    // below uses the canonical identity order instead.
    const coalition: readonly AgencyId[] = [
      "INVENTORY_ASSESSMENT",
      "LOGISTICS_ASSESSMENT",
      "PRODUCTION_ASSESSMENT",
      "CUSTOMER_COMMITMENT",
      "PROCUREMENT_STRATEGY",
      "RISK_ASSESSMENT",
      "SUPPLIER_ASSESSMENT",
      "COMPLIANCE_ASSESSMENT",
    ];
    // Independent arithmetic: procurement = .8*.4 + .75*.7 = .845;
    // the other seven agencies each accumulate at least 1 and saturate.
    const activationByAgency: Readonly<Record<AgencyId, number>> = {
      SUPPLIER_ASSESSMENT: 1,
      INVENTORY_ASSESSMENT: 1,
      LOGISTICS_ASSESSMENT: 1,
      PRODUCTION_ASSESSMENT: 1,
      PROCUREMENT_STRATEGY: 0.845,
      COMPLIANCE_ASSESSMENT: 1,
      RISK_ASSESSMENT: 1,
      CUSTOMER_COMMITMENT: 1,
    };
    const expectedActivations = coalition.map(agencyId => ({
      agencyId, activation: expect.closeTo(activationByAgency[agencyId], 12),
    }));

    expect(cycle.workspace).toEqual({ ...workspace, agencyActivations: expectedActivations });
    expect(cycle.recruitedAgencyIds).toEqual(coalition);

    const verifyRecipients: readonly AgencyId[] = [
      "INVENTORY_ASSESSMENT", "LOGISTICS_ASSESSMENT", "PRODUCTION_ASSESSMENT",
      "CUSTOMER_COMMITMENT", "RISK_ASSESSMENT", "SUPPLIER_ASSESSMENT", "COMPLIANCE_ASSESSMENT",
    ];
    const escalateRecipients: readonly AgencyId[] = [
      "LOGISTICS_ASSESSMENT", "PRODUCTION_ASSESSMENT", "PROCUREMENT_STRATEGY",
      "RISK_ASSESSMENT", "COMPLIANCE_ASSESSMENT",
    ];
    const expectedVerify = verifyRecipients.map(agencyId => ({
      agencyId, operationId: "VERIFY", strength: activation(0.8),
    }));
    const expectedEscalate = escalateRecipients.map(agencyId => ({
      agencyId, operationId: "ESCALATE", strength: activation(0.6),
    }));
    const compareRecipients: readonly AgencyId[] = [
      "INVENTORY_ASSESSMENT", "LOGISTICS_ASSESSMENT", "PRODUCTION_ASSESSMENT",
      "CUSTOMER_COMMITMENT", "PROCUREMENT_STRATEGY", "RISK_ASSESSMENT", "SUPPLIER_ASSESSMENT",
    ];
    const expectedCompare = compareRecipients.map(agencyId => ({
      agencyId, operationId: "COMPARE", strength: activation(0.7),
    }));

    expect(cycle.dispatches).toEqual([...expectedVerify, ...expectedEscalate, ...expectedCompare]);
    // Requests do not execute agency operations or apply new Workspace Effects.
    expect(cycle.workspace.facts).toEqual(workspace.facts);
    for (const dispatch of cycle.dispatches) {
      expect(dispatch).not.toHaveProperty("action");
    }

    expect(cycle.trace[0]).toEqual({
      kind: "polyneme_propagation",
      conceptId: "SHIPMENT_DELAY",
      strength: activation(0.9),
      effects: [
        { action: "activate_agency", agencyId: "INVENTORY_ASSESSMENT", amount: expect.closeTo(0.54, 12) },
        { action: "activate_agency", agencyId: "LOGISTICS_ASSESSMENT", amount: expect.closeTo(0.9, 12) },
        { action: "activate_agency", agencyId: "PRODUCTION_ASSESSMENT", amount: expect.closeTo(0.36, 12) },
        { action: "activate_agency", agencyId: "CUSTOMER_COMMITMENT", amount: expect.closeTo(0.36, 12) },
      ],
    });

    // Each concept's propagation is followed by its applied Effects, before
    // recruitment and dispatch. Assert the causal groups, not a trace snapshot.
    let cursor = 0;
    for (const polyneme of polynemes) {
      const event = cycle.trace[cursor++];
      expect(event).toMatchObject({
        kind: "polyneme_propagation", conceptId: polyneme.conceptId, strength: polyneme.strength,
      });
      if (event.kind !== "polyneme_propagation") {
        throw new Error("Expected concept propagation before its Effects");
      }
      expect(cycle.trace.slice(cursor, cursor + event.effects.length)).toEqual(
        event.effects.map(effect => ({ kind: "effect_applied", source: "polyneme_propagation", effect })),
      );
      cursor += event.effects.length;
    }
    expect(cycle.trace.slice(cursor, cursor + coalition.length)).toEqual(
      coalition.map(agencyId => {
        const agency = agencies.find(agency => agency.id === agencyId);
        if (!agency) {
          throw new Error(`Missing agency configuration: ${agencyId}`);
        }
        return {
          kind: "agency_recruitment",
          agencyId,
          activation: expect.closeTo(activationByAgency[agencyId], 12),
          threshold: agency.threshold,
          recruited: true,
        };
      }),
    );
    cursor += coalition.length;
    expect(cycle.trace.slice(cursor)).toEqual([
      { kind: "isonome_dispatch", operationId: "VERIFY", strength: activation(0.8), dispatches: expectedVerify },
      { kind: "isonome_dispatch", operationId: "ESCALATE", strength: activation(0.6), dispatches: expectedEscalate },
      { kind: "isonome_dispatch", operationId: "COMPARE", strength: activation(0.7), dispatches: expectedCompare },
    ]);
    expect(runCycle(workspace, agencies)).toStrictEqual(cycle);

    // These constant async implementations are architectural fixtures, not
    // supply-chain analysis. Execute every COMPARE request; the other shared
    // operations remain requests until a caller explicitly executes them.
    const cycleSnapshot = structuredClone(cycle);
    const compareDispatches = cycle.dispatches.filter(dispatch => dispatch.operationId === "COMPARE");
    const results = await Promise.all(compareDispatches.map(dispatch =>
      executeDispatch(dispatch, cycle.workspace, agencies, runtimes),
    ));

    expect(results).toEqual([
      { agencyId: "INVENTORY_ASSESSMENT", operationId: "COMPARE", value: { dimension: "inventory", preferred: "reserve_stock" } },
      { agencyId: "LOGISTICS_ASSESSMENT", operationId: "COMPARE", value: { dimension: "route", preferred: "route_north" } },
      { agencyId: "PRODUCTION_ASSESSMENT", operationId: "COMPARE", value: { dimension: "production", preferred: "reschedule" } },
      { agencyId: "CUSTOMER_COMMITMENT", operationId: "COMPARE", value: { dimension: "commitment", preferred: "review_date" } },
      { agencyId: "PROCUREMENT_STRATEGY", operationId: "COMPARE", value: { dimension: "sourcing", preferred: "dual_source" } },
      { agencyId: "RISK_ASSESSMENT", operationId: "COMPARE", value: { dimension: "risk", preferred: "review_exposure" } },
      { agencyId: "SUPPLIER_ASSESSMENT", operationId: "COMPARE", value: { dimension: "supplier", preferred: "supplier_beta" } },
    ]);
    expect(results.every(result => result.agencyId !== "COMPLIANCE_ASSESSMENT")).toBe(true);
    expect(structuredClone(cycle)).toStrictEqual(cycleSnapshot);

    const memory = consolidateKLine("kline_disruption_001", cycle, activation(0.85));

    expect(memory).toEqual({
      id: "kline_disruption_001",
      signature: {
        featureIds: [
          "SHIPMENT_DELAY", "INVENTORY_RISK", "SUPPLIER_RELIABILITY_RISK",
          "PRODUCTION_IMPACT", "COMPLIANCE_UNVERIFIED", "HIGH_PRIORITY_ORDER",
        ],
      },
      agencyActivations: agencyIds.map(agencyId => ({
        agencyId, activation: expect.closeTo(activationByAgency[agencyId], 12),
      })),
      roleIds: ["SUPPLIER", "COMPONENT", "SHIPMENT", "FACILITY", "PRODUCTION_ORDER"],
      operationIds: ["VERIFY", "COMPARE", "ESCALATE"],
      utility: activation(0.85),
    });
    for (const { first } of bindings) {
      expect(JSON.stringify(memory)).not.toContain(first);
    }

    const secondEpisode: readonly Effect[] = [
      ...bindings.map(({ roleId, second }): Effect => ({
        action: "bind_pronome", roleId, value: second,
      })),
      ...polynemes.filter(signal => signal.conceptId !== "COMPLIANCE_UNVERIFIED")
        .map(({ conceptId, strength }): Effect => ({ action: "emit_polyneme", conceptId, strength })),
    ];
    const secondWorkspace = secondEpisode.reduce(
      (state, effect) => applyEffect(state, effect), createEmptyWorkspace(),
    );
    const secondSnapshot = structuredClone(secondWorkspace);
    const memorySnapshot = structuredClone(memory);

    expect(secondWorkspace.pronomes.map(binding => [binding.roleId, binding.value])).toEqual(
      bindings.map(({ roleId, second }) => [roleId, second]),
    );
    expect(secondWorkspace.agencyActivations).toEqual([]);
    const signature = deriveSituationSignature(secondWorkspace);
    expect(signature.featureIds).toEqual([
      "SHIPMENT_DELAY", "INVENTORY_RISK", "SUPPLIER_RELIABILITY_RISK",
      "PRODUCTION_IMPACT", "HIGH_PRIORITY_ORDER",
    ]);

    // Five shared concepts, six in the union: this is read-only recall,
    // not reinstatement or evidence of a transfer benefit.
    const matches = recallKLines(signature, [memory], similarity(0.8));

    expect(matches).toEqual([{ kline: memory, similarity: expect.closeTo(5 / 6, 12) }]);
    expect(matches[0].kline).toBe(memory);
    expect(structuredClone(secondWorkspace)).toStrictEqual(secondSnapshot);
    expect(memory).toStrictEqual(memorySnapshot);
    expect(structuredClone(workspace)).toStrictEqual(workspaceSnapshot);
    expect(agencies).toStrictEqual(configurationSnapshot);
  });
});
