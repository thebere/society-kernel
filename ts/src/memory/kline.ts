import type { Activation } from "../primitives/activation";
import type { AgencyActivation, AgencyId, ConceptId, OperationId, RoleId } from "../primitives/types";
import type { CycleResult } from "../society/cycle";
import type { WorkspaceState } from "../workspace/workspace";
import {
  type Similarity,
  similarity,
} from "./similarity";
import type { KLine, KLineId, SituationSignature } from "./types";

/** Canonical membership and ordering supplied by the reference-domain binding. */
export type KLineIdentityOrder = {
  readonly agencyIds: readonly AgencyId[];
  readonly conceptIds: readonly ConceptId[];
  readonly roleIds: readonly RoleId[];
  readonly operationIds: readonly OperationId[];
};

export type KLineMatch = {
  readonly kline: KLine;
  readonly similarity: Similarity;
};

/**
 * A v0.1 situation signature is the canonical set of
 * non-zero concepts active in the workspace.
 *
 * Activation magnitude is intentionally excluded.
 */
export function deriveSituationSignature(
  workspace: WorkspaceState,
  conceptIds: readonly ConceptId[],
): SituationSignature {
  const activeConceptIds = new Set(
    workspace.polynemes
      .filter(polyneme => polyneme.strength > 0)
      .map(polyneme => polyneme.conceptId),
  );

  return {
    featureIds: conceptIds.filter(
      conceptId => activeConceptIds.has(conceptId),
    ),
  };
}

/**
 * Consolidate one completed cycle into memory for the
 * cognitive organization that formed.
 *
 * Literal pronome referents are deliberately excluded.
 */
export function consolidateKLine(
  id: KLineId,
  cycle: CycleResult,
  utility: Activation,
  { agencyIds, conceptIds, roleIds, operationIds }: KLineIdentityOrder,
): KLine {
  const recruitedAgencyIds = new Set(
    cycle.recruitedAgencyIds,
  );

  const activationsByAgency = new Map(
    cycle.workspace.agencyActivations.map(
      agencyActivation => [
        agencyActivation.agencyId,
        agencyActivation,
      ] as const,
    ),
  );

  const agencyActivations: AgencyActivation[] =
    agencyIds.flatMap(agencyId => {
      if (!recruitedAgencyIds.has(agencyId)) {
        return [];
      }

      const agencyActivation =
        activationsByAgency.get(agencyId);

      if (!agencyActivation) {
        throw new Error(
          `Missing activation for recruited agency: ${agencyId}`,
        );
      }

      return [{
        agencyId,
        activation: agencyActivation.activation,
      }];
    });

  const boundRoleIds = new Set(
    cycle.workspace.pronomes.map(
      pronome => pronome.roleId,
    ),
  );

  const consolidatedRoleIds = roleIds.filter(
    roleId => boundRoleIds.has(roleId),
  );

  const dispatchedOperationIds = new Set(
    cycle.dispatches.map(
      dispatch => dispatch.operationId,
    ),
  );

  const consolidatedOperationIds =
    operationIds.filter(
      operationId =>
        dispatchedOperationIds.has(operationId),
    );

  return {
    id,
    signature:
      deriveSituationSignature(cycle.workspace, conceptIds),

    agencyActivations,
    roleIds: consolidatedRoleIds,
    operationIds: consolidatedOperationIds,

    utility,
  };
}

/**
 * Jaccard similarity over situation feature sets.
 *
 * Empty signatures deliberately produce zero similarity:
 * absence of features is not treated as evidence of
 * structural similarity.
 */
export function situationSimilarity(
  left: SituationSignature,
  right: SituationSignature,
): Similarity {
  const leftFeatures = new Set(left.featureIds);
  const rightFeatures = new Set(right.featureIds);

  if (leftFeatures.size === 0 || rightFeatures.size === 0) {
    return similarity(0);
  }

  let intersectionSize = 0;

  for (const featureId of leftFeatures) {
    if (rightFeatures.has(featureId)) {
      intersectionSize += 1;
    }
  }

  const unionSize = new Set([
    ...leftFeatures,
    ...rightFeatures,
  ]).size;

  return similarity(intersectionSize / unionSize);
}

/**
 * Recall K-lines whose situation signatures structurally
 * overlap with the current situation.
 *
 * v0.1 retrieval uses concept structure only.
 *
 * Returned memories are ranked by:
 *   1. similarity descending
 *   2. K-line ID ascending
 */
export function recallKLines(
  signature: SituationSignature,
  kLines: readonly KLine[],
  minimumSimilarity: Similarity,
): readonly KLineMatch[] {
  return kLines
    .flatMap<KLineMatch>(kline => {
      const score = situationSimilarity(signature, kline.signature);

      if (score === 0 || score < minimumSimilarity) {
        return [];
      }

      return [{
        kline,
        similarity: score,
      }];
    })
    .sort((left, right) => {
      if (left.similarity !== right.similarity) {
        return right.similarity - left.similarity;
      }

      if (left.kline.id < right.kline.id) {
        return -1;
      }

      if (left.kline.id > right.kline.id) {
        return 1;
      }

      return 0;
    });
}
