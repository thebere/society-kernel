import type { Activation } from "../primitives/activation";
import type { AgencyId, Isonome, OperationId } from "../primitives/types";
import type { Agency } from "./agency";

export type AgencyOperationDispatch = {
  agencyId: AgencyId;
  operationId: OperationId;
  strength: Activation;
};

export function dispatchIsonome(
  isonome: Isonome,
  recruitedAgencyIds: readonly AgencyId[],
  agencies: readonly Agency[],
): AgencyOperationDispatch[] {
  const recruitedAgencies = recruitedAgencyIds.map(agencyId => {
    const agency = agencies.find(agency => agency.id === agencyId);

    if (!agency) throw new Error(`Missing agency configuration: ${agencyId}`);

    return agency;
  });

  if (isonome.strength === 0) return [];

  return recruitedAgencies.flatMap<AgencyOperationDispatch>(agency => {
    if (!agency.supportedOperations.includes(isonome.operationId)) return [];

    return [{
      agencyId: agency.id,
      operationId: isonome.operationId,
      strength: isonome.strength,
    }];
  });
}
