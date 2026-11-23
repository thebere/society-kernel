
import type { AgencyActivation, Isonome, Polyneme } from "../primitives/types";
import type { Pronome } from "./pronome";

export type WorkspaceState = {
	readonly facts: Readonly<Record<string, unknown>>;
  readonly pronomes: readonly Pronome<unknown>[];
  readonly polynemes: readonly Polyneme[];
  readonly isonomes: readonly Isonome[];
  readonly agencyActivations: readonly AgencyActivation[];
};

export function createEmptyWorkspace(): WorkspaceState {
  return {
  	facts: {},
  	pronomes: [],
  	polynemes: [],
  	isonomes: [],
  	agencyActivations: [],
  }
};
