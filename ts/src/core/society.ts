import { activation } from "./activation";
import type { Agency } from "./agency";
import { type ActivateAgency, type Effect, applyEffect } from "./effect";
import type { ConceptId, Polyneme } from "./types";
import type { WorkspaceState } from "./workspace";


class SocietyKernel {
	readonly _workspace: WorkspaceState;
	readonly _agencies: Agency[];

	constructor(workspace: WorkspaceState, agencies: Agency[]) {
    this._workspace = workspace;
    this._agencies = agencies;
	}

//   propagate(conceptId: ConceptId) {
//     const found = this._workspace.polynemes.find((p) => p.conceptId === conceptId);
//
//     if (found) {
//       // Product effect???
//       this._agencies.forEach((agency) => {
//         if (agency.sensitivities?.[found.conceptId]) {
//           return { ...agency, sen}
//         }
//         applyEffect()
//       })
//
//       applyEffect(this._workspace, {
//         action: 'activate_agency',
//         agencyId: found.
//       })
//     }
// 	}
}



