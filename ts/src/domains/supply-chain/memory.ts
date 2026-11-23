import {
  consolidateKLine as consolidate,
  deriveSituationSignature as derive,
} from "../../memory/kline";
import type { KLine, KLineId, SituationSignature } from "../../memory/types";
import type { Activation } from "../../primitives/activation";
import type { CycleResult } from "../../society/cycle";
import type { WorkspaceState } from "../../workspace/workspace";
import { agencyIds, conceptIds, operationIds, roleIds } from "./types";

/** Preserve the reference domain's canonical signature and original call shape. */
export function deriveSituationSignature(workspace: WorkspaceState): SituationSignature {
  return derive(workspace, conceptIds);
}

/** Bind the existing canonical identity order without changing consolidation. */
export function consolidateKLine(id: KLineId, cycle: CycleResult, utility: Activation): KLine {
  return consolidate(id, cycle, utility, { agencyIds, conceptIds, roleIds, operationIds });
}
