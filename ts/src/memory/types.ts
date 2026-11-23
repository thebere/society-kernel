import type { Activation } from "../primitives/activation";
import type { AgencyActivation, ConceptId, OperationId, RoleId } from "../primitives/types";

export type SituationFeatureId = ConceptId;
export type KLineId = `kline_${string}`;

export type SituationSignature = {
	featureIds: readonly SituationFeatureId[];
};

export type KLine = {
  id: KLineId;
  signature: SituationSignature;

  agencyActivations: readonly AgencyActivation[];
  roleIds: readonly RoleId[];
  operationIds: readonly OperationId[];

  utility: Activation;
};
