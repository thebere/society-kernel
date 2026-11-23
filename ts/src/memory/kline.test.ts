import {
  describe,
  expect,
  test,
} from "vitest";
import { consolidateKLine, deriveSituationSignature } from "../domains/supply-chain/memory";
import { activation } from "../primitives/activation";
import type { CycleResult } from "../society/cycle";
import { Pronome } from "../workspace/pronome";
import {
  createEmptyWorkspace,
  type WorkspaceState,
} from "../workspace/workspace";
import { recallKLines, situationSimilarity } from "./kline";
import { similarity } from "./similarity";
import type {
  KLine,
  SituationSignature,
} from "./types";

describe("deriveSituationSignature", () => {
  test("contains non-zero active concepts only", () => {
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
        {
          kind: "polyneme",
          conceptId: "HIGH_PRIORITY_ORDER",
          strength: activation(0),
        },
      ],
    };

    expect(
      deriveSituationSignature(workspace),
    ).toEqual({
      featureIds: [
        "SHIPMENT_DELAY",
        "INVENTORY_RISK",
      ],
    });
  });

  test("canonicalizes concept ordering", () => {
    const first: WorkspaceState = {
      ...createEmptyWorkspace(),

      polynemes: [
        {
          kind: "polyneme",
          conceptId: "PRODUCTION_IMPACT",
          strength: activation(0.8),
        },
        {
          kind: "polyneme",
          conceptId: "SHIPMENT_DELAY",
          strength: activation(0.9),
        },
      ],
    };

    const second: WorkspaceState = {
      ...createEmptyWorkspace(),

      polynemes: [
        {
          kind: "polyneme",
          conceptId: "SHIPMENT_DELAY",
          strength: activation(0.9),
        },
        {
          kind: "polyneme",
          conceptId: "PRODUCTION_IMPACT",
          strength: activation(0.8),
        },
      ],
    };

    expect(
      deriveSituationSignature(first),
    ).toStrictEqual(
      deriveSituationSignature(second),
    );
  });
});

describe("situationSimilarity", () => {
  test("identical non-empty signatures have similarity 1", () => {
    const signature: SituationSignature = {
      featureIds: [
        "SHIPMENT_DELAY",
        "INVENTORY_RISK",
        "SUPPLIER_RELIABILITY_RISK",
      ],
    };

    expect(
      situationSimilarity(
        signature,
        signature,
      ),
    ).toBe(1);
  });

  test("feature ordering does not affect similarity", () => {
    expect(
      situationSimilarity(
        {
          featureIds: [
            "SHIPMENT_DELAY",
            "INVENTORY_RISK",
            "SUPPLIER_RELIABILITY_RISK",
          ],
        },
        {
          featureIds: [
            "SUPPLIER_RELIABILITY_RISK",
            "SHIPMENT_DELAY",
            "INVENTORY_RISK",
          ],
        },
      ),
    ).toBe(1);
  });

  test("uses Jaccard similarity for partial overlap", () => {
    const score = situationSimilarity(
      {
        featureIds: [
          "SHIPMENT_DELAY",
          "INVENTORY_RISK",
          "SUPPLIER_RELIABILITY_RISK",
        ],
      },
      {
        featureIds: [
          "SHIPMENT_DELAY",
          "INVENTORY_RISK",
          "PRODUCTION_IMPACT",
        ],
      },
    );

    expect(score).toBeCloseTo(
      0.5,
      12,
    );
  });

  test("disjoint signatures have zero similarity", () => {
    expect(
      situationSimilarity(
        {
          featureIds: [
            "SHIPMENT_DELAY",
            "INVENTORY_RISK",
          ],
        },
        {
          featureIds: [
            "ALTERNATIVE_SUPPLIER_AVAILABLE",
            "ROUTE_DISRUPTION",
          ],
        },
      ),
    ).toBe(0);
  });

  test.each([
    [
      { featureIds: [] },
      { featureIds: [] },
    ],
    [
      { featureIds: [] },
      {
        featureIds: [
          "SHIPMENT_DELAY",
        ],
      },
    ],
    [
      {
        featureIds: [
          "SHIPMENT_DELAY",
        ],
      },
      { featureIds: [] },
    ],
  ] as const)(
    "empty signatures provide no evidence of similarity",
    (left, right) => {
      expect(
        situationSimilarity(
          left,
          right,
        ),
      ).toBe(0);
    },
  );
});

describe("consolidateKLine", () => {
  function createCycle(): CycleResult {
    const workspace: WorkspaceState = {
      ...createEmptyWorkspace(),

      pronomes: [
        new Pronome(
          "SUPPLIER",
          "supplier_alpha",
        ),
        new Pronome(
          "COMPONENT",
          "component_ax14",
        ),
        new Pronome(
          "SHIPMENT",
          "shipment_2049",
        ),
        new Pronome(
          "FACILITY",
          "facility_west",
        ),
      ],

      polynemes: [
        {
          kind: "polyneme",
          conceptId: "SHIPMENT_DELAY",
          strength: activation(0.9),
        },
        {
          kind: "polyneme",
          conceptId: "INVENTORY_RISK",
          strength: activation(0.8),
        },
        {
          kind: "polyneme",
          conceptId: "SUPPLIER_RELIABILITY_RISK",
          strength: activation(0.7),
        },
      ],

      agencyActivations: [
        {
          agencyId: "RISK_ASSESSMENT",
          activation: activation(0.2),
        },
        {
          agencyId: "LOGISTICS_ASSESSMENT",
          activation: activation(0.9),
        },
        {
          agencyId: "SUPPLIER_ASSESSMENT",
          activation: activation(0.8),
        },
      ],
    };

    return {
      workspace,

      recruitedAgencyIds: [
        "LOGISTICS_ASSESSMENT",
        "SUPPLIER_ASSESSMENT",
      ],

      dispatches: [
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
      ],

      trace: [],
    };
  }

  test("consolidates cognitive organization from the completed cycle", () => {
    const kline = consolidateKLine(
      "kline_episode_001",
      createCycle(),
      activation(0.85),
    );

    expect(kline).toEqual({
      id: "kline_episode_001",

      signature: {
        featureIds: [
          "SHIPMENT_DELAY",
          "INVENTORY_RISK",
          "SUPPLIER_RELIABILITY_RISK",
        ],
      },

      agencyActivations: [
        {
          agencyId: "SUPPLIER_ASSESSMENT",
          activation: activation(0.8),
        },
        {
          agencyId: "LOGISTICS_ASSESSMENT",
          activation: activation(0.9),
        },
      ],

      roleIds: [
        "SUPPLIER",
        "COMPONENT",
        "SHIPMENT",
        "FACILITY",
      ],

      operationIds: [
        "VERIFY",
        "ESCALATE",
      ],

      utility: activation(0.85),
    });
  });

  test("does not store literal pronome referents", () => {
    const kline = consolidateKLine(
      "kline_episode_001",
      createCycle(),
      activation(0.85),
    );

    const serialized =
      JSON.stringify(kline);

    expect(serialized)
      .not.toContain("supplier_alpha");

    expect(serialized)
      .not.toContain("component_ax14");

    expect(serialized)
      .not.toContain("shipment_2049");

    expect(serialized)
      .not.toContain("facility_west");
  });

  test("stores recruited agencies only", () => {
    const kline = consolidateKLine(
      "kline_episode_001",
      createCycle(),
      activation(0.8),
    );

    expect(
      kline.agencyActivations.map(
        activation =>
          activation.agencyId,
      ),
    ).toEqual([
      "SUPPLIER_ASSESSMENT",
      "LOGISTICS_ASSESSMENT",
    ]);

    expect(
      kline.agencyActivations.some(
        activation =>
          activation.agencyId ===
          "RISK_ASSESSMENT",
      ),
    ).toBe(false);
  });

  test("deduplicates dispatched operations", () => {
    const kline = consolidateKLine(
      "kline_episode_001",
      createCycle(),
      activation(0.8),
    );

    expect(kline.operationIds).toEqual([
      "VERIFY",
      "ESCALATE",
    ]);
  });

  test("rejects a recruited agency without activation state", () => {
    const cycle = createCycle();

    const invalid: CycleResult = {
      ...cycle,
      recruitedAgencyIds: [
        ...cycle.recruitedAgencyIds,
        "COMPLIANCE_ASSESSMENT",
      ],
    };

    expect(() =>
      consolidateKLine(
        "kline_episode_001",
        invalid,
        activation(0.8),
      ),
    ).toThrow(
      "Missing activation for recruited agency: COMPLIANCE_ASSESSMENT",
    );
  });

  test("is deterministic and does not mutate the cycle", () => {
    const cycle = createCycle();
    const snapshot =
      structuredClone(cycle);

    const first = consolidateKLine(
      "kline_episode_001",
      cycle,
      activation(0.8),
    );

    const second = consolidateKLine(
      "kline_episode_001",
      cycle,
      activation(0.8),
    );

    expect(first).toStrictEqual(second);
    expect(structuredClone(cycle)).toStrictEqual(snapshot);
  });
});


describe("recallKLines", () => {
  function kline(
    id: `kline_${string}`,
    featureIds: KLine["signature"]["featureIds"],
  ): KLine {
    return {
      id,
      signature: { featureIds },
      agencyActivations: [],
      roleIds: [],
      operationIds: [],
      utility: activation(0.8),
    };
  }

  const current: SituationSignature = {
    featureIds: [
      "SHIPMENT_DELAY",
      "INVENTORY_RISK",
      "SUPPLIER_RELIABILITY_RISK",
    ],
  };

  test("recalls an exact match", () => {
    const memory = kline(
      "kline_exact",
      [
        "SHIPMENT_DELAY",
        "INVENTORY_RISK",
        "SUPPLIER_RELIABILITY_RISK",
      ],
    );

    expect(
      recallKLines(
        current,
        [memory],
        similarity(0.5),
      ),
    ).toEqual([
      {
        kline: memory,
        similarity: similarity(1),
      },
    ]);
  });

  test("includes a match exactly at the threshold", () => {
    const memory = kline(
      "kline_partial",
      [
        "SHIPMENT_DELAY",
        "INVENTORY_RISK",
        "PRODUCTION_IMPACT",
      ],
    );

    // intersection 2
    // union 4
    // Jaccard = .5

    expect(
      recallKLines(
        current,
        [memory],
        similarity(0.5),
      ),
    ).toHaveLength(1);
  });

  test("excludes matches below the threshold", () => {
    const memory = kline(
      "kline_weak",
      [
        "SHIPMENT_DELAY",
        "PRODUCTION_IMPACT",
        "REPEAT_DISRUPTION",
      ],
    );

    expect(
      recallKLines(
        current,
        [memory],
        similarity(0.5),
      ),
    ).toEqual([]);
  });

  test("never recalls zero-overlap memories even with minimum zero", () => {
    const memory = kline(
      "kline_unrelated",
      [
        "ALTERNATIVE_SUPPLIER_AVAILABLE",
        "ROUTE_DISRUPTION",
      ],
    );

    expect(
      recallKLines(
        current,
        [memory],
        similarity(0),
      ),
    ).toEqual([]);
  });

  test("orders matches by similarity descending", () => {
    const weak = kline(
      "kline_weak",
      [
        "SHIPMENT_DELAY",
      ],
    );

    const exact = kline(
      "kline_exact",
      [
        "SHIPMENT_DELAY",
        "INVENTORY_RISK",
        "SUPPLIER_RELIABILITY_RISK",
      ],
    );

    const medium = kline(
      "kline_medium",
      [
        "SHIPMENT_DELAY",
        "INVENTORY_RISK",
      ],
    );

    const matches = recallKLines(
      current,
      [weak, exact, medium],
      similarity(0.2),
    );

    expect(
      matches.map(
        match => match.kline.id,
      ),
    ).toEqual([
      "kline_exact",
      "kline_medium",
      "kline_weak",
    ]);
  });

  test("breaks similarity ties by K-line id", () => {
    const beta = kline(
      "kline_beta",
      [
        "SHIPMENT_DELAY",
        "INVENTORY_RISK",
      ],
    );

    const alpha = kline(
      "kline_alpha",
      [
        "SHIPMENT_DELAY",
        "SUPPLIER_RELIABILITY_RISK",
      ],
    );

    expect(
      recallKLines(
        current,
        [beta, alpha],
        similarity(0),
      ).map(
        match => match.kline.id,
      ),
    ).toEqual([
      "kline_alpha",
      "kline_beta",
    ]);
  });

  test("storage order does not affect recall ordering", () => {
    const alpha = kline(
      "kline_alpha",
      [
        "SHIPMENT_DELAY",
        "INVENTORY_RISK",
      ],
    );

    const beta = kline(
      "kline_beta",
      [
        "SHIPMENT_DELAY",
      ],
    );

    const first = recallKLines(
      current,
      [alpha, beta],
      similarity(0),
    );

    const second = recallKLines(
      current,
      [beta, alpha],
      similarity(0),
    );

    expect(first).toStrictEqual(second);
  });
});


describe("structural transfer", () => {
  test("different literal referents produce the same signature when concept structure is identical", () => {
    const first: WorkspaceState = {
      ...createEmptyWorkspace(),

      pronomes: [
        new Pronome(
          "SUPPLIER",
          "supplier_alpha",
        ),
        new Pronome(
          "COMPONENT",
          "component_ax14",
        ),
        new Pronome(
          "SHIPMENT",
          "shipment_2049",
        ),
      ],

      polynemes: [
        {
          kind: "polyneme",
          conceptId: "SHIPMENT_DELAY",
          strength: activation(0.9),
        },
        {
          kind: "polyneme",
          conceptId: "INVENTORY_RISK",
          strength: activation(0.8),
        },
        {
          kind: "polyneme",
          conceptId: "SUPPLIER_RELIABILITY_RISK",
          strength: activation(0.7),
        },
      ],
    };

    const second: WorkspaceState = {
      ...createEmptyWorkspace(),

      pronomes: [
        new Pronome(
          "SUPPLIER",
          "supplier_beta",
        ),
        new Pronome(
          "COMPONENT",
          "component_k92",
        ),
        new Pronome(
          "SHIPMENT",
          "shipment_7711",
        ),
      ],

      polynemes: [
        {
          kind: "polyneme",
          conceptId: "SHIPMENT_DELAY",
          strength: activation(0.6),
        },
        {
          kind: "polyneme",
          conceptId: "INVENTORY_RISK",
          strength: activation(0.5),
        },
        {
          kind: "polyneme",
          conceptId: "SUPPLIER_RELIABILITY_RISK",
          strength: activation(0.9),
        },
      ],
    };

    const firstSignature =
      deriveSituationSignature(first);

    const secondSignature =
      deriveSituationSignature(second);

    expect(firstSignature)
      .toStrictEqual(secondSignature);

    expect(
      situationSimilarity(
        firstSignature,
        secondSignature,
      ),
    ).toBe(1);
  });
});
