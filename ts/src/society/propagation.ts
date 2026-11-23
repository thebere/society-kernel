import { activation } from "../primitives/activation";
import type { Polyneme } from "../primitives/types";
import type { ActivateAgency } from "../workspace/effect";
import type { Agency } from "./agency";

export function propagation(polyneme: Polyneme, agencies: readonly Agency[]): ActivateAgency[] {
  return agencies.flatMap<ActivateAgency>((agency) => {
    const sensitivity = agency.sensitivities[polyneme.conceptId];

    if (!sensitivity) return [];

    const amount = polyneme.strength * sensitivity;

    if (amount === 0) return [];

    return [{
      action: "activate_agency",
      agencyId: agency.id,
      amount: activation(amount),
    }];
	});
};
