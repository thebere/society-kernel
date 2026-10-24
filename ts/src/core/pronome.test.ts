import { describe, expect, test } from 'vitest';

import { Pronome } from './pronome';

describe('Pronome', () => {
  test('pronome should bind to new value keeping the existing roleId', () => {
    const ROLE_ID = 'CARRIER';
    const FIRST_CARRIER = 'carrier_delta';
    const SECOND_CARRIER = 'carrier_echo';

    const firstCarrierPronome = new Pronome(ROLE_ID, FIRST_CARRIER);

    expect(firstCarrierPronome.roleId).toBe(ROLE_ID);
    expect(firstCarrierPronome.value).toBe(FIRST_CARRIER);

    const secondCarrierPronome = firstCarrierPronome.bind(SECOND_CARRIER);

    expect(secondCarrierPronome.roleId).toBe(ROLE_ID);
    expect(secondCarrierPronome.value).toBe(SECOND_CARRIER);
    expect(firstCarrierPronome.roleId).toBe(ROLE_ID);
    expect(firstCarrierPronome.value).toBe(FIRST_CARRIER);
  });
});
