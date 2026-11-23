import type { Agency } from "./agency";
import type { AgencyOperationDispatch } from "./dispatch";
import type { AgencyId, OperationId } from "./types";
import type { WorkspaceState } from "./workspace";

export type AgencyExecutionContext = {
  readonly workspace: WorkspaceState;
  readonly dispatch: Readonly<AgencyOperationDispatch>;
};

/** Handlers read caller-owned context and return local data, without mutation. */
export type AgencyOperationHandler<T = unknown> = (
  context: AgencyExecutionContext,
) => T | Promise<T>;

export type AgencyRuntime = {
  readonly agencyId: AgencyId;
  readonly operations: Readonly<Partial<Record<OperationId, AgencyOperationHandler>>>;
};

export type AgencyOperationResult<T = unknown> = {
  readonly agencyId: AgencyId;
  readonly operationId: OperationId;
  readonly value: T;
};

/**
 * Execute one routed request outside the Society cycle. Configuration remains
 * authoritative for operation support; runtime handlers supply implementations.
 * Results are data only and are never interpreted as Workspace Effects.
 */
export async function executeDispatch(
  dispatch: Readonly<AgencyOperationDispatch>,
  workspace: WorkspaceState,
  agencies: readonly Agency[],
  runtimes: readonly AgencyRuntime[],
): Promise<AgencyOperationResult> {
  const { agencyId, operationId } = dispatch;
  const agency = agencies.find(candidate => candidate.id === agencyId);

  if (!agency) throw new Error(`Missing agency configuration: ${agencyId}`);

  if (!agency.supportedOperations.includes(operationId)) {
    throw new Error(`Unsupported operation: ${agencyId}.${operationId}`);
  }

  const runtime = runtimes.find(candidate => candidate.agencyId === agencyId);

  if (!runtime) throw new Error(`Missing agency runtime: ${agencyId}`);

  const handler = runtime.operations[operationId];

  if (!handler) {
    throw new Error(`Missing operation implementation: ${agencyId}.${operationId}`);
  }

  const value = await handler({ workspace, dispatch });

  return { agencyId, operationId, value };
}
