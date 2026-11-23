import { agencies } from "../../../ts/src/domains/supply-chain/agencies";
import type { AgencyId } from "../../../ts/src/primitives/types";
import type { AgencyOperationDispatch } from "../../../ts/src/society/dispatch";
import { type AgencyRuntime, executeDispatch } from "../../../ts/src/society/execution";
import type { WorkspaceState } from "../../../ts/src/workspace/workspace";
import { type Assessment, assessmentBudget, type FindingId, findingIds, type SituationFacts } from "./types";

// Conditional mock observations. No case IDs, concepts, requirements, or scores.
export function findingsFor(id: AgencyId, facts: SituationFacts): readonly FindingId[] {
  const shortage = facts.stockDays < facts.demandDays;
  const alternate = facts.alternateSupplier && facts.complianceRecord;
  const recoverable = facts.reserveStock || facts.alternativeRoute || alternate;
  switch (id) {
    case "SUPPLIER_ASSESSMENT": return [
      ...(facts.supplierUnreliable ? ["supplier-risk" as const] : []),
      ...(alternate ? ["alternate-source" as const] : []),
      ...(facts.qualityAlert ? ["quality-hold" as const] : []),
    ];
    case "INVENTORY_ASSESSMENT": return [
      ...(shortage ? ["inventory-impact" as const] : []),
      ...(shortage && facts.productionAtRisk ? ["production-impact" as const] : []),
      ...(facts.reserveStock ? ["buffer-option" as const] : []),
    ];
    case "LOGISTICS_ASSESSMENT": return [
      ...(facts.routeBlocked ? ["route-risk" as const] : []),
      ...(facts.alternativeRoute ? ["reroute-option" as const] : []),
      ...(facts.routeBlocked && facts.customerAtRisk ? ["customer-impact" as const] : []),
    ];
    case "PRODUCTION_ASSESSMENT": return [
      ...(facts.productionAtRisk ? ["production-impact" as const] : []),
      ...(recoverable ? ["recovery-option" as const] : []),
    ];
    case "PROCUREMENT_STRATEGY": return [
      ...(alternate ? ["alternate-source" as const] : []),
      ...(facts.alternateSupplier && !facts.complianceRecord ? ["supplier-verification-needed" as const] : []),
      ...(facts.reserveStock ? ["buffer-option" as const] : []),
    ];
    case "COMPLIANCE_ASSESSMENT": return [
      ...(facts.complianceRecord ? ["compliance-verified" as const] : []),
      ...(facts.qualityAlert ? ["quality-hold" as const] : []),
      ...(facts.alternateSupplier && !facts.complianceRecord ? ["supplier-verification-needed" as const] : []),
    ];
    case "RISK_ASSESSMENT": return [
      ...(facts.supplierUnreliable ? ["supplier-risk" as const] : []),
      ...(facts.productionAtRisk ? ["production-impact" as const] : []),
      ...(facts.customerAtRisk ? ["customer-impact" as const] : []),
      ...(facts.qualityAlert ? ["quality-hold" as const] : []),
    ];
    case "CUSTOMER_COMMITMENT": return [
      ...(facts.customerAtRisk ? ["customer-impact" as const] : []),
      ...(facts.productionAtRisk && recoverable ? ["recovery-option" as const] : []),
    ];
  }
}

export function assessmentOperation(id: AgencyId) {
  const agency = agencies.find(agency => agency.id === id);
  if (!agency) throw new Error(`Missing agency configuration: ${id}`);
  return agency.supportedOperations.includes("VERIFY") ? "VERIFY" as const : "COMPARE" as const;
}

export const runtimes: readonly AgencyRuntime[] = agencies.map(agency => ({
  agencyId: agency.id,
  operations: { [assessmentOperation(agency.id)]: ({ workspace }: { workspace: WorkspaceState }): Assessment => ({
    findings: findingsFor(agency.id, workspace.facts as SituationFacts),
  }) },
}));

/** One assessment per agency, canonical agency order, same budget for all arms. */
export async function executeAssessments(workspace: WorkspaceState, dispatches: readonly AgencyOperationDispatch[]) {
  const candidates = agencies.flatMap(agency => {
    const request = dispatches.find(dispatch => dispatch.agencyId === agency.id && dispatch.operationId === assessmentOperation(agency.id));
    return request ? [request] : [];
  });
  const selected = candidates.slice(0, assessmentBudget);
  const executions = [];
  for (const dispatch of selected) {
    const result = await executeDispatch(dispatch, workspace, agencies, runtimes);
    const value = result.value as Assessment;
    if (!value || !Array.isArray(value.findings) || value.findings.some(finding => !findingIds.includes(finding))) {
      throw new Error(`Invalid assessment output: ${dispatch.agencyId}`);
    }
    executions.push({ ...result, value });
  }
  return { executions, skippedForBudget: candidates.slice(assessmentBudget), assessmentCandidates: candidates };
}
