import { describe, expect, test, vi } from "vitest";
import { agencies } from "../../../ts/src/domains/supply-chain/agencies";
import * as reinstatement from "../../../ts/src/memory/reinstatement";
import * as execution from "../../../ts/src/society/execution";
import { createWorkspace, directRoute, selectOrganization } from "./baselines";
import { findingsFor, runtimes } from "./capabilities";
import { formationCases, heldOutCases } from "./cases";
import { evaluateCase, runExperiment } from "./run";
import * as scorer from "./scorer";
import { formMemories } from "./training";
import { conditions, type TaskCase } from "./types";

describe("task scorer", () => {
  test("scores required findings downstream of execution, not agency identities", () => {
    expect(scorer.scoreTask(["supplier-risk", "inventory-impact", "production-impact"], [
      { findings: ["supplier-risk", "production-impact"] },
      { findings: ["compliance-verified"] },
    ])).toEqual({ coverage: 2 / 3, satisfied: ["supplier-risk", "production-impact"],
      missing: ["inventory-impact"], unnecessaryExecutions: 1 });
  });

  test("deduplicates findings and does not credit irrelevant outputs", () => {
    expect(scorer.scoreTask(["supplier-risk", "supplier-risk", "route-risk"], [
      { findings: ["supplier-risk", "supplier-risk"] }, { findings: [] },
    ])).toEqual({ coverage: 0.5, satisfied: ["supplier-risk"], missing: ["route-risk"], unnecessaryExecutions: 1 });
    expect(scorer.scoreTask(["supplier-risk"], []).coverage).toBe(0);
    expect(() => scorer.scoreTask([], [])).toThrow("at least one finding");
  });

  test("different capabilities can satisfy the same task and outputs depend on facts", () => {
    const facts = { ...formationCases[0].observation.facts, qualityAlert: true };
    const required = ["supplier-risk", "quality-hold"] as const;
    for (const id of ["SUPPLIER_ASSESSMENT", "RISK_ASSESSMENT"] as const) {
      expect(scorer.scoreTask(required, [{ findings: findingsFor(id, facts) }]).coverage).toBe(1);
      expect(findingsFor(id, { ...facts, supplierUnreliable: false, qualityAlert: false })).not.toContain("supplier-risk");
    }
  });
});

describe("pre-scoring experiment invariants", () => {
  test("formation and held-out identities/literal referents are disjoint", () => {
    const formationIds = new Set(formationCases.map(task => task.id));
    const referents = new Set(formationCases.flatMap(task => task.observation.bindings.map(binding => binding.value)));
    expect(formationCases).toHaveLength(8);
    expect(heldOutCases).toHaveLength(32);
    expect(new Set(heldOutCases.map(task => task.id)).size).toBe(32);
    for (const task of heldOutCases) {
      expect(formationIds.has(task.id)).toBe(false);
      expect(task.requiredFindings.length).toBeGreaterThan(0);
      for (const binding of task.observation.bindings) expect(referents.has(binding.value)).toBe(false);
    }
    for (const kind of ["related", "partial", "unrelated", "misleading"]) {
      expect(heldOutCases.filter(task => task.class === kind)).toHaveLength(8);
    }
  });

  test("unrelated concept sets share no formation concepts; cases vary beyond literal IDs", () => {
    const known = new Set(formationCases.flatMap(task => task.observation.concepts.map(concept => concept.id)));
    for (const task of heldOutCases.filter(task => task.class === "unrelated")) {
      for (const concept of task.observation.concepts) expect(known.has(concept.id)).toBe(false);
    }
    expect(new Set(heldOutCases.map(task => JSON.stringify({ facts: task.observation.facts,
      concepts: task.observation.concepts, requirements: task.requiredFindings }))).size).toBe(32);
  });

  test("the direct baseline uses positive concept membership, not threshold strength", () => {
    const observation = { ...formationCases[0].observation,
      concepts: [{ id: "SHIPMENT_DELAY" as const, strength: 0.01 }] };
    expect(directRoute(observation)).toEqual(["INVENTORY_ASSESSMENT", "LOGISTICS_ASSESSMENT"]);
  });

  test.each(conditions)("%s routing is deterministic and receives no scoring labels", async condition => {
    const { bank } = await formMemories(formationCases);
    const development = { ...formationCases[0] };
    Object.defineProperty(development, "requiredFindings", { get: () => { throw new Error("Label leakage"); } });
    const observation = development.observation;
    expect(Object.keys(observation).sort()).toEqual(["bindings", "concepts", "facts"]);
    const first = selectOrganization(condition, observation, bank);
    const second = selectOrganization(condition, observation, bank);
    expect(first).toStrictEqual(second);
    expect(first.workspace.facts).not.toHaveProperty("requiredFindings");
    expect(first.workspace.facts).not.toHaveProperty("class");
  });

  test("all four conditions use identical configuration, handlers, scorer, and budget", async () => {
    const { bank } = await formMemories(formationCases);
    const executeSpy = vi.spyOn(execution, "executeDispatch");
    const scoreSpy = vi.spyOn(scorer, "scoreTask");
    const reinstateSpy = vi.spyOn(reinstatement, "reinstatementEffects");
    try {
      for (const condition of conditions) {
        const before = executeSpy.mock.calls.length;
        const row = await evaluateCase(formationCases[0], condition, bank);
        expect(row.costs.executionCount).toBeGreaterThan(0);
        expect(row.costs.executionCount).toBeLessThanOrEqual(4);
        const calls = executeSpy.mock.calls.slice(before);
        expect(calls).toHaveLength(row.costs.executionCount);
        for (const [, workspace, config, handlers] of calls) {
          expect(config).toBe(agencies);
          expect(handlers).toBe(runtimes);
          expect(workspace.facts).toEqual(formationCases[0].observation.facts);
        }
      }
      expect(scoreSpy).toHaveBeenCalledTimes(4);
      expect(reinstateSpy).toHaveBeenCalledTimes(1);
    } finally {
      executeSpy.mockRestore(); scoreSpy.mockRestore(); reinstateSpy.mockRestore();
    }
  });

  test("development runs reproduce measurements and summaries exactly without held-out scoring", async () => {
    const development: readonly TaskCase[] = formationCases.map(task => ({ ...task, id: `dev-${task.id}`,
      observation: { ...task.observation, bindings: task.observation.bindings.map(binding => ({ ...binding, value: `dev-${binding.value}` })) } }));
    const snapshot = structuredClone(development);
    const first = await runExperiment(development, formationCases);
    const second = await runExperiment(development, formationCases);
    expect(first).toStrictEqual(second);
    expect(first.measurements).toHaveLength(32);
    expect(development).toStrictEqual(snapshot);
    expect(createWorkspace(development[0].observation).agencyActivations).toEqual([]);
  });
});
