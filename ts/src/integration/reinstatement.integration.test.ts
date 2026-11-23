import { describe, expect, test } from "vitest";
import { consolidateKLine, deriveSituationSignature } from "../domains/supply-chain/memory";
import { type KLineMatch, recallKLines, situationSimilarity } from "../memory/kline";
import { reinstatementEffects } from "../memory/reinstatement";
import { similarity } from "../memory/similarity";
import type { KLine } from "../memory/types";
import { activation } from "../primitives/activation";
import type { Agency } from "../society/agency";
import { runCycle } from "../society/cycle";
import { applyEffect, type Effect } from "../workspace/effect";
import { createEmptyWorkspace } from "../workspace/workspace";

function configuration(threshold: number): readonly Agency[] {
  return [{
    id: "LOGISTICS_ASSESSMENT",
    threshold: activation(threshold),
    sensitivities: { SHIPMENT_DELAY: activation(1) },
    supportedOperations: ["VERIFY"],
  }];
}

function rememberedMatch(storedActivation: number, score: number): KLineMatch {
  const kline: KLine = {
    id: "kline_disruption",
    signature: { featureIds: ["SHIPMENT_DELAY"] },
    agencyActivations: [
      { agencyId: "LOGISTICS_ASSESSMENT", activation: activation(storedActivation) },
    ],
    roleIds: ["SUPPLIER", "SHIPMENT"],
    operationIds: ["VERIFY"],
    utility: activation(0.9),
  };
  return { kline, similarity: similarity(score) };
}

describe("explicit K-line reinstatement composition", () => {
  test("consolidates a past episode, recalls across new referents, and applies a prior before current propagation", () => {
    const agencies: readonly Agency[] = [
      ...configuration(0.7),
      { id: "INVENTORY_ASSESSMENT", threshold: activation(0.7),
        sensitivities: { INVENTORY_RISK: activation(1) }, supportedOperations: ["VERIFY"] },
    ];
    const pastEffects: readonly Effect[] = [
      { action: "bind_pronome", roleId: "SUPPLIER", value: "supplier_alpha" },
      { action: "bind_pronome", roleId: "SHIPMENT", value: "shipment_2049" },
      { action: "record_fact", key: "shipment.status", value: "delayed" },
      { action: "emit_polyneme", conceptId: "SHIPMENT_DELAY", strength: activation(0.7) },
      { action: "emit_polyneme", conceptId: "INVENTORY_RISK", strength: activation(0.8) },
      { action: "invoke_isonome", operationId: "VERIFY", strength: activation(0.8) },
    ];
    const past = runCycle(pastEffects.reduce(applyEffect, createEmptyWorkspace()), agencies);
    const memory = consolidateKLine("kline_past_disruption", past, activation(0.9));
    const currentEffects: readonly Effect[] = [
      { action: "bind_pronome", roleId: "SUPPLIER", value: "supplier_beta" },
      { action: "bind_pronome", roleId: "SHIPMENT", value: "shipment_7711" },
      { action: "record_fact", key: "shipment.status", value: "rerouted" },
      { action: "emit_polyneme", conceptId: "SHIPMENT_DELAY", strength: activation(0.4) },
    ];
    const current = currentEffects.reduce(applyEffect, createEmptyWorkspace());
    const snapshot = structuredClone({ current, past, memory, agencies });
    expect(memory.agencyActivations).toEqual([
      { agencyId: "INVENTORY_ASSESSMENT", activation: activation(0.8) },
      { agencyId: "LOGISTICS_ASSESSMENT", activation: activation(0.7) },
    ]);

    // One shared concept in a two-concept union. Recall alone is read-only.
    const matches = recallKLines(deriveSituationSignature(current), [memory], similarity(0.5));
    expect(matches).toEqual([{ kline: memory, similarity: similarity(0.5) }]);
    expect(structuredClone({ current, past, memory, agencies })).toStrictEqual(snapshot);
    const match = matches[0];
    if (!match) throw new Error("Expected the related memory to be recalled");
    const effects = reinstatementEffects(match);
    expect(effects).toEqual([
      { action: "activate_agency", agencyId: "INVENTORY_ASSESSMENT", amount: expect.closeTo(0.4, 12) },
      { action: "activate_agency", agencyId: "LOGISTICS_ASSESSMENT", amount: expect.closeTo(0.35, 12) },
    ]);
    expect(current.agencyActivations).toEqual([]);

    const prior = effects.reduce(applyEffect, current);
    expect(prior).toEqual({ ...current, agencyActivations: [
      { agencyId: "INVENTORY_ASSESSMENT", activation: expect.closeTo(0.4, 12) },
      { agencyId: "LOGISTICS_ASSESSMENT", activation: expect.closeTo(0.35, 12) },
    ] });
    expect(prior.pronomes.map(binding => binding.value)).toEqual(["supplier_beta", "shipment_7711"]);
    expect(prior.isonomes).toEqual([]);

    const result = runCycle(prior, agencies);
    // Inventory remains below threshold; current delay evidence reinforces logistics.
    expect(result.workspace.agencyActivations).toEqual([
      { agencyId: "INVENTORY_ASSESSMENT", activation: expect.closeTo(0.4, 12) },
      { agencyId: "LOGISTICS_ASSESSMENT", activation: expect.closeTo(0.75, 12) },
    ]);
    expect(result.recruitedAgencyIds).toEqual(["LOGISTICS_ASSESSMENT"]);
    expect(past.recruitedAgencyIds).toEqual(["LOGISTICS_ASSESSMENT", "INVENTORY_ASSESSMENT"]);
    expect(result.dispatches).toEqual([]);
    expect(result.trace[0]).toMatchObject({ kind: "polyneme_propagation", conceptId: "SHIPMENT_DELAY" });
    expect(result.trace.filter(event => event.kind === "effect_applied")).toHaveLength(1);
    expect(runCycle(reinstatementEffects(match).reduce(applyEffect, current), agencies)).toStrictEqual(result);
    expect(structuredClone({ current, past, memory, agencies })).toStrictEqual(snapshot);
  });

  test("memory contribution 0.3 does not force recruitment at threshold 0.7", () => {
    const prior = reinstatementEffects(rememberedMatch(0.6, 0.5)).reduce(applyEffect, createEmptyWorkspace());

    expect(prior.agencyActivations).toEqual([
      { agencyId: "LOGISTICS_ASSESSMENT", activation: expect.closeTo(0.3, 12) },
    ]);
    expect(runCycle(prior, configuration(0.7)).recruitedAgencyIds).toEqual([]);
  });

  test("current evidence 0.4 plus a memory prior 0.35 enables ordinary recruitment at 0.7", () => {
    const agencies = configuration(0.7);
    const current = applyEffect(createEmptyWorkspace(), {
      action: "emit_polyneme", conceptId: "SHIPMENT_DELAY", strength: activation(0.4),
    });
    const evidenceOnly = runCycle(current, agencies);
    expect(evidenceOnly.workspace.agencyActivations[0].activation).toBeCloseTo(0.4, 12);
    expect(evidenceOnly.recruitedAgencyIds).toEqual([]);

    const prior = reinstatementEffects(rememberedMatch(0.7, 0.5)).reduce(applyEffect, current);
    const result = runCycle(prior, agencies);

    expect(result.workspace.agencyActivations[0].activation).toBeCloseTo(0.75, 12);
    expect(result.recruitedAgencyIds).toEqual(["LOGISTICS_ASSESSMENT"]);
    expect(agencies[0].threshold).toBe(0.7);
    expect(agencies[0].sensitivities).toEqual({ SHIPMENT_DELAY: activation(1) });
  });

  test.each([
    { inhibition: 0.5, expected: 0.1 },
    { inhibition: 1, expected: 0 },
  ])("current inhibition $inhibition overrides a 0.6 memory prior using ordinary Effects", ({ inhibition, expected }) => {
    const prior = reinstatementEffects(rememberedMatch(0.6, 1)).reduce(applyEffect, createEmptyWorkspace());
    expect(runCycle(prior, configuration(0.4)).recruitedAgencyIds).toEqual(["LOGISTICS_ASSESSMENT"]);

    const inhibited = applyEffect(prior, {
      action: "inhibit_agency", agencyId: "LOGISTICS_ASSESSMENT", amount: activation(inhibition),
    });

    expect(prior.agencyActivations[0].activation).toBe(0.6);
    expect(inhibited.agencyActivations[0].activation).toBeCloseTo(expected, 12);
    expect(runCycle(inhibited, configuration(0.4)).recruitedAgencyIds).toEqual([]);
  });

  test("ordinary Effect application saturates existing 0.7 activation plus a 0.5 prior at 1", () => {
    const current = applyEffect(createEmptyWorkspace(), {
      action: "activate_agency", agencyId: "LOGISTICS_ASSESSMENT", amount: activation(0.7),
    });
    const prior = reinstatementEffects(rememberedMatch(1, 0.5)).reduce(applyEffect, current);

    expect(prior.agencyActivations).toEqual([
      { agencyId: "LOGISTICS_ASSESSMENT", activation: activation(1) },
    ]);
    expect(current.agencyActivations[0].activation).toBe(0.7);
    expect(runCycle(prior, configuration(1)).recruitedAgencyIds).toEqual(["LOGISTICS_ASSESSMENT"]);
  });

  test("unrelated structure yields no recalled prior and zero similarity leaves current activation unchanged", () => {
    const { kline } = rememberedMatch(0.8, 1);
    const current = applyEffect(applyEffect(createEmptyWorkspace(), {
      action: "emit_polyneme", conceptId: "QUALITY_RISK", strength: activation(1),
    }), { action: "activate_agency", agencyId: "LOGISTICS_ASSESSMENT", amount: activation(0.2) });
    const snapshot = structuredClone(current);
    const signature = deriveSituationSignature(current);
    const matches = recallKLines(signature, [kline], similarity(0));

    expect(matches).toEqual([]);
    const match = matches[0];
    const selectedEffects = match ? reinstatementEffects(match) : [];
    expect(selectedEffects.reduce(applyEffect, current)).toBe(current);
    // Recall excludes zero scores; explicitly exercise the derivation boundary too.
    const score = situationSimilarity(signature, kline.signature);
    expect(score).toBe(0);
    const zeroEffects = reinstatementEffects({ kline, similarity: score });
    expect(zeroEffects).toEqual([]);
    expect(zeroEffects.reduce(applyEffect, current)).toBe(current);
    expect(current).toStrictEqual(snapshot);
  });

  test("preserves remembered agency identity and the downstream missing-configuration failure", () => {
    const effects = reinstatementEffects(rememberedMatch(0.6, 1));
    const prior = effects.reduce(applyEffect, createEmptyWorkspace());

    expect(prior.agencyActivations[0].agencyId).toBe("LOGISTICS_ASSESSMENT");
    expect(() => runCycle(prior, [])).toThrow("Missing agency configuration: LOGISTICS_ASSESSMENT");
  });
});
