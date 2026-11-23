import { describe, expect, test } from "vitest";
import { agencies } from "../domains/supply-chain/agencies";
import { activation } from "../primitives/activation";
import type { Isonome, Polyneme } from "../primitives/types";
import {
  createEmptyWorkspace,
  type WorkspaceState,
} from "../workspace/workspace";
import type { Agency } from "./agency";
import { runCycle } from "./cycle";

const shipmentDelay: Polyneme = {
  kind: "polyneme",
  conceptId: "SHIPMENT_DELAY",
  strength: activation(0.8),
};

const verify: Isonome = {
  kind: "isonome",
  operationId: "VERIFY",
  strength: activation(0.8),
};

describe("runCycle", () => {
  test("propagates active concepts and applies their activation effects", () => {
    const configuration: readonly Agency[] = [
      {
        id: "SUPPLIER_ASSESSMENT",
        threshold: activation(0.5),
        sensitivities: {
          SHIPMENT_DELAY: activation(0.8),
        },
        supportedOperations: ["VERIFY"],
      },
    ];

    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [shipmentDelay],
    };

    const result = runCycle(workspace, configuration);

    expect(result.workspace.agencyActivations).toEqual([
      {
        agencyId: "SUPPLIER_ASSESSMENT",
        activation: expect.closeTo(0.64, 12),
      },
    ]);

    expect(result.recruitedAgencyIds).toEqual([
      "SUPPLIER_ASSESSMENT",
    ]);
  });

  test("accumulates contributions from multiple polynemes before recruitment", () => {
    const configuration: readonly Agency[] = [
      {
        id: "LOGISTICS_ASSESSMENT",
        threshold: activation(0.6),
        sensitivities: {
          INVENTORY_RISK: activation(0.5),
          SUPPLIER_RELIABILITY_RISK: activation(0.5),
        },
        supportedOperations: ["VERIFY"],
      },
    ];

    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [
        {
          kind: "polyneme",
          conceptId: "INVENTORY_RISK",
          strength: activation(0.8),
        },
        {
          kind: "polyneme",
          conceptId: "SUPPLIER_RELIABILITY_RISK",
          strength: activation(0.6),
        },
      ],
    };

    const result = runCycle(workspace, configuration);

    /*
     * .8 × .5 = .4
     * .6 × .5 = .3
     * accumulated = .7
     */
    expect(
      result.workspace.agencyActivations[0].activation,
    ).toBeCloseTo(0.7, 12);

    expect(result.recruitedAgencyIds).toEqual([
      "LOGISTICS_ASSESSMENT",
    ]);
  });

  test("recruitment happens after propagation rather than from the input workspace", () => {
    const configuration: readonly Agency[] = [
      {
        id: "SUPPLIER_ASSESSMENT",
        threshold: activation(0.5),
        sensitivities: {
          SHIPMENT_DELAY: activation(1),
        },
        supportedOperations: ["VERIFY"],
      },
    ];

    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [
        {
          kind: "polyneme",
          conceptId: "SHIPMENT_DELAY",
          strength: activation(0.6),
        },
      ],
      agencyActivations: [],
    };

    const result = runCycle(workspace, configuration);

    expect(workspace.agencyActivations).toEqual([]);

    expect(result.workspace.agencyActivations).toEqual([
      {
        agencyId: "SUPPLIER_ASSESSMENT",
        activation: activation(0.6),
      },
    ]);

    expect(result.recruitedAgencyIds).toEqual([
      "SUPPLIER_ASSESSMENT",
    ]);
  });

  test("adds propagation contributions to existing agency activation", () => {
    const configuration: readonly Agency[] = [
      {
        id: "SUPPLIER_ASSESSMENT",
        threshold: activation(0.5),
        sensitivities: {
          SHIPMENT_DELAY: activation(0.8),
        },
        supportedOperations: ["VERIFY"],
      },
    ];

    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [
        {
          kind: "polyneme",
          conceptId: "SHIPMENT_DELAY",
          strength: activation(0.5),
        },
      ],
      agencyActivations: [
        {
          agencyId: "SUPPLIER_ASSESSMENT",
          activation: activation(0.2),
        },
      ],
    };

    const result = runCycle(workspace, configuration);

    /*
     * Existing .2
     * +
     * .5 × .8 = .4
     * =
     * .6
     */
    expect(
      result.workspace.agencyActivations[0].activation,
    ).toBeCloseTo(0.6, 12);

    expect(result.recruitedAgencyIds).toEqual([
      "SUPPLIER_ASSESSMENT",
    ]);
  });

  test("dispatches active isonomes only after forming the coalition", () => {
    const configuration: readonly Agency[] = [
      {
        id: "SUPPLIER_ASSESSMENT",
        threshold: activation(0.5),
        sensitivities: {
          SHIPMENT_DELAY: activation(1),
        },
        supportedOperations: ["VERIFY"],
      },
      {
        id: "PROCUREMENT_STRATEGY",
        threshold: activation(0.5),
        sensitivities: {
          SHIPMENT_DELAY: activation(1),
        },
        supportedOperations: ["COMPARE", "ESCALATE"],
      },
    ];

    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [
        {
          kind: "polyneme",
          conceptId: "SHIPMENT_DELAY",
          strength: activation(0.8),
        },
      ],
      isonomes: [verify],
    };

    const result = runCycle(workspace, configuration);

    expect(result.recruitedAgencyIds).toEqual([
      "SUPPLIER_ASSESSMENT",
      "PROCUREMENT_STRATEGY",
    ]);

    expect(result.dispatches).toEqual([
      {
        agencyId: "SUPPLIER_ASSESSMENT",
        operationId: "VERIFY",
        strength: activation(0.8),
      },
    ]);
  });

  test("different isonomes produce different operational subcoalitions", () => {
    const configuration: readonly Agency[] = [
      {
        id: "SUPPLIER_ASSESSMENT",
        threshold: activation(0.5),
        sensitivities: {
          SHIPMENT_DELAY: activation(1),
        },
        supportedOperations: ["VERIFY"],
      },
      {
        id: "LOGISTICS_ASSESSMENT",
        threshold: activation(0.5),
        sensitivities: {
          SHIPMENT_DELAY: activation(1),
        },
        supportedOperations: ["VERIFY", "ESCALATE"],
      },
      {
        id: "PROCUREMENT_STRATEGY",
        threshold: activation(0.5),
        sensitivities: {
          SHIPMENT_DELAY: activation(1),
        },
        supportedOperations: ["ESCALATE"],
      },
    ];

    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [shipmentDelay],
      isonomes: [
        verify,
        {
          kind: "isonome",
          operationId: "ESCALATE",
          strength: activation(0.6),
        },
      ],
    };

    const result = runCycle(workspace, configuration);

    expect(result.recruitedAgencyIds).toEqual([
      "SUPPLIER_ASSESSMENT",
      "LOGISTICS_ASSESSMENT",
      "PROCUREMENT_STRATEGY",
    ]);

    expect(result.dispatches).toEqual([
      {
        agencyId: "SUPPLIER_ASSESSMENT",
        operationId: "VERIFY",
        strength: activation(0.8),
      },
      {
        agencyId: "LOGISTICS_ASSESSMENT",
        operationId: "VERIFY",
        strength: activation(0.8),
      },
      {
        agencyId: "LOGISTICS_ASSESSMENT",
        operationId: "ESCALATE",
        strength: activation(0.6),
      },
      {
        agencyId: "PROCUREMENT_STRATEGY",
        operationId: "ESCALATE",
        strength: activation(0.6),
      },
    ]);
  });

  test("records the causal cycle in deterministic phase order", () => {
    const configuration: readonly Agency[] = [
      {
        id: "SUPPLIER_ASSESSMENT",
        threshold: activation(0.5),
        sensitivities: {
          SHIPMENT_DELAY: activation(0.8),
        },
        supportedOperations: ["VERIFY"],
      },
    ];

    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [shipmentDelay],
      isonomes: [verify],
    };

    const result = runCycle(workspace, configuration);

    expect(result.trace).toEqual([
      {
        kind: "polyneme_propagation",
        conceptId: "SHIPMENT_DELAY",
        strength: activation(0.8),
        effects: [
          {
            action: "activate_agency",
            agencyId: "SUPPLIER_ASSESSMENT",
            amount: expect.closeTo(0.64, 12),
          },
        ],
      },
      {
        kind: "effect_applied",
        source: "polyneme_propagation",
        effect: {
          action: "activate_agency",
          agencyId: "SUPPLIER_ASSESSMENT",
          amount: expect.closeTo(0.64, 12),
        },
      },
      {
        kind: "agency_recruitment",
        agencyId: "SUPPLIER_ASSESSMENT",
        activation: expect.closeTo(0.64, 12),
        threshold: activation(0.5),
        recruited: true,
      },
      {
        kind: "isonome_dispatch",
        operationId: "VERIFY",
        strength: activation(0.8),
        dispatches: [
          {
            agencyId: "SUPPLIER_ASSESSMENT",
            operationId: "VERIFY",
            strength: activation(0.8),
          },
        ],
      },
    ]);
  });

  test("records below-threshold agencies as not recruited", () => {
    const configuration: readonly Agency[] = [
      {
        id: "SUPPLIER_ASSESSMENT",
        threshold: activation(0.7),
        sensitivities: {
          SHIPMENT_DELAY: activation(0.5),
        },
        supportedOperations: ["VERIFY"],
      },
    ];

    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [shipmentDelay],
      isonomes: [verify],
    };

    const result = runCycle(workspace, configuration);

    expect(result.recruitedAgencyIds).toEqual([]);
    expect(result.dispatches).toEqual([]);

    expect(result.trace).toContainEqual({
      kind: "agency_recruitment",
      agencyId: "SUPPLIER_ASSESSMENT",
      activation: activation(0.4),
      threshold: activation(0.7),
      recruited: false,
    });
  });

  test("keeps zero-strength signals observable without producing consequences", () => {
    const configuration: readonly Agency[] = [
      {
        id: "SUPPLIER_ASSESSMENT",
        threshold: activation(0.5),
        sensitivities: {
          SHIPMENT_DELAY: activation(1),
        },
        supportedOperations: ["VERIFY"],
      },
    ];

    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [
        {
          kind: "polyneme",
          conceptId: "SHIPMENT_DELAY",
          strength: activation(0),
        },
      ],
      isonomes: [
        {
          kind: "isonome",
          operationId: "VERIFY",
          strength: activation(0),
        },
      ],
    };

    const result = runCycle(workspace, configuration);

    expect(result.workspace.agencyActivations).toEqual([]);
    expect(result.recruitedAgencyIds).toEqual([]);
    expect(result.dispatches).toEqual([]);

    expect(result.trace).toEqual([
      {
        kind: "polyneme_propagation",
        conceptId: "SHIPMENT_DELAY",
        strength: activation(0),
        effects: [],
      },
      {
        kind: "isonome_dispatch",
        operationId: "VERIFY",
        strength: activation(0),
        dispatches: [],
      },
    ]);
  });

  test("an empty workspace produces an empty cycle result", () => {
    const workspace = createEmptyWorkspace();

    const result = runCycle(workspace, agencies);

    expect(result.workspace).toStrictEqual(workspace);
    expect(result.recruitedAgencyIds).toEqual([]);
    expect(result.dispatches).toEqual([]);
    expect(result.trace).toEqual([]);
  });

  test("rejects incomplete agency configuration during recruitment", () => {
    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      agencyActivations: [
        {
          agencyId: "SUPPLIER_ASSESSMENT",
          activation: activation(0.8),
        },
      ],
    };

    expect(() =>
      runCycle(workspace, []),
    ).toThrow(
      "Missing agency configuration: SUPPLIER_ASSESSMENT",
    );
  });

  test("is deterministic and does not mutate its inputs", () => {
    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [
        {
          kind: "polyneme",
          conceptId: "SHIPMENT_DELAY",
          strength: activation(0.8),
        },
        {
          kind: "polyneme",
          conceptId: "INVENTORY_RISK",
          strength: activation(0.7),
        },
      ],
      isonomes: [verify],
    };

    const workspaceSnapshot = structuredClone(workspace);
    const agenciesSnapshot = structuredClone(agencies);

    const first = runCycle(workspace, agencies);
    const second = runCycle(workspace, agencies);

    expect(first).toStrictEqual(second);

    expect(workspace).toStrictEqual(workspaceSnapshot);
    expect(agencies).toStrictEqual(agenciesSnapshot);
  });

  test("preserves existing polynemes and isonomes in the resulting workspace", () => {
    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [shipmentDelay],
      isonomes: [verify],
    };

    const result = runCycle(workspace, agencies);

    expect(result.workspace.polynemes).toEqual(
      workspace.polynemes,
    );

    expect(result.workspace.isonomes).toEqual(
      workspace.isonomes,
    );
  });
});
