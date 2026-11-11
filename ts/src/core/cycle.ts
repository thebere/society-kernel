import type { Activation } from "./activation";
import type { Agency } from "./agency";
import {
  dispatchIsonome,
  type AgencyOperationDispatch,
} from "./dispatch";
import {
  applyEffect,
  type ActivateAgency,
} from "./effect";
import { propagation } from "./propagation";
import { recruitAgencyIds } from "./recruitment";
import type {
  AgencyId,
  ConceptId,
  OperationId,
} from "./types";
import type { WorkspaceState } from "./workspace";

export type PolynemePropagationTrace = {
  readonly kind: "polyneme_propagation";
  readonly conceptId: ConceptId;
  readonly strength: Activation;
  readonly effects: readonly ActivateAgency[];
};

export type EffectAppliedTrace = {
  readonly kind: "effect_applied";
  readonly source: "polyneme_propagation";
  readonly effect: ActivateAgency;
};

export type AgencyRecruitmentTrace = {
  readonly kind: "agency_recruitment";
  readonly agencyId: AgencyId;
  readonly activation: Activation;
  readonly threshold: Activation;
  readonly recruited: boolean;
};

export type IsonomeDispatchTrace = {
  readonly kind: "isonome_dispatch";
  readonly operationId: OperationId;
  readonly strength: Activation;
  readonly dispatches: readonly AgencyOperationDispatch[];
};

export type TraceEvent =
  | PolynemePropagationTrace
  | EffectAppliedTrace
  | AgencyRecruitmentTrace
  | IsonomeDispatchTrace;

export type CycleResult = {
  readonly workspace: WorkspaceState;
  readonly recruitedAgencyIds: readonly AgencyId[];
  readonly dispatches: readonly AgencyOperationDispatch[];
  readonly trace: readonly TraceEvent[];
};

export function runCycle(
  workspace: WorkspaceState,
  agencies: readonly Agency[],
): CycleResult {
  let nextWorkspace = workspace;

  const trace: TraceEvent[] = [];

  for (const polyneme of workspace.polynemes) {
    const effects = propagation(polyneme, agencies);

    trace.push({
      kind: "polyneme_propagation",
      conceptId: polyneme.conceptId,
      strength: polyneme.strength,
      effects,
    });

    for (const effect of effects) {
      nextWorkspace = applyEffect(nextWorkspace, effect);

      trace.push({
        kind: "effect_applied",
        source: "polyneme_propagation",
        effect,
      });
    }
  }

  const recruitedAgencyIds = recruitAgencyIds(
    nextWorkspace.agencyActivations,
    agencies,
  );

  const recruitedAgencyIdSet = new Set(recruitedAgencyIds);

  for (const agencyActivation of nextWorkspace.agencyActivations) {
    const agency = agencies.find(
      agency => agency.id === agencyActivation.agencyId,
    );

    if (!agency) {
      throw new Error(
        `Missing agency configuration: ${agencyActivation.agencyId}`,
      );
    }

    trace.push({
      kind: "agency_recruitment",
      agencyId: agency.id,
      activation: agencyActivation.activation,
      threshold: agency.threshold,
      recruited: recruitedAgencyIdSet.has(agency.id),
    });
  }

  const dispatches: AgencyOperationDispatch[] = [];

  for (const isonome of nextWorkspace.isonomes) {
    const currentDispatches = dispatchIsonome(
      isonome,
      recruitedAgencyIds,
      agencies,
    );

    trace.push({
      kind: "isonome_dispatch",
      operationId: isonome.operationId,
      strength: isonome.strength,
      dispatches: currentDispatches,
    });

    dispatches.push(...currentDispatches);
  }

  return {
    workspace: nextWorkspace,
    recruitedAgencyIds,
    dispatches,
    trace,
  };
}