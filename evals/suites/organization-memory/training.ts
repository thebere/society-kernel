import { agencies } from "../../../ts/src/domains/supply-chain/agencies";
import { consolidateKLine } from "../../../ts/src/domains/supply-chain/memory";
import type { KLine } from "../../../ts/src/memory/types";
import { activation } from "../../../ts/src/primitives/activation";
import { runCycle } from "../../../ts/src/society/cycle";
import { createWorkspace } from "./baselines";
import { executeAssessments } from "./capabilities";
import { scoreTask } from "./scorer";
import type { MemoryBank, TaskCase } from "./types";

export async function formMemories(cases: readonly TaskCase[]) {
  const klines: KLine[] = [];
  const episodes: MemoryBank["episodes"][number][] = [];
  const measurements = [];
  for (const task of cases) {
    const cycle = runCycle(createWorkspace(task.observation), agencies);
    const work = await executeAssessments(cycle.workspace, cycle.dispatches);
    const score = scoreTask(task.requiredFindings, work.executions.map(result => result.value));
    const kline = consolidateKLine(`kline_${task.id}`, cycle, activation(score.coverage));
    klines.push(kline);
    episodes.push({ id: kline.id, signature: kline.signature, observation: task.observation,
      advice: { agencyIds: [...cycle.recruitedAgencyIds] } });
    measurements.push({ caseId: task.id, dispatches: cycle.dispatches.length, executions: work.executions.length,
      coverage: score.coverage, storedActivationEntries: kline.agencyActivations.length });
  }
  return { bank: { klines, episodes }, measurements };
}
