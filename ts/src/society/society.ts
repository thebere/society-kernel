import type { WorkspaceState } from "../workspace/workspace";
import type { Agency } from "./agency";


export class Society {
	readonly _workspace: WorkspaceState;
	readonly _agencies: Agency[];

	constructor(workspace: WorkspaceState, agencies: Agency[]) {
    this._workspace = workspace;
    this._agencies = agencies;
	}
}
