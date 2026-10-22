import { expect, test } from 'vitest';
import { activation } from './activation';
import { type Effect, exhaustive } from './effect';

const effects: Effect[] = [
	{ action: "bind_pronome", roleId: "SUPPLIER", value: "" },
	{ action: "record_fact", key: "", value: "" },
	{
		action: "emit_polyneme",
		conceptId: "SHIPMENT_DELAY",
		strength: activation(0.4),
	},
	{ action: "invoke_isonome", operationId: "VERIFY", strength: activation(0.7) },
	{ action: "activate_agency", agencyId: "SUPPLIER_ASSESSMENT", amount: activation(.2) },
	{ action: "inhibit_agency", agencyId: "COMPLIANCE_ASSESSMENT", amount: activation(.5) },
];


test.each(effects)('allow all valid effect types', (effect) => {
  expect(exhaustive(effect)).toBeUndefined();
});

test("throw when an unknown effect is provided", () => {
  // @ts-expect-error
	expect(() => exhaustive({ action: 'unknown_effect', key: '', value: ''})).toThrow();
});
