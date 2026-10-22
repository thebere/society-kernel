// agency.ts

import type { Activation } from "./activation";
import type { AgencyId } from "./types";

export type Agency = {
  id: AgencyId;
  threshold: Activation;
};
