import type { Assessment, FindingId } from "./types";

/** Score executed information, with no agency identities or routing knowledge. */
export function scoreTask(required: readonly FindingId[], outputs: readonly Assessment[]) {
  const requirements = [...new Set(required)];
  if (requirements.length === 0) throw new Error("A scored task must require at least one finding");
  const produced = new Set(outputs.flatMap(output => output.findings));
  const satisfied = requirements.filter(finding => produced.has(finding));
  const unnecessaryExecutions = outputs.filter(output => !output.findings.some(finding => requirements.includes(finding))).length;
  return { coverage: satisfied.length / requirements.length, satisfied,
    missing: requirements.filter(finding => !produced.has(finding)), unnecessaryExecutions };
}
