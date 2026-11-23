import { describe, expect, expectTypeOf, test, vi } from "vitest";
import { agencies } from "../domains/supply-chain/agencies";
import { activation } from "../primitives/activation";
import type { Isonome } from "../primitives/types";
import type { Effect } from "../workspace/effect";
import { createEmptyWorkspace, type WorkspaceState } from "../workspace/workspace";
import type { Agency } from "./agency";
import { type AgencyOperationDispatch, dispatchIsonome } from "./dispatch";
import {
  type AgencyExecutionContext,
  type AgencyOperationHandler,
  type AgencyOperationResult,
  type AgencyRuntime,
  executeDispatch,
} from "./execution";

const compare: Isonome = {
  kind: "isonome", operationId: "COMPARE", strength: activation(0.7),
};
const supplierDispatch: AgencyOperationDispatch = {
  agencyId: "SUPPLIER_ASSESSMENT", operationId: "COMPARE", strength: activation(0.7),
};

describe("executeDispatch", () => {
  test("resolves the requested local implementation and passes its context", async () => {
    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(), facts: { "fixture.label": "supplier" },
    };
    const unrelated = vi.fn(() => "wrong agency");
    const wrongOperation = vi.fn(() => "wrong operation");
    const handler = vi.fn(({ workspace, dispatch }: AgencyExecutionContext) => ({
      label: workspace.facts["fixture.label"], strength: dispatch.strength,
    }));
    const runtimes: readonly AgencyRuntime[] = [
      { agencyId: "LOGISTICS_ASSESSMENT", operations: { COMPARE: unrelated } },
      { agencyId: "SUPPLIER_ASSESSMENT", operations: { COMPARE: handler, VERIFY: wrongOperation } },
    ];

    const result = await executeDispatch(supplierDispatch, workspace, agencies, runtimes);

    expect(result).toEqual({
      agencyId: "SUPPLIER_ASSESSMENT", operationId: "COMPARE",
      value: { label: "supplier", strength: activation(0.7) },
    });
    expect(handler).toHaveBeenCalledExactlyOnceWith({ workspace, dispatch: supplierDispatch });
    expect(unrelated).not.toHaveBeenCalled();
    expect(wrongOperation).not.toHaveBeenCalled();
  });

  test("awaits an asynchronous handler before returning its local value", async () => {
    let release!: (value: string) => void;
    const localValue = new Promise<string>(resolve => { release = resolve; });
    const handler: AgencyOperationHandler<string> = async () => await localValue;
    const runtimes: readonly AgencyRuntime[] = [
      { agencyId: "SUPPLIER_ASSESSMENT", operations: { COMPARE: handler } },
    ];
    const execution = executeDispatch(supplierDispatch, createEmptyWorkspace(), agencies, runtimes);
    release("local comparison");

    await expect(execution).resolves.toEqual({
      agencyId: "SUPPLIER_ASSESSMENT", operationId: "COMPARE", value: "local comparison",
    });
  });

  test("the same isonome routes to different local handlers with different results", async () => {
    const workspace = createEmptyWorkspace();
    const runtimes: readonly AgencyRuntime[] = [
      { agencyId: "SUPPLIER_ASSESSMENT", operations: { COMPARE: async () => ({ dimension: "supplier" }) } },
      { agencyId: "LOGISTICS_ASSESSMENT", operations: { COMPARE: async () => ({ dimension: "route" }) } },
    ];
    const dispatches = dispatchIsonome(compare, ["SUPPLIER_ASSESSMENT", "LOGISTICS_ASSESSMENT"], agencies);

    const results = await Promise.all(dispatches.map(dispatch => executeDispatch(dispatch, workspace, agencies, runtimes)));

    expect(results).toEqual([
      { agencyId: "SUPPLIER_ASSESSMENT", operationId: "COMPARE", value: { dimension: "supplier" } },
      { agencyId: "LOGISTICS_ASSESSMENT", operationId: "COMPARE", value: { dimension: "route" } },
    ]);
  });

  test("fails explicitly when agency configuration is missing", async () => {
    await expect(executeDispatch(supplierDispatch, createEmptyWorkspace(), [], [])).rejects.toThrow(
      "Missing agency configuration: SUPPLIER_ASSESSMENT",
    );
  });

  test("rejects an undeclared operation even when a runtime handler exists", async () => {
    const handler = vi.fn(() => "must not execute");
    const runtime: AgencyRuntime = { agencyId: "COMPLIANCE_ASSESSMENT", operations: { COMPARE: handler } };
    const dispatch: AgencyOperationDispatch = { ...supplierDispatch, agencyId: "COMPLIANCE_ASSESSMENT" };

    await expect(executeDispatch(dispatch, createEmptyWorkspace(), agencies, [runtime])).rejects.toThrow(
      "Unsupported operation: COMPLIANCE_ASSESSMENT.COMPARE",
    );
    expect(handler).not.toHaveBeenCalled();
    expect(dispatchIsonome(compare, ["COMPLIANCE_ASSESSMENT"], agencies)).toEqual([]);
  });

  test("fails explicitly when the agency runtime is missing", async () => {
    await expect(executeDispatch(supplierDispatch, createEmptyWorkspace(), agencies, [
      { agencyId: "LOGISTICS_ASSESSMENT", operations: { COMPARE: () => "unrelated" } },
    ])).rejects.toThrow("Missing agency runtime: SUPPLIER_ASSESSMENT");
  });

  test("fails explicitly when the operation implementation is missing", async () => {
    const unrelated = vi.fn(() => "wrong operation");

    await expect(executeDispatch(supplierDispatch, createEmptyWorkspace(), agencies, [
      { agencyId: "SUPPLIER_ASSESSMENT", operations: { VERIFY: unrelated } },
    ])).rejects.toThrow("Missing operation implementation: SUPPLIER_ASSESSMENT.COMPARE");
    expect(unrelated).not.toHaveBeenCalled();
  });

  test("preserves frozen inputs and the runtime registry across deterministic executions", async () => {
    const workspace: WorkspaceState = Object.freeze({
      facts: Object.freeze({ "fixture.label": "supplier" }),
      pronomes: Object.freeze([]),
      polynemes: Object.freeze([]),
      isonomes: Object.freeze([]),
      agencyActivations: Object.freeze([]),
    });
    const dispatch = Object.freeze({ ...supplierDispatch });
    const configuration: readonly Agency[] = Object.freeze(agencies.map(agency => Object.freeze({
      ...agency,
      sensitivities: Object.freeze({ ...agency.sensitivities }),
      supportedOperations: Object.freeze([...agency.supportedOperations]),
    })));
    const handler: AgencyOperationHandler = async ({ workspace, dispatch }) => ({
      label: workspace.facts["fixture.label"], strength: dispatch.strength,
    });
    const operations = Object.freeze({ COMPARE: handler });
    const runtime = Object.freeze({ agencyId: "SUPPLIER_ASSESSMENT" as const, operations });
    const runtimes = Object.freeze([runtime]);
    const workspaceSnapshot = structuredClone(workspace);
    const dispatchSnapshot = structuredClone(dispatch);
    const configurationSnapshot = structuredClone(configuration);

    const first = await executeDispatch(dispatch, workspace, configuration, runtimes);
    const second = await executeDispatch(dispatch, workspace, configuration, runtimes);

    expect(first).toStrictEqual(second);
    expect(workspace).toStrictEqual(workspaceSnapshot);
    expect(dispatch).toStrictEqual(dispatchSnapshot);
    expect(configuration).toStrictEqual(configurationSnapshot);
    expect(runtimes).toEqual([{ agencyId: "SUPPLIER_ASSESSMENT", operations: { COMPARE: handler } }]);
    expect(runtimes[0]).toBe(runtime);
    expect(runtime.operations).toBe(operations);
    expect(operations.COMPARE).toBe(handler);
  });

  test("keeps local data inside the result without interpreting it as an Effect", async () => {
    const workspace = createEmptyWorkspace();
    const value: Effect = { action: "record_fact", key: "unapplied", value: true };
    const runtimes: readonly AgencyRuntime[] = [
      { agencyId: "SUPPLIER_ASSESSMENT", operations: { COMPARE: () => value } },
    ];

    const result = await executeDispatch(supplierDispatch, workspace, agencies, runtimes);

    expect(result).toEqual({ agencyId: "SUPPLIER_ASSESSMENT", operationId: "COMPARE", value });
    expect(result).not.toHaveProperty("action");
    expect(workspace).toStrictEqual(createEmptyWorkspace());
    expectTypeOf<AgencyOperationResult>().not.toExtend<Effect>();
    expectTypeOf<AgencyOperationResult>().not.toExtend<AgencyOperationDispatch>();
  });

  test.each(["synchronous", "asynchronous"] as const)("propagates a %s handler failure", async mode => {
    const failure = new Error("Local comparison failed");
    const handler: AgencyOperationHandler = mode === "synchronous"
      ? () => { throw failure; }
      : async () => { throw failure; };
    const runtimes: readonly AgencyRuntime[] = [
      { agencyId: "SUPPLIER_ASSESSMENT", operations: { COMPARE: handler } },
    ];

    await expect(executeDispatch(supplierDispatch, createEmptyWorkspace(), agencies, runtimes)).rejects.toBe(failure);
  });
});
