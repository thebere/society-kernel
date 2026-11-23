import type { Activation } from "../primitives/activation";
import type { AgencyId, ConceptId, OperationId } from "../primitives/types";

type Sensitivities = Readonly<
  Partial<Record<ConceptId, Activation>>
>;

export type Agency = {
  id: AgencyId;
  threshold: Activation;
  sensitivities: Sensitivities;
  supportedOperations: readonly OperationId[];
};
