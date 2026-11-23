import { agencies } from "../../../ts/src/domains/supply-chain/agencies";
import { deriveSituationSignature } from "../../../ts/src/domains/supply-chain/memory";
import { agencyIds } from "../../../ts/src/domains/supply-chain/types";
import { recallKLines, situationSimilarity } from "../../../ts/src/memory/kline";
import { reinstatementEffects } from "../../../ts/src/memory/reinstatement";
import { similarity } from "../../../ts/src/memory/similarity";
import { activation } from "../../../ts/src/primitives/activation";
import type { AgencyId, ConceptId } from "../../../ts/src/primitives/types";
import { runCycle } from "../../../ts/src/society/cycle";
import { dispatchIsonome } from "../../../ts/src/society/dispatch";
import { type ActivateAgency, applyEffect } from "../../../ts/src/workspace/effect";
import { createEmptyWorkspace } from "../../../ts/src/workspace/workspace";
import type { Condition, MemoryBank, Observation, SelectionKind } from "./types";

// Broad, semantic routing table, fixed before scored runs. Signal presence rather
// than Society thresholds determines selection; labels are never arguments.
export const routingTable: Readonly<Record<ConceptId, readonly AgencyId[]>> = {
  SHIPMENT_DELAY: ["LOGISTICS_ASSESSMENT", "INVENTORY_ASSESSMENT"],
  INVENTORY_RISK: ["INVENTORY_ASSESSMENT", "PRODUCTION_ASSESSMENT"],
  SUPPLIER_RELIABILITY_RISK: ["SUPPLIER_ASSESSMENT", "PROCUREMENT_STRATEGY", "RISK_ASSESSMENT"],
  PRODUCTION_IMPACT: ["PRODUCTION_ASSESSMENT", "RISK_ASSESSMENT", "CUSTOMER_COMMITMENT"],
  ALTERNATIVE_SUPPLIER_AVAILABLE: ["PROCUREMENT_STRATEGY", "COMPLIANCE_ASSESSMENT"],
  COMPLIANCE_UNVERIFIED: ["COMPLIANCE_ASSESSMENT"],
  HIGH_PRIORITY_ORDER: ["CUSTOMER_COMMITMENT", "PRODUCTION_ASSESSMENT"],
  REPEAT_DISRUPTION: ["SUPPLIER_ASSESSMENT", "PROCUREMENT_STRATEGY", "RISK_ASSESSMENT"],
  ROUTE_DISRUPTION: ["LOGISTICS_ASSESSMENT"],
  QUALITY_RISK: ["COMPLIANCE_ASSESSMENT", "SUPPLIER_ASSESSMENT", "RISK_ASSESSMENT"],
  CUSTOMER_COMMITMENT_RISK: ["CUSTOMER_COMMITMENT", "RISK_ASSESSMENT"],
};

export function createWorkspace(observation: Observation) {
  let workspace = createEmptyWorkspace();
  for (const [key, value] of Object.entries(observation.facts)) workspace = applyEffect(workspace, { action: "record_fact", key, value });
  for (const binding of observation.bindings) workspace = applyEffect(workspace, { action: "bind_pronome", roleId: binding.roleId, value: binding.value });
  for (const concept of observation.concepts) workspace = applyEffect(workspace, { action: "emit_polyneme", conceptId: concept.id, strength: activation(concept.strength) });
  for (const operationId of ["VERIFY", "COMPARE"] as const) workspace = applyEffect(workspace, { action: "invoke_isonome", operationId, strength: activation(1) });
  return workspace;
}

export function directRoute(observation: Observation): readonly AgencyId[] {
  const selected = new Set(observation.concepts.filter(concept => concept.strength > 0).flatMap(concept => routingTable[concept.id]));
  return agencyIds.filter(id => selected.has(id));
}

export function selectOrganization(condition: Condition, observation: Observation, memories: MemoryBank) {
  const workspace = createWorkspace(observation);
  let selectedMemoryId: string | null = null;
  let selectedSimilarity: number | null = null;
  let contributions: readonly ActivateAgency[] = [];
  let selectionKind: SelectionKind = "threshold-recruitment";
  let selected: readonly AgencyId[];
  const recruited: readonly AgencyId[] = [];
  let currentWorkspace = workspace;
  const trace: ReturnType<typeof runCycle>["trace"] = [];
  if (condition === "organization-memory") {
    const match = recallKLines(deriveSituationSignature(workspace), memories.klines, similarity(0))[0];
    if (match) {
      selectedMemoryId = match.kline.id;
      selectedSimilarity = match.similarity;
      contributions = reinstatementEffects(match);
      currentWorkspace = contributions.reduce(applyEffect, workspace);
    }
  }
  if (condition === "no-memory" || condition === "organization-memory") {
    const cycle = runCycle(currentWorkspace, agencies);
    return { workspace: cycle.workspace, dispatches: cycle.dispatches, trace: cycle.trace,
      selected: cycle.recruitedAgencyIds, recruited: cycle.recruitedAgencyIds,
      selectedMemoryId, selectedSimilarity, contributions, selectionKind };
  }
  if (condition === "direct-routing") {
    selectionKind = "direct-routing";
    selected = directRoute(observation);
  } else {
    const signature = deriveSituationSignature(workspace);
    const matches = memories.episodes.map(episode => ({ episode, score: situationSimilarity(signature, episode.signature) }))
      .filter(match => match.score > 0).sort((a, b) => b.score - a.score || (a.episode.id < b.episode.id ? -1 : a.episode.id > b.episode.id ? 1 : 0));
    const match = matches[0];
    selectionKind = match ? "episode-replay" : "direct-routing";
    selected = match ? match.episode.advice.agencyIds : directRoute(observation);
    selectedMemoryId = match?.episode.id ?? null;
    selectedSimilarity = match?.score ?? null;
  }
  const dispatches = workspace.isonomes.flatMap(isonome => dispatchIsonome(isonome, selected, agencies));
  return { workspace, dispatches, trace, selected, recruited, selectedMemoryId, selectedSimilarity, contributions, selectionKind };
}
