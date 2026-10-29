import type { Agency } from "./agency";
import type { WorkspaceState } from "./workspace";


export class Society {
	readonly _workspace: WorkspaceState;
	readonly _agencies: Agency[];

	constructor(workspace: WorkspaceState, agencies: Agency[]) {
    this._workspace = workspace;
    this._agencies = agencies;
	}
}
