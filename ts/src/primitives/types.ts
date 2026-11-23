import type { AgencyId, ConceptId, OperationId } from "../domains/supply-chain/types";
import type { Activation } from "./activation";

// Preserve the existing closed identifier unions. This is a type-only domain
// dependency, not a generalized domain contract (see docs/architecture.md).
export type { AgencyId, ConceptId, OperationId, RoleId } from "../domains/supply-chain/types";

export type AgencyActivation = {
  agencyId: AgencyId;
  activation: Activation;
}

export type Polyneme = {
  kind: 'polyneme';
  conceptId: ConceptId;
  strength: Activation;
};

export type Isonome = {
  kind: 'isonome',
  operationId: OperationId;
  strength: Activation;
};
