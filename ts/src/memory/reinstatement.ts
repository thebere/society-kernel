import { activation } from "../primitives/activation";
import type { ActivateAgency } from "../workspace/effect";
import type { KLineMatch } from "./kline";

/**
 * Derive one memory's activation prior in stored (consolidated canonical) order.
 * The caller applies Effects and controls their ordering relative to evidence.
 * Recall, recruitment, utility, roles, and operations remain separate.
 */
export function reinstatementEffects(match: KLineMatch): readonly ActivateAgency[] {
  return match.kline.agencyActivations.flatMap<ActivateAgency>(stored => {
    const amount = activation(stored.activation * match.similarity);

    if (amount === 0) return [];

    return [{
      action: "activate_agency",
      agencyId: stored.agencyId,
      amount,
    }];
  });
}
