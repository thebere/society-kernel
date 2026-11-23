import { describe, expect, expectTypeOf, test } from 'vitest';
import { activation } from '../primitives/activation';
import { applyEffect, type Effect } from './effect';
import { Pronome } from './pronome';
import { createEmptyWorkspace, type WorkspaceState } from './workspace';

// Exercise transitions through the public interpreter, not private handlers.
const effects = [
  { action: 'bind_pronome', roleId: 'CARRIER', value: 'carrier_echo' },
  { action: 'record_fact', key: 'inventory.daysRemaining', value: 2 },
  { action: 'emit_polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.3) },
  { action: 'invoke_isonome', operationId: 'VERIFY', strength: activation(0.3) },
  { action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.3) },
  { action: 'inhibit_agency', agencyId: 'COMPLIANCE_ASSESSMENT', amount: activation(0.5) },
] as const satisfies readonly Effect[];

function createPopulatedWorkspace(): WorkspaceState {
  return {
    facts: { 'inventory.daysRemaining': 1, 'shipment.status': 'delayed' },
    pronomes: [new Pronome('CARRIER', 'carrier_delta')],
    polynemes: [
      { kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.4) },
      { kind: 'polyneme', conceptId: 'HIGH_PRIORITY_ORDER', strength: activation(0.2) },
    ],
    isonomes: [
      { kind: 'isonome', operationId: 'VERIFY', strength: activation(0.4) },
      { kind: 'isonome', operationId: 'COMPARE', strength: activation(0.2) },
    ],
    agencyActivations: [
      { agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.4) },
      { agencyId: 'COMPLIANCE_ASSESSMENT', activation: activation(0.2) },
    ],
  };
}

describe('applyEffect boundary', () => {
  test('examples cover every Effect action', () => {
    type CoveredAction = (typeof effects)[number]['action'];

    expectTypeOf<CoveredAction>().toEqualTypeOf<Effect['action']>();
  });

  test.each(effects)('accepts $action', (effect) => {
    expect(() => applyEffect(createEmptyWorkspace(), effect)).not.toThrow();
  });

  test('throws when an unknown effect is provided', () => {
    // @ts-expect-error Deliberately bypass the closed union to check runtime rejection.
    expect(() => applyEffect(createEmptyWorkspace(), { action: 'unknown_effect' })).toThrow('Unhandled effect');
  });

  test.each(effects)('$action returns a new workspace without changing the previous state', (effect) => {
    const original = createPopulatedWorkspace();
    const expectedOriginal = createPopulatedWorkspace();

    const next = applyEffect(original, effect);

    expect(next).not.toBe(original);
    expect(original).toStrictEqual(expectedOriginal);
  });

  test.each(effects)('$action produces the same output for the same input', (effect) => {
    const original = createPopulatedWorkspace();

    const first = applyEffect(original, effect);
    const second = applyEffect(original, effect);

    expect(first).toStrictEqual(second);
  });
});

describe('bind_pronome', () => {
  test('binds a new pronome', () => {
    const workspace = applyEffect(createEmptyWorkspace(), {
      action: 'bind_pronome', roleId: 'CARRIER', value: 'carrier_delta',
    });

    expect(workspace.pronomes).toHaveLength(1);
    expect(workspace.pronomes[0].roleId).toBe('CARRIER');
    expect(workspace.pronomes[0].value).toBe('carrier_delta');
  });

  test('rebinds an existing pronome without changing the previous binding', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      pronomes: [new Pronome('CARRIER', 'carrier_delta')],
    };

    const next = applyEffect(original, {
      action: 'bind_pronome', roleId: 'CARRIER', value: 'carrier_echo',
    });

    expect(next.pronomes).toHaveLength(1);
    expect(next.pronomes[0].roleId).toBe('CARRIER');
    expect(next.pronomes[0].value).toBe('carrier_echo');
    expect(next.pronomes[0]).not.toBe(original.pronomes[0]);
    expect(original.pronomes[0].roleId).toBe('CARRIER');
    expect(original.pronomes[0].value).toBe('carrier_delta');
  });

  test('rebinding one role preserves other roles', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      pronomes: [new Pronome('SUPPLIER', 'supplier_1'), new Pronome('CARRIER', 'carrier_delta')],
    };

    const next = applyEffect(original, {
      action: 'bind_pronome', roleId: 'CARRIER', value: 'carrier_echo',
    });

    expect(next.pronomes).toHaveLength(2);
    expect(next.pronomes.find(p => p.roleId === 'SUPPLIER')?.value).toBe('supplier_1');
    expect(next.pronomes.find(p => p.roleId === 'CARRIER')?.value).toBe('carrier_echo');
  });
});

describe('record_fact', () => {
  test('records a new fact', () => {
    const original = createEmptyWorkspace();

    const next = applyEffect(original, {
      action: 'record_fact', key: 'inventory.daysRemaining', value: 1,
    });

    expect(next.facts).toEqual({ 'inventory.daysRemaining': 1 });
    expect(original.facts).toEqual({});
  });

  test('overwrites an existing fact without changing the previous workspace', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(), facts: { 'inventory.daysRemaining': 1 },
    };

    const next = applyEffect(original, {
      action: 'record_fact', key: 'inventory.daysRemaining', value: 2,
    });

    expect(next.facts).toEqual({ 'inventory.daysRemaining': 2 });
    expect(original.facts).toEqual({ 'inventory.daysRemaining': 1 });
  });

  test('recording one fact preserves other facts', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      facts: { 'inventory.daysRemaining': 1, 'shipment.status': 'delayed' },
    };

    const next = applyEffect(original, {
      action: 'record_fact', key: 'inventory.daysRemaining', value: 2,
    });

    expect(next.facts).toEqual({ 'inventory.daysRemaining': 2, 'shipment.status': 'delayed' });
  });
});

describe('emit_polyneme', () => {
  test('emits a new polyneme', () => {
    const next = applyEffect(createEmptyWorkspace(), {
      action: 'emit_polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.4),
    });

    expect(next.polynemes).toEqual([
      { kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.4) },
    ]);
  });

  test('repeated polyneme emission accumulates without adding a duplicate', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [{ kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.4) }],
    };

    const next = applyEffect(original, {
      action: 'emit_polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.3),
    });

    expect(next.polynemes).toHaveLength(1);
    expect(next.polynemes[0]).toMatchObject({ kind: 'polyneme', conceptId: 'SHIPMENT_DELAY' });
    expect(next.polynemes[0].strength).toBeCloseTo(0.7);
    expect(original.polynemes[0].strength).toBe(0.4);
  });

  test('polyneme accumulation saturates at 1', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [{ kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.8) }],
    };

    const next = applyEffect(original, {
      action: 'emit_polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.5),
    });

    expect(next.polynemes).toHaveLength(1);
    expect(next.polynemes[0].strength).toBe(1);
  });

  test('emitting one polyneme preserves others', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      polynemes: [
        { kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.4) },
        { kind: 'polyneme', conceptId: 'HIGH_PRIORITY_ORDER', strength: activation(0.2) },
      ],
    };

    const next = applyEffect(original, {
      action: 'emit_polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.3),
    });

    expect(next.polynemes).toHaveLength(2);
    expect(next.polynemes.find(p => p.conceptId === 'SHIPMENT_DELAY')?.strength).toBeCloseTo(0.7);
    expect(next.polynemes.find(p => p.conceptId === 'HIGH_PRIORITY_ORDER')).toEqual({
      kind: 'polyneme', conceptId: 'HIGH_PRIORITY_ORDER', strength: activation(0.2),
    });
  });
});

describe('invoke_isonome', () => {
  test('invokes a new isonome', () => {
    const next = applyEffect(createEmptyWorkspace(), {
      action: 'invoke_isonome', operationId: 'VERIFY', strength: activation(0.4),
    });

    expect(next.isonomes).toEqual([
      { kind: 'isonome', operationId: 'VERIFY', strength: activation(0.4) },
    ]);
  });

  test('repeated isonome invocation accumulates without adding a duplicate', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      isonomes: [{ kind: 'isonome', operationId: 'VERIFY', strength: activation(0.4) }],
    };

    const next = applyEffect(original, {
      action: 'invoke_isonome', operationId: 'VERIFY', strength: activation(0.3),
    });

    expect(next.isonomes).toHaveLength(1);
    expect(next.isonomes[0]).toMatchObject({ kind: 'isonome', operationId: 'VERIFY' });
    expect(next.isonomes[0].strength).toBeCloseTo(0.7);
    expect(original.isonomes[0].strength).toBe(0.4);
  });

  test('isonome accumulation saturates at 1', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      isonomes: [{ kind: 'isonome', operationId: 'VERIFY', strength: activation(0.8) }],
    };

    const next = applyEffect(original, {
      action: 'invoke_isonome', operationId: 'VERIFY', strength: activation(0.5),
    });

    expect(next.isonomes).toHaveLength(1);
    expect(next.isonomes[0].strength).toBe(1);
  });

  test('invoking one isonome preserves others', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      isonomes: [
        { kind: 'isonome', operationId: 'VERIFY', strength: activation(0.4) },
        { kind: 'isonome', operationId: 'COMPARE', strength: activation(0.2) },
      ],
    };

    const next = applyEffect(original, {
      action: 'invoke_isonome', operationId: 'VERIFY', strength: activation(0.3),
    });

    expect(next.isonomes).toHaveLength(2);
    expect(next.isonomes.find(i => i.operationId === 'VERIFY')?.strength).toBeCloseTo(0.7);
    expect(next.isonomes.find(i => i.operationId === 'COMPARE')).toEqual({
      kind: 'isonome', operationId: 'COMPARE', strength: activation(0.2),
    });
  });
});

describe('activate_agency', () => {
  test('activates a missing agency', () => {
    const next = applyEffect(createEmptyWorkspace(), {
      action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.4),
    });

    expect(next.agencyActivations).toEqual([
      { agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.4) },
    ]);
  });

  test('repeated agency activation accumulates without adding a duplicate', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      agencyActivations: [{ agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.4) }],
    };

    const next = applyEffect(original, {
      action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.3),
    });

    expect(next.agencyActivations).toHaveLength(1);
    expect(next.agencyActivations[0].agencyId).toBe('SUPPLIER_ASSESSMENT');
    expect(next.agencyActivations[0].activation).toBeCloseTo(0.7);
    expect(original.agencyActivations[0].activation).toBe(0.4);
  });

  test('agency activation saturates at 1', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      agencyActivations: [{ agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.8) }],
    };

    const next = applyEffect(original, {
      action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.5),
    });

    expect(next.agencyActivations).toHaveLength(1);
    expect(next.agencyActivations[0].activation).toBe(1);
  });

  test('activating one agency preserves others', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      agencyActivations: [
        { agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.4) },
        { agencyId: 'COMPLIANCE_ASSESSMENT', activation: activation(0.2) },
      ],
    };

    const next = applyEffect(original, {
      action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.3),
    });

    expect(next.agencyActivations).toHaveLength(2);
    expect(next.agencyActivations.find(a => a.agencyId === 'SUPPLIER_ASSESSMENT')?.activation).toBeCloseTo(0.7);
    expect(next.agencyActivations.find(a => a.agencyId === 'COMPLIANCE_ASSESSMENT')?.activation).toBe(0.2);
  });
});

describe('inhibit_agency', () => {
  test('inhibits an active agency', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      agencyActivations: [{ agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.8) }],
    };

    const next = applyEffect(original, {
      action: 'inhibit_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.3),
    });

    expect(next.agencyActivations).toEqual([
      { agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.5) },
    ]);
  });

  test('agency inhibition floors at 0', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      agencyActivations: [{ agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.2) }],
    };

    const next = applyEffect(original, {
      action: 'inhibit_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.8),
    });

    expect(next.agencyActivations).toEqual([
      { agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0) },
    ]);
  });

  test('inhibiting a missing agency is a no-op', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      agencyActivations: [{ agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.4) }],
    };

    const next = applyEffect(original, {
      action: 'inhibit_agency', agencyId: 'COMPLIANCE_ASSESSMENT', amount: activation(0.5),
    });

    expect(next).toStrictEqual(original);
    expect(next).not.toBe(original);
  });

  test('inhibiting one agency preserves others', () => {
    const original: WorkspaceState = {
      ...createEmptyWorkspace(),
      agencyActivations: [
        { agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.8) },
        { agencyId: 'COMPLIANCE_ASSESSMENT', activation: activation(0.2) },
      ],
    };

    const next = applyEffect(original, {
      action: 'inhibit_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.3),
    });

    expect(next.agencyActivations).toHaveLength(2);
    expect(next.agencyActivations.find(a => a.agencyId === 'SUPPLIER_ASSESSMENT')?.activation).toBeCloseTo(0.5);
    expect(next.agencyActivations.find(a => a.agencyId === 'COMPLIANCE_ASSESSMENT')?.activation).toBe(0.2);
  });
});
