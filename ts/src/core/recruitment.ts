import type { Agency } from "./agency";
import type { AgencyActivation, AgencyId } from "./types";

export function recruitAgencyIds(
  agencyActivations: readonly AgencyActivation[],
  agencies: readonly Agency[],
): AgencyId[] {
  return agencyActivations.flatMap<AgencyId>(agencyActivation => {
    const agency = agencies.find(agency => agency.id === agencyActivation.agencyId);

    if (!agency) throw new Error(`Missing agency configuration: ${agencyActivation.agencyId}`);

    return agencyActivation.activation >= agency.threshold ? [agency.id] : [];
  });
}
