import { describe, expect, test } from 'vitest';
import { activation } from './activation';
import { agencies, type Agency } from './agency';
import { recruitAgencyIds } from './recruitment';
import type { AgencyActivation } from './types';

describe('recruitAgencyIds', () => {
  test.each([
    { strength: 0.49, recruited: false },
    { strength: 0.5, recruited: true },
    { strength: 0.8, recruited: true },
  ])('activation $strength recruits the agency: $recruited', ({ strength, recruited }) => {
    const agencyActivations: readonly AgencyActivation[] = [
      { agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(strength) },
    ];

    expect(recruitAgencyIds(agencyActivations, agencies)).toEqual(recruited ? ['SUPPLIER_ASSESSMENT'] : []);
  });

  test('agencies without activation entries are not recruited', () => {
    expect(recruitAgencyIds([], agencies)).toEqual([]);
  });

  test('preserves activation order after filtering agencies below threshold', () => {
    const agencyActivations: readonly AgencyActivation[] = [
      { agencyId: 'LOGISTICS_ASSESSMENT', activation: activation(0.7) },
      { agencyId: 'RISK_ASSESSMENT', activation: activation(0.2) },
      { agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.6) },
    ];

    expect(recruitAgencyIds(agencyActivations, agencies)).toEqual(['LOGISTICS_ASSESSMENT', 'SUPPLIER_ASSESSMENT']);
  });

  test('rejects an activation whose agency configuration is missing', () => {
    expect(() => recruitAgencyIds([
      { agencyId: 'SUPPLIER_ASSESSMENT', activation: activation(0.8) },
    ], [])).toThrow('Missing agency configuration: SUPPLIER_ASSESSMENT');
  });

  test('is deterministic and does not mutate activation or configuration inputs', () => {
    const agencyActivations = Object.freeze([
      Object.freeze({ agencyId: 'SUPPLIER_ASSESSMENT' as const, activation: activation(0.6) }),
    ]);
    const configuration: readonly Agency[] = Object.freeze([
      Object.freeze({
        id: 'SUPPLIER_ASSESSMENT' as const,
        threshold: activation(0.5),
        sensitivities: Object.freeze({}),
        supportedOperations: Object.freeze([]),
      }),
    ]);
    const snapshot = structuredClone({ agencyActivations, configuration });

    expect(recruitAgencyIds(agencyActivations, configuration)).toEqual(['SUPPLIER_ASSESSMENT']);
    expect(recruitAgencyIds(agencyActivations, configuration)).toEqual(['SUPPLIER_ASSESSMENT']);
    expect({ agencyActivations, configuration }).toStrictEqual(snapshot);
  });
});
