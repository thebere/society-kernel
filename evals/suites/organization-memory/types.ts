import type { KLine } from "../../../ts/src/memory/types";
import type { AgencyId, ConceptId, RoleId } from "../../../ts/src/primitives/types";

export const suiteVersion = "1.0.0";
export const conditions = ["no-memory", "organization-memory", "direct-routing", "episode-retrieval"] as const;
export type Condition = (typeof conditions)[number];
export const classes = ["related", "partial", "unrelated", "misleading"] as const;
export type CaseClass = (typeof classes)[number];
export const assessmentBudget = 4;
export const findingIds = [
  "supplier-risk", "inventory-impact", "production-impact", "route-risk",
  "reroute-option", "alternate-source", "supplier-verification-needed",
  "compliance-verified", "quality-hold", "customer-impact", "buffer-option", "recovery-option",
] as const;
export type FindingId = (typeof findingIds)[number];
export type SituationFacts = {
  readonly supplierUnreliable: boolean;
  readonly stockDays: number;
  readonly demandDays: number;
  readonly productionAtRisk: boolean;
  readonly routeBlocked: boolean;
  readonly alternativeRoute: boolean;
  readonly alternateSupplier: boolean;
  readonly complianceRecord: boolean;
  readonly qualityAlert: boolean;
  readonly customerAtRisk: boolean;
  readonly reserveStock: boolean;
};
export type Observation = {
  readonly facts: SituationFacts;
  readonly concepts: readonly { readonly id: ConceptId; readonly strength: number }[];
  readonly bindings: readonly { readonly roleId: RoleId; readonly value: string }[];
};
export type TaskCase = {
  readonly id: string;
  readonly class: CaseClass;
  readonly description: string;
  readonly observation: Observation;
  // Scoring labels live outside the observable input passed to every policy.
  readonly requiredFindings: readonly FindingId[];
};
export type Assessment = { readonly findings: readonly FindingId[] };
export type SelectionKind = "threshold-recruitment" | "direct-routing" | "episode-replay";
export type Advice = { readonly agencyIds: readonly AgencyId[] };
export type MemoryBank = {
  readonly klines: readonly KLine[];
  readonly episodes: readonly {
    readonly id: string;
    readonly signature: KLine["signature"];
    readonly observation: Observation;
    readonly advice: Advice;
  }[];
};
