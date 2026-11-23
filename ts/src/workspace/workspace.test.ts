import { describe, expect, test } from 'vitest';
import { activation } from '../primitives/activation';
import { applyEffect, type Effect } from './effect';
import { createEmptyWorkspace } from './workspace';

describe('createEmptyWorkspace', () => {
  test('creates the canonical empty state', () => {
    expect(createEmptyWorkspace()).toStrictEqual({
      facts: {},
      pronomes: [],
      polynemes: [],
      isonomes: [],
      agencyActivations: [],
    });
  });

  test('creates independent state containers for each workspace', () => {
    const first = createEmptyWorkspace();
    const second = createEmptyWorkspace();

    expect(first).not.toBe(second);
    expect(first.facts).not.toBe(second.facts);
    expect(first.pronomes).not.toBe(second.pronomes);
    expect(first.polynemes).not.toBe(second.polynemes);
    expect(first.isonomes).not.toBe(second.isonomes);
    expect(first.agencyActivations).not.toBe(second.agencyActivations);
  });
});

describe('workspace episode integration', () => {
  test('composes bindings, facts, signals, and agency activations into a realistic episode', () => {
    const initial = createEmptyWorkspace();
    const episode: readonly Effect[] = [
      { action: 'bind_pronome', roleId: 'SUPPLIER', value: 'supplier_1' },
      { action: 'bind_pronome', roleId: 'COMPONENT', value: 'component_1' },
      { action: 'bind_pronome', roleId: 'SHIPMENT', value: 'shipment_1' },
      { action: 'record_fact', key: 'inventory.daysRemaining', value: 1 },
      { action: 'record_fact', key: 'shipment.status', value: 'delayed' },
      { action: 'emit_polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.8) },
      { action: 'emit_polyneme', conceptId: 'SUPPLIER_RELIABILITY_RISK', strength: activation(0.6) },
      { action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.7) },
      { action: 'activate_agency', agencyId: 'LOGISTICS_ASSESSMENT', amount: activation(0.5) },
      { action: 'invoke_isonome', operationId: 'VERIFY', strength: activation(0.4) },
    ];

    const workspace = episode.reduce((state, effect) => applyEffect(state, effect), initial);

    expect(workspace.facts).toEqual({ 'inventory.daysRemaining': 1, 'shipment.status': 'delayed' });
    expect(workspace.pronomes.map(p => ({ roleId: p.roleId, value: p.value }))).toEqual([
      { roleId: 'SUPPLIER', value: 'supplier_1' },
      { roleId: 'COMPONENT', value: 'component_1' },
      { roleId: 'SHIPMENT', value: 'shipment_1' },
    ]);
    expect(workspace.polynemes).toEqual([
      { kind: 'polyneme', conceptId: 'SHIPMENT_DELAY', strength: activation(0.8) },
      { kind: 'polyneme', conceptId: 'SUPPLIER_RELIABILITY_RISK', strength: activation(0.6) },
    ]);
    expect(workspace.agencyActivations).toEqual([
      { agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.7) },
      { agencyId: 'LOGISTICS_ASSESSMENT', activation: activation(0.5) },
    ]);
    expect(workspace.isonomes).toEqual([
      { kind: 'isonome', operationId: 'VERIFY', strength: activation(0.4) },
    ]);
    expect(initial).toStrictEqual(createEmptyWorkspace());
  });
});
