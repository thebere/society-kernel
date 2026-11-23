import { describe, expect, test } from "vitest";
import { type Activation, activation } from "../primitives/activation";
import type { KLineMatch } from "./kline";
import { reinstatementEffects } from "./reinstatement";
import { similarity } from "./similarity";
import type { KLine } from "./types";

function memory(overrides: Partial<KLine> = {}): KLine {
  return {
    id: "kline_prior",
    signature: { featureIds: ["SHIPMENT_DELAY"] },
    agencyActivations: [
      { agencyId: "SUPPLIER_ASSESSMENT", activation: activation(0.8) },
      { agencyId: "INVENTORY_ASSESSMENT", activation: activation(0.3) },
    ],
    roleIds: ["SUPPLIER", "SHIPMENT"],
    operationIds: ["VERIFY"],
    utility: activation(0.2),
    ...overrides,
  };
}

describe("reinstatementEffects", () => {
  test.each([
    { score: 1, supplier: 0.8, inventory: 0.3 },
    { score: 0.5, supplier: 0.4, inventory: 0.15 },
  ])("scales stored activation by similarity $score in consolidated order", ({ score, supplier, inventory }) => {
    expect(reinstatementEffects({ kline: memory(), similarity: similarity(score) })).toEqual([
      { action: "activate_agency", agencyId: "SUPPLIER_ASSESSMENT", amount: expect.closeTo(supplier, 12) },
      { action: "activate_agency", agencyId: "INVENTORY_ASSESSMENT", amount: expect.closeTo(inventory, 12) },
    ]);
  });

  test("zero similarity produces no Effects", () => {
    expect(reinstatementEffects({ kline: memory(), similarity: similarity(0) })).toEqual([]);
  });

  test("omits zero stored activations without changing the remaining order", () => {
    const kline = memory({ agencyActivations: [
      { agencyId: "SUPPLIER_ASSESSMENT", activation: activation(0) },
      { agencyId: "INVENTORY_ASSESSMENT", activation: activation(0.3) },
    ] });

    expect(reinstatementEffects({ kline, similarity: similarity(1) })).toEqual([
      { action: "activate_agency", agencyId: "INVENTORY_ASSESSMENT", amount: activation(0.3) },
    ]);
  });

  test("full stored activation and similarity produce bounded activation 1", () => {
    const kline = memory({ agencyActivations: [
      { agencyId: "SUPPLIER_ASSESSMENT", activation: activation(1) },
    ] });

    expect(reinstatementEffects({ kline, similarity: similarity(1) })).toEqual([
      { action: "activate_agency", agencyId: "SUPPLIER_ASSESSMENT", amount: activation(1) },
    ]);
  });

  test("an empty remembered coalition produces no Effects", () => {
    expect(reinstatementEffects({
      kline: memory({ agencyActivations: [] }), similarity: similarity(1),
    })).toEqual([]);
  });

  test.each([0, 1])("utility %s does not modulate reinstatement", utility => {
    const baseline = { kline: memory(), similarity: similarity(0.5) };
    const changed = { ...baseline, kline: memory({ utility: activation(utility) }) };

    expect(reinstatementEffects(changed)).toStrictEqual(reinstatementEffects(baseline));
  });

  test.each([
    { label: "roles", overrides: { roleIds: ["CUSTOMER"] } },
    { label: "operations", overrides: { operationIds: ["ESCALATE", "RESOLVE"] } },
    { label: "signature", overrides: { signature: { featureIds: ["QUALITY_RISK"] } } },
    { label: "identity", overrides: { id: "kline_other" } },
  ] satisfies readonly { label: string; overrides: Partial<KLine> }[])("ignores stored $label when deriving a supplied match", ({ overrides }) => {
    const baseline = { kline: memory(), similarity: similarity(0.5) };
    const changed = { ...baseline, kline: memory(overrides) };

    expect(reinstatementEffects(changed)).toStrictEqual(reinstatementEffects(baseline));
  });

  test("is deterministic and leaves a deeply frozen match and its collections unchanged", () => {
    const original = memory();
    const kline: KLine = Object.freeze({
      ...original,
      signature: Object.freeze({ featureIds: Object.freeze([...original.signature.featureIds]) }),
      agencyActivations: Object.freeze(original.agencyActivations.map(entry => Object.freeze({ ...entry }))),
      roleIds: Object.freeze([...original.roleIds]),
      operationIds: Object.freeze([...original.operationIds]),
    });
    const match: KLineMatch = Object.freeze({ kline, similarity: similarity(0.5) });
    const snapshot = structuredClone(match);

    const first = reinstatementEffects(match);
    const second = reinstatementEffects(match);

    expect(first).toStrictEqual(second);
    expect(match).toStrictEqual(snapshot);
  });

  test("passes computed contributions through the existing Activation invariant", () => {
    const kline = memory({ agencyActivations: [
      // Deliberately bypass the input brand to check the output invariant.
      { agencyId: "SUPPLIER_ASSESSMENT", activation: 2 as Activation },
    ] });

    expect(() => reinstatementEffects({ kline, similarity: similarity(1) }))
      .toThrow("activation must be a number >= 0 and <= 1");
  });
});
