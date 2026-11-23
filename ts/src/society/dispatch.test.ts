import { describe, expect, expectTypeOf, test } from 'vitest';
import { agencies } from "../domains/supply-chain/agencies";
import { agencyIds, operationIds } from "../domains/supply-chain/types";
import { activation } from '../primitives/activation';
import type { AgencyId, Isonome } from "../primitives/types";
import { applyEffect, type Effect } from '../workspace/effect';
import { createEmptyWorkspace } from '../workspace/workspace';
import type { Agency } from "./agency";
import { type AgencyOperationDispatch, dispatchIsonome } from './dispatch';
import { recruitAgencyIds } from './recruitment';

const verify: Isonome = {
  kind: 'isonome', operationId: 'VERIFY', strength: activation(0.8),
};
const coalition: readonly AgencyId[] = ['SUPPLIER_ASSESSMENT', 'LOGISTICS_ASSESSMENT', 'PROCUREMENT_STRATEGY'];

describe('dispatchIsonome', () => {
  test('dispatches to one recruited agency that supports the operation', () => {
    expect(dispatchIsonome(verify, ['SUPPLIER_ASSESSMENT'], agencies)).toEqual([
      { agencyId: 'SUPPLIER_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
    ]);
  });

  test('broadcasts the full signal to multiple eligible agencies', () => {
    const recruitedAgencyIds: readonly AgencyId[] = [
      'SUPPLIER_ASSESSMENT', 'LOGISTICS_ASSESSMENT', 'COMPLIANCE_ASSESSMENT',
    ];

    expect(dispatchIsonome(verify, recruitedAgencyIds, agencies)).toEqual([
      { agencyId: 'SUPPLIER_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
      { agencyId: 'LOGISTICS_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
      { agencyId: 'COMPLIANCE_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
    ]);
  });

  test('excludes a recruited agency that does not support the operation', () => {
    expect(dispatchIsonome(verify, ['PROCUREMENT_STRATEGY'], agencies)).toEqual([]);
  });

  test('excludes capable agencies that were not recruited', () => {
    const dispatches = dispatchIsonome(verify, ['SUPPLIER_ASSESSMENT'], agencies);

    expect(dispatches.map(dispatch => dispatch.agencyId)).toEqual(['SUPPLIER_ASSESSMENT']);
    expect(dispatches.some(dispatch => dispatch.agencyId === 'COMPLIANCE_ASSESSMENT')).toBe(false);
  });

  test('filters unsupported members from a mixed coalition', () => {
    expect(dispatchIsonome(verify, coalition, agencies)).toEqual([
      { agencyId: 'SUPPLIER_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
      { agencyId: 'LOGISTICS_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
    ]);
  });

  test('different operations select different recipients from the same coalition', () => {
    const escalate: Isonome = {
      kind: 'isonome', operationId: 'ESCALATE', strength: activation(0.6),
    };

    expect(dispatchIsonome(verify, coalition, agencies).map(dispatch => dispatch.agencyId)).toEqual([
      'SUPPLIER_ASSESSMENT', 'LOGISTICS_ASSESSMENT',
    ]);
    expect(dispatchIsonome(escalate, coalition, agencies)).toEqual([
      { agencyId: 'LOGISTICS_ASSESSMENT', operationId: 'ESCALATE', strength: activation(0.6) },
      { agencyId: 'PROCUREMENT_STRATEGY', operationId: 'ESCALATE', strength: activation(0.6) },
    ]);
  });

  test.each([0.2, 0.65, 1])('preserves strength %s exactly for every recipient', (strength) => {
    const isonome: Isonome = { ...verify, strength: activation(strength) };
    const recruitedAgencyIds: readonly AgencyId[] = ['SUPPLIER_ASSESSMENT', 'LOGISTICS_ASSESSMENT'];

    expect(dispatchIsonome(isonome, recruitedAgencyIds, agencies)).toEqual([
      { agencyId: 'SUPPLIER_ASSESSMENT', operationId: 'VERIFY', strength: isonome.strength },
      { agencyId: 'LOGISTICS_ASSESSMENT', operationId: 'VERIFY', strength: isonome.strength },
    ]);
  });

  test('a zero-strength isonome produces no dispatches', () => {
    expect(dispatchIsonome({ ...verify, strength: activation(0) }, agencyIds, agencies)).toEqual([]);
  });

  test.each(operationIds)('an empty coalition receives no %s dispatches', (operationId) => {
    expect(dispatchIsonome({ ...verify, operationId }, [], agencies)).toEqual([]);
  });

  test('rejects missing configuration for any recruited agency', () => {
    const configuration = agencies.filter(agency => agency.id === 'SUPPLIER_ASSESSMENT');

    expect(() => dispatchIsonome(verify, ['SUPPLIER_ASSESSMENT', 'COMPLIANCE_ASSESSMENT'], configuration))
      .toThrow('Missing agency configuration: COMPLIANCE_ASSESSMENT');
  });

  test('validates recruited configuration even for a zero-strength signal', () => {
    expect(() => dispatchIsonome({ ...verify, strength: activation(0) }, ['SUPPLIER_ASSESSMENT'], []))
      .toThrow('Missing agency configuration: SUPPLIER_ASSESSMENT');
  });

  test('preserves recruited order after filtering regardless of configuration order', () => {
    const recruitedAgencyIds: readonly AgencyId[] = [
      'LOGISTICS_ASSESSMENT', 'PROCUREMENT_STRATEGY', 'SUPPLIER_ASSESSMENT', 'COMPLIANCE_ASSESSMENT',
    ];

    expect(dispatchIsonome(verify, recruitedAgencyIds, [...agencies].reverse())).toEqual([
      { agencyId: 'LOGISTICS_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
      { agencyId: 'SUPPLIER_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
      { agencyId: 'COMPLIANCE_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
    ]);
  });

  test('does not reevaluate thresholds or sensitivities for recruited agencies', () => {
    const configuration: readonly Agency[] = [{
      id: 'SUPPLIER_ASSESSMENT',
      threshold: activation(1),
      sensitivities: {},
      supportedOperations: ['VERIFY'],
    }];
    const isonome: Isonome = { ...verify, strength: activation(0.2) };

    expect(dispatchIsonome(isonome, ['SUPPLIER_ASSESSMENT'], configuration)).toEqual([
      { agencyId: 'SUPPLIER_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.2) },
    ]);
  });

  test('is deterministic and leaves all frozen inputs unchanged', () => {
    const isonome = Object.freeze({ ...verify });
    const recruitedAgencyIds = Object.freeze([...coalition]);
    const configuration = Object.freeze(agencies.map(agency => Object.freeze({
      ...agency,
      sensitivities: Object.freeze({ ...agency.sensitivities }),
      supportedOperations: Object.freeze([...agency.supportedOperations]),
    })));
    const snapshot = structuredClone({ isonome, recruitedAgencyIds, configuration });

    const first = dispatchIsonome(isonome, recruitedAgencyIds, configuration);
    const second = dispatchIsonome(isonome, recruitedAgencyIds, configuration);

    expect(first).toHaveLength(2);
    expect(first).toStrictEqual(second);
    expect({ isonome, recruitedAgencyIds, configuration }).toStrictEqual(snapshot);
  });

  test('dispatch values are separate from workspace effects', () => {
    expectTypeOf<AgencyOperationDispatch>().not.toExtend<Effect>();
  });

  test('v0.1 agency configuration does not yet dispatch RESOLVE', () => {
    expect(operationIds).toContain('RESOLVE');
    for (const agency of agencies) {
      expect(agency.supportedOperations).not.toContain('RESOLVE');
    }
    expect(dispatchIsonome({ ...verify, operationId: 'RESOLVE' }, agencyIds, agencies)).toEqual([]);
  });
});

describe('recruitment and isonome dispatch integration', () => {
  test('different operations reach different capable subsets of the recruited coalition without changing state', () => {
    const episode: readonly Effect[] = [
      { action: 'activate_agency', agencyId: 'SUPPLIER_ASSESSMENT', amount: activation(0.6) },
      { action: 'activate_agency', agencyId: 'LOGISTICS_ASSESSMENT', amount: activation(0.7) },
      { action: 'activate_agency', agencyId: 'PRODUCTION_ASSESSMENT', amount: activation(0.8) },
      { action: 'activate_agency', agencyId: 'COMPLIANCE_ASSESSMENT', amount: activation(0.9) },
      { action: 'activate_agency', agencyId: 'PROCUREMENT_STRATEGY', amount: activation(0.6) },
      { action: 'activate_agency', agencyId: 'RISK_ASSESSMENT', amount: activation(0.3) },
      { action: 'activate_agency', agencyId: 'INVENTORY_ASSESSMENT', amount: activation(0.3) },
      { action: 'activate_agency', agencyId: 'CUSTOMER_COMMITMENT', amount: activation(0.4) },
      { action: 'invoke_isonome', operationId: 'VERIFY', strength: activation(0.8) },
      { action: 'invoke_isonome', operationId: 'ESCALATE', strength: activation(0.6) },
    ];
    const workspace = episode.reduce((state, effect) => applyEffect(state, effect), createEmptyWorkspace());
    const snapshot = structuredClone(workspace);

    const recruitedAgencyIds = recruitAgencyIds(workspace.agencyActivations, agencies);

    expect(recruitedAgencyIds).toEqual([
      'SUPPLIER_ASSESSMENT', 'LOGISTICS_ASSESSMENT', 'PRODUCTION_ASSESSMENT',
      'COMPLIANCE_ASSESSMENT', 'PROCUREMENT_STRATEGY',
    ]);
    expect(workspace.isonomes).toHaveLength(2);
    expect(dispatchIsonome(workspace.isonomes[0], recruitedAgencyIds, agencies)).toEqual([
      { agencyId: 'SUPPLIER_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
      { agencyId: 'LOGISTICS_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
      { agencyId: 'PRODUCTION_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
      { agencyId: 'COMPLIANCE_ASSESSMENT', operationId: 'VERIFY', strength: activation(0.8) },
    ]);
    expect(dispatchIsonome(workspace.isonomes[1], recruitedAgencyIds, agencies)).toEqual([
      { agencyId: 'LOGISTICS_ASSESSMENT', operationId: 'ESCALATE', strength: activation(0.6) },
      { agencyId: 'PRODUCTION_ASSESSMENT', operationId: 'ESCALATE', strength: activation(0.6) },
      { agencyId: 'COMPLIANCE_ASSESSMENT', operationId: 'ESCALATE', strength: activation(0.6) },
      { agencyId: 'PROCUREMENT_STRATEGY', operationId: 'ESCALATE', strength: activation(0.6) },
    ]);
    expect(workspace).toStrictEqual(snapshot);
  });
});
