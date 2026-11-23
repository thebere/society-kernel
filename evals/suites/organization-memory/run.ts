import { selectOrganization } from "./baselines";
import { executeAssessments } from "./capabilities";
import { scoreTask } from "./scorer";
import { formMemories } from "./training";
import { type Condition, classes, conditions, type MemoryBank, type TaskCase } from "./types";

export async function evaluateCase(task: TaskCase, condition: Condition, memories: MemoryBank) {
  // The policy gets only observation. Required findings are introduced after execution.
  const selection = selectOrganization(condition, task.observation, memories);
  const work = await executeAssessments(selection.workspace, selection.dispatches);
  const score = scoreTask(task.requiredFindings, work.executions.map(result => result.value));
  const usesMemory = condition === "organization-memory" || condition === "episode-retrieval";
  return {
    caseId: task.id, caseClass: task.class, description: task.description, condition, status: "completed" as const,
    observation: task.observation, requirements: task.requiredFindings,
    selectedMemoryId: selection.selectedMemoryId, similarity: selection.selectedSimilarity,
    reinstatementContributions: selection.contributions, selectionKind: selection.selectionKind,
    selectedAgencyIds: selection.selected, recruitedAgencyIds: selection.recruited,
    dispatches: selection.dispatches, assessmentCandidates: work.assessmentCandidates,
    skippedForBudget: work.skippedForBudget, executedAgencies: work.executions.map(result => result.agencyId),
    executionOutputs: work.executions, cycleTrace: selection.trace, ...score,
    costs: {
      executionCount: work.executions.length, recruitedCount: selection.recruited.length,
      selectedCount: selection.selected.length, dispatchCount: selection.dispatches.length,
      unnecessaryExecutions: score.unnecessaryExecutions,
      recallComparisons: usesMemory ? memories.klines.length : 0,
      signatureDerivations: usesMemory ? 1 : 0,
      reinstatementEffectCount: selection.contributions.length,
      skippedAssessments: work.skippedForBudget.length,
    },
  };
}
export type Measurement = Awaited<ReturnType<typeof evaluateCase>>;

function aggregate(rows: readonly Measurement[]) {
  if (!rows.length) throw new Error("Cannot aggregate an empty condition");
  const coverage = rows.map(row => row.coverage).sort((a, b) => a - b);
  const mean = (numbers: readonly number[]) => numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  const middle = Math.floor(coverage.length / 2);
  return {
    caseCount: rows.length, meanCoverage: mean(coverage),
    medianCoverage: coverage.length % 2 ? coverage[middle] : (coverage[middle - 1] + coverage[middle]) / 2,
    minCoverage: coverage[0], maxCoverage: coverage[coverage.length - 1],
    meanAgencyExecutions: mean(rows.map(row => row.costs.executionCount)),
    meanRecruitedAgencies: mean(rows.map(row => row.costs.recruitedCount)),
    meanSelectedAgencies: mean(rows.map(row => row.costs.selectedCount)),
    meanDispatchCount: mean(rows.map(row => row.costs.dispatchCount)),
    meanUnnecessaryExecutions: mean(rows.map(row => row.costs.unnecessaryExecutions)),
    meanRecallComparisons: mean(rows.map(row => row.costs.recallComparisons)),
    meanReinstatementEffects: mean(rows.map(row => row.costs.reinstatementEffectCount)),
    perfectCoverageCases: coverage.filter(value => value === 1).length,
    zeroCoverageCases: coverage.filter(value => value === 0).length,
  };
}

export function summarize(rows: readonly Measurement[]) {
  const byCondition = Object.fromEntries(conditions.map(condition => [condition,
    aggregate(rows.filter(row => row.condition === condition)),
  ])) as Record<Condition, ReturnType<typeof aggregate>>;
  const byClass = Object.fromEntries(classes.filter(kind => rows.some(row => row.caseClass === kind)).map(kind => [kind,
    Object.fromEntries(conditions.map(condition => [condition, aggregate(rows.filter(row => row.condition === condition && row.caseClass === kind))])),
  ])) as Record<string, Record<Condition, ReturnType<typeof aggregate>>>;
  const organization = byCondition["organization-memory"];
  const pairs = conditions.filter(condition => condition !== "organization-memory").map(baseline => ({
    baseline,
    meanCoverageDifference: organization.meanCoverage - byCondition[baseline].meanCoverage,
    meanExecutionDifference: organization.meanAgencyExecutions - byCondition[baseline].meanAgencyExecutions,
    byClass: Object.fromEntries(Object.entries(byClass).map(([kind, stats]) => [kind,
      stats["organization-memory"].meanCoverage - stats[baseline].meanCoverage])),
    cases: rows.filter(row => row.condition === "organization-memory").map(row => {
      const other = rows.find(candidate => candidate.caseId === row.caseId && candidate.condition === baseline);
      if (!other) throw new Error(`Missing paired observation: ${baseline}.${row.caseId}`);
      return { caseId: row.caseId, coverageDifference: row.coverage - other.coverage,
        executionDifference: row.costs.executionCount - other.costs.executionCount };
    }),
  }));
  const noMemory = byCondition["no-memory"];
  const classLoss = Object.values(byClass).some(stats => stats["organization-memory"].meanCoverage < stats["no-memory"].meanCoverage);
  const betterThanAll = pairs.every(pair => pair.meanCoverageDifference > 0);
  const matchedQualityCheaper = pairs.every(pair => pair.meanCoverageDifference >= 0 && pair.meanExecutionDifference <= 0)
    && pairs.some(pair => pair.meanExecutionDifference < 0);
  let evidenceStatus: string;
  let interpretation: string;
  if (betterThanAll && !classLoss || matchedQualityCheaper && !classLoss) {
    evidenceStatus = "initial-support";
    interpretation = "Initial support under protocol v1: organization memory showed a coverage or matched-quality execution advantage over every declared baseline without a class-level coverage loss to no memory.";
  } else if (organization.meanCoverage > noMemory.meanCoverage) {
    evidenceStatus = "mixed";
    interpretation = "Mixed under protocol v1: organization memory improved mean task coverage over no memory, but did not establish a consistent quality-and-cost advantage over the declared alternatives.";
  } else {
    evidenceStatus = "unsupported";
    interpretation = "Unsupported under protocol v1: organization memory did not improve mean task coverage over no memory or establish a matched-quality execution advantage over the declared alternatives.";
  }
  return { status: "completed", primaryMetric: "task-coverage", byCondition, byClass, pairs, evidenceStatus, interpretation };
}

export async function runExperiment(scoredCases: readonly TaskCase[], trainingCases: readonly TaskCase[], record: (row: Measurement) => void = () => {}) {
  const training = await formMemories(trainingCases);
  const measurements: Measurement[] = [];
  for (const task of scoredCases) {
    for (const condition of conditions) {
      const row = await evaluateCase(task, condition, training.bank);
      measurements.push(row);
      record(row);
    }
  }
  return { measurements, training, summary: summarize(measurements) };
}
