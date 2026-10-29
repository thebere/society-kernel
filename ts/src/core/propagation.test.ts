import { describe, expect, test } from 'vitest';
import { activation } from './activation';
import { agencies as configuredAgencies, createEmptyOperations, type Agency } from './agency';
import { applyEffect } from './effect';
import { propagation } from './propagation';
import type { Polyneme } from './types';
import { createEmptyWorkspace, type WorkspaceState } from './workspace';

describe('polyneme propagation', () => {
  test('one polyneme generates an activation effect for one sensitive agency', () => {
    const polyneme: Polyneme = {
      kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.5),
    };
    const agencies: Agency[] = [{
      id: 'SUPPLIER_ASSESSMENT',
      threshold: activation(0.9),
      sensitivities: {
        SHIPMENT_DELAY: activation(0.8),
      },
      operations: createEmptyOperations(),
    }];

    // Propagation contributes activation even below the execution threshold.
    const effects = propagation(polyneme, agencies);

    expect(effects).toHaveLength(1);
    expect(effects).toEqual([
      { action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.4) },
    ]);
  });

  test('one polyneme activates multiple agencies according to their sensitivities', () => {
    const polyneme: Polyneme = {
      kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.5),
    };
    const agencies: Agency[] = [
      {
        id: 'SUPPLIER_ASSESSMENT',
        threshold: activation(1),
        sensitivities: {
          SHIPMENT_DELAY: activation(0.8),
        },
        operations: createEmptyOperations(),
      },
      {
        id: 'LOGISTICS_ASSESSMENT',
        threshold: activation(1),
        sensitivities: {
          SHIPMENT_DELAY: activation(0.4),
        },
        operations: createEmptyOperations(),
      },
    ];

    const effects = propagation(polyneme, agencies);

    expect(effects).toHaveLength(2);
    expect(effects).toEqual(expect.arrayContaining([
      { action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.4) },
      { action: 'activate_agency', agencyId: 'LOGISTICS_ASSESSMENT', amount: activation(0.2) },
    ]));
  });

  test.each([
    { name: 'no sensitivities', sensitivities: {} },
    { name: 'only an unrelated sensitivity', sensitivities: { ALTERNATIVE_SUPPLIER_AVAILABLE: activation(0.8) } },
    { name: 'an explicit zero sensitivity', sensitivities: { SHIPMENT_DELAY: activation(0) } },
  ])('an agency with $name receives no effect', ({ sensitivities }) => {
    const polyneme: Polyneme = {
      kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.5),
    };
    const agencies: Agency[] = [
      {
        id: 'SUPPLIER_ASSESSMENT',
        threshold: activation(1),
        sensitivities,
        operations: createEmptyOperations(),
      }];

    expect(propagation(polyneme, agencies)).toStrictEqual([]);
  });

  test('an insensitive agency remains absent when another agency receives an effect', () => {
    const polyneme: Polyneme = {
      kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.5),
    };
    const agencies: Agency[] = [
      {
        id: 'SUPPLIER_ASSESSMENT',
        threshold: activation(1),
        sensitivities: {
          SHIPMENT_DELAY: activation(0.8),
        },
        operations: createEmptyOperations(),
      },
      {
        id: 'RISK_ASSESSMENT',
        threshold: activation(1),
        sensitivities: {
          ALTERNATIVE_SUPPLIER_AVAILABLE: activation(1),
        },
        operations: createEmptyOperations(),
      },
    ];

    expect(propagation(polyneme, agencies)).toEqual([
      { action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.4) },
    ]);
  });

  test.each([
    { strength: 0.25, contribution: 0.2 },
    { strength: 0.5, contribution: 0.4 },
    { strength: 1, contribution: 0.8 },
  ])('strength $strength with sensitivity 0.8 contributes $contribution', ({ strength, contribution }) => {
    const polyneme: Polyneme = {
      kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(strength),
    };
    const agencies: Agency[] = [{
      id: 'SUPPLIER_ASSESSMENT',
      threshold: activation(1),
      sensitivities: {
        SHIPMENT_DELAY: activation(0.8),
      },
      operations: createEmptyOperations(),
    }];

    const effects = propagation(polyneme, agencies);

    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({ action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT' });
    expect(effects[0].amount).toBeCloseTo(contribution, 12);
  });

  test.each([
    { sensitivity: 0.25, contribution: 0.2 },
    { sensitivity: 0.5, contribution: 0.4 },
    { sensitivity: 1, contribution: 0.8 },
  ])('sensitivity $sensitivity with strength 0.8 contributes $contribution', ({ sensitivity, contribution }) => {
    const polyneme: Polyneme = {
      kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.8),
    };
    const agencies: Agency[] = [{
      id: 'SUPPLIER_ASSESSMENT',
      threshold: activation(1),
      sensitivities: {
        SHIPMENT_DELAY: activation(sensitivity),
      },
      operations: createEmptyOperations(),
    }];

    const effects = propagation(polyneme, agencies);

    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({ action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT' });
    expect(effects[0].amount).toBeCloseTo(contribution, 12);
  });

  test('a zero-strength polyneme generates no activation effects', () => {
    const polyneme: Polyneme = {
      kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0),
    };
    const agencies: Agency[] = [{
      id: 'SUPPLIER_ASSESSMENT',
      threshold: activation(1),
      sensitivities: {
        SHIPMENT_DELAY: activation(0.8),
      },
      operations: createEmptyOperations(),
    }];

    expect(propagation(polyneme, agencies)).toStrictEqual([]);
  });

  test.each([
    { name: 'accumulate below saturation', firstStrength: 0.4, secondStrength: 0.3, expected: 0.7 },
    { name: 'saturate at 1', firstStrength: 0.8, secondStrength: 0.5, expected: 1 },
  ])('two concepts targeting one agency $name through applyEffect', ({ firstStrength, secondStrength, expected }) => {
    const polynemes: Polyneme[] = [
      { kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(firstStrength) },
      { kind: 'polyneme', conceptId: 'INVENTORY_RISK', strength: activation(secondStrength) },
    ];
    const agencies: Agency[] = [{
      id: 'SUPPLIER_ASSESSMENT',
      threshold: activation(1),
      sensitivities: {
        SHIPMENT_DELAY: activation(1),
        INVENTORY_RISK: activation(1),
      },
      operations: createEmptyOperations(),
    }];

    const effects = polynemes.flatMap(polyneme => propagation(polyneme, agencies));
    const next = effects.reduce((workspace, effect) => applyEffect(workspace, effect), createEmptyWorkspace());

    expect(effects).toHaveLength(2);
    expect(next.agencyActivations).toHaveLength(1);
    expect(next.agencyActivations[0].agencyId).toBe('SUPPLIER_ASSESSMENT');
    if (expected === 1) {
      expect(next.agencyActivations[0].activation).toBe(1);
    } else {
      expect(next.agencyActivations[0].activation).toBeCloseTo(expected, 12);
    }
  });

  test('applying propagation effects adds to existing agency activation', () => {
    const polyneme: Polyneme = {
      kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.5),
    };
    const agencies: Agency[] = [{
      id: 'SUPPLIER_ASSESSMENT',
      threshold: activation(1),
      sensitivities: {
        SHIPMENT_DELAY: activation(0.8),
      },
      operations: createEmptyOperations(),
    }];
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [polyneme],
      agencyActivations: [{ agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.2) }],
    };

    const effects = propagation(polyneme, agencies);
    const next = effects.reduce((workspace, effect) => applyEffect(workspace, effect), original);

    expect(effects).toEqual([
      { action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.4) },
    ]);
    expect(next.agencyActivations).toHaveLength(1);
    expect(next.agencyActivations[0].agencyId).toBe('SUPPLIER_ASSESSMENT');
    expect(next.agencyActivations[0].activation).toBeCloseTo(0.6, 12);
    expect(original.agencyActivations[0].activation).toBe(0.2);
  });

  test('generating propagation effects does not mutate the workspace before they are applied', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [{ kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.5) }],
      agencyActivations: [{ agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.2) }],
    };
    const snapshot = structuredClone(original);
    const originalPolynemes = original.polynemes;
    const originalActivations = original.agencyActivations;
    const agencies: Agency[] = [{
      id: 'SUPPLIER_ASSESSMENT',
      threshold: activation(1),
      sensitivities: {
        SHIPMENT_DELAY: activation(0.8)
      },
      operations: createEmptyOperations(),
    }];

    const effects = original.polynemes.flatMap(polyneme => propagation(polyneme, agencies));

    expect(original).toStrictEqual(snapshot);
    expect(original.polynemes).toBe(originalPolynemes);
    expect(original.agencyActivations).toBe(originalActivations);

    const next = effects.reduce((workspace, effect) => applyEffect(workspace, effect), original);

    expect(next.agencyActivations).toHaveLength(1);
    expect(next.agencyActivations[0].activation).toBeCloseTo(0.6, 12);
    expect(next.polynemes).toEqual(snapshot.polynemes);
    expect(original).toStrictEqual(snapshot);
  });

  test('propagation produces structurally identical effects for the same inputs', () => {
    const polyneme: Polyneme = {
      kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.5),
    };
    const agencies: Agency[] = [
      {
        id: 'SUPPLIER_ASSESSMENT',
        threshold: activation(1),
        sensitivities: {
          SHIPMENT_DELAY: activation(0.8)
        },
        operations: createEmptyOperations(),
      },
      {
        id: 'LOGISTICS_ASSESSMENT',
        threshold: activation(1),
        sensitivities: {
          SHIPMENT_DELAY: activation(0.4)
        },
        operations: createEmptyOperations(),
      },
    ];
    const polynemeSnapshot = structuredClone(polyneme);
    const agenciesSnapshot = cloneAgencyConfiguration(agencies);

    const first = propagation(polyneme, agencies);
    const second = propagation(polyneme, agencies);

    expect(first).toStrictEqual(second);
    expect(polyneme).toStrictEqual(polynemeSnapshot);
    expect(agencies).toStrictEqual(agenciesSnapshot);
  });
});

describe('supply-chain disruption propagation integration', () => {
  test('six concepts accumulate the hand-calculated activation for every configured agency', () => {
    const polynemes: Polyneme[] = [
      { kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.8) },
      { kind: 'polyneme', conceptId: 'INVENTORY_RISK', strength: activation(0.6) },
      { kind: 'polyneme', conceptId: 'SUPPLIER_RELIABILITY_RISK', strength: activation(0.5) },
      { kind: 'polyneme', conceptId: 'PRODUCTION_IMPACT', strength: activation(0.2) },
      { kind: 'polyneme', conceptId: 'REPEAT_DISRUPTION', strength: activation(0.4) },
      { kind: 'polyneme', conceptId: 'CUSTOMER_COMMITMENT_RISK', strength: activation(0.3) },
    ];
    const original: WorkspaceState = { ...createEmptyWorkspace(), polynemes };
    const originalSnapshot = structuredClone(original);
    const agenciesSnapshot = cloneAgencyConfiguration(configuredAgencies);
    const effects = original.polynemes.flatMap(polyneme => propagation(polyneme, configuredAgencies));
    expect(original).toStrictEqual(originalSnapshot);
    const next = effects.reduce((workspace, effect) => applyEffect(workspace, effect), original);
    // Supplier: .5*.9 + .4*.7 = .73; logistics: .8*1 + .6*.4 saturates.
    // Risk: .6*.7 + .2*.8 + .4*.6 + .3*.6 saturates; customer: .8*.4 + .2*.6 + .3*.9 = .71.
    expect(next.agencyActivations).toHaveLength(8);
    expect(next.agencyActivations).toEqual(expect.arrayContaining([
      { agencyId: 'SUPPLIER_ASSESSMENT', activation: expect.closeTo(0.73, 12) },
      { agencyId: 'INVENTORY_ASSESSMENT', activation: activation(1) },
      { agencyId: 'LOGISTICS_ASSESSMENT', activation: activation(1) },
      { agencyId: 'PRODUCTION_ASSESSMENT', activation: expect.closeTo(0.94, 12) },
      { agencyId: 'PROCUREMENT_STRATEGY', activation: expect.closeTo(0.87, 12) },
      { agencyId: 'COMPLIANCE_ASSESSMENT', activation: expect.closeTo(0.15, 12) },
      { agencyId: 'RISK_ASSESSMENT', activation: activation(1) },
      { agencyId: 'CUSTOMER_COMMITMENT', activation: expect.closeTo(0.71, 12) },
    ]));
    expect(next.polynemes).toEqual(originalSnapshot.polynemes);
    expect(original).toStrictEqual(originalSnapshot);
    expect(configuredAgencies).toStrictEqual(agenciesSnapshot);
  });

  test('an alternative supplier signal leaves agencies without a relevant sensitivity absent', () => {
    const polyneme: Polyneme = {
      kind: 'polyneme', conceptId: 'ALTERNATIVE_SUPPLIER_AVAILABLE', strength: activation(0.8),
    };
    const effects = propagation(polyneme, configuredAgencies);
    const next = effects.reduce((workspace, effect) => applyEffect(workspace, effect), createEmptyWorkspace());
    expect(effects).toHaveLength(2);
    expect(next.agencyActivations).toEqual([
      { agencyId: 'PROCUREMENT_STRATEGY', activation: expect.closeTo(0.72, 12) },
      { agencyId: 'COMPLIANCE_ASSESSMENT', activation: expect.closeTo(0.32, 12) },
    ]);
    expect(next.agencyActivations.some(a => a.agencyId === 'LOGISTICS_ASSESSMENT')).toBe(false);
    expect(next.agencyActivations.some(a => a.agencyId === 'SUPPLIER_ASSESSMENT')).toBe(false);
  });
});

function cloneAgencyConfiguration(configuration: readonly Agency[]) {
  return configuration.map(agency => ({ ...agency, sensitivities: { ...agency.sensitivities }, operations: { ...agency.operations } }));
}
