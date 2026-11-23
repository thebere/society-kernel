import type { ConceptId } from "../../../ts/src/primitives/types";
import type { CaseClass, FindingId, SituationFacts, TaskCase } from "./types";

const defaults: SituationFacts = {
  supplierUnreliable: false, stockDays: 10, demandDays: 3, productionAtRisk: false,
  routeBlocked: false, alternativeRoute: false, alternateSupplier: false,
  complianceRecord: false, qualityAlert: false, customerAtRisk: false, reserveStock: false,
};

function task(id: string, kind: CaseClass, description: string, concepts: readonly ConceptId[], strength: number,
  facts: Partial<SituationFacts>, requiredFindings: readonly FindingId[]): TaskCase {
  return { id, class: kind, description, requiredFindings, observation: {
    facts: { ...defaults, ...facts },
    concepts: concepts.map(id => ({ id, strength })),
    bindings: (["SUPPLIER", "SHIPMENT", "FACILITY", "PURCHASE_ORDER", "CUSTOMER"] as const)
      .map(roleId => ({ roleId, value: `${id}_${roleId.toLowerCase()}` })),
  } };
}

const supply = ["SUPPLIER_RELIABILITY_RISK", "INVENTORY_RISK", "PRODUCTION_IMPACT"] as const;
const route = ["SHIPMENT_DELAY", "ROUTE_DISRUPTION", "INVENTORY_RISK"] as const;
const source = ["ALTERNATIVE_SUPPLIER_AVAILABLE", "SUPPLIER_RELIABILITY_RISK", "COMPLIANCE_UNVERIFIED"] as const;
const compliance = ["COMPLIANCE_UNVERIFIED", "ALTERNATIVE_SUPPLIER_AVAILABLE"] as const;
const customer = ["CUSTOMER_COMMITMENT_RISK", "PRODUCTION_IMPACT"] as const;
const stock = ["INVENTORY_RISK", "PRODUCTION_IMPACT"] as const;
const promise = ["ROUTE_DISRUPTION", "CUSTOMER_COMMITMENT_RISK"] as const;
const supplier = ["SUPPLIER_RELIABILITY_RISK", "SHIPMENT_DELAY"] as const;

// Only these eight episodes form either memory bank. No held-out case is used.
// QUALITY_RISK, REPEAT_DISRUPTION, HIGH_PRIORITY_ORDER are absent from formation.
export const formationCases: readonly TaskCase[] = [
  task("train-supply", "related", "Supplier failure with production shortage", supply, 0.9,
    { supplierUnreliable: true, stockDays: 1, productionAtRisk: true, reserveStock: true },
    ["supplier-risk", "inventory-impact", "production-impact", "recovery-option"]),
  task("train-route", "related", "Blocked route and low stock", route, 0.9,
    { routeBlocked: true, alternativeRoute: true, stockDays: 1 }, ["route-risk", "reroute-option", "inventory-impact"]),
  task("train-source", "related", "Unreliable supplier and verified alternative", source, 0.9,
    { supplierUnreliable: true, alternateSupplier: true, complianceRecord: true }, ["supplier-risk", "alternate-source", "compliance-verified"]),
  task("train-compliance", "related", "Pending verification for alternative supplier", compliance, 0.9,
    { alternateSupplier: true }, ["supplier-verification-needed"]),
  task("train-customer", "related", "Production recovery needed to meet commitment", customer, 0.9,
    { productionAtRisk: true, customerAtRisk: true, reserveStock: true }, ["production-impact", "customer-impact", "recovery-option"]),
  task("train-stock", "related", "Inventory shortage with reserve stock", stock, 0.9,
    { stockDays: 1, productionAtRisk: true, reserveStock: true }, ["inventory-impact", "production-impact", "buffer-option"]),
  task("train-promise", "related", "Route closure threatens delivery promise", promise, 0.9,
    { routeBlocked: true, alternativeRoute: true, customerAtRisk: true }, ["route-risk", "reroute-option", "customer-impact"]),
  task("train-supplier", "related", "Supplier reliability problem delays replenishment", supplier, 0.9,
    { supplierUnreliable: true, routeBlocked: true, stockDays: 1 }, ["supplier-risk", "route-risk", "inventory-impact"]),
];

// Predeclared substantive combinations: different objectives, facts, structures,
// and signal strengths, rather than repeated literal-identity permutations.
export const heldOutCases: readonly TaskCase[] = [
  task("related-supply", "related", "Weaker supply signals with an actionable reserve", supply, 0.35,
    { supplierUnreliable: true, stockDays: 0, demandDays: 5, productionAtRisk: true, reserveStock: true },
    ["supplier-risk", "inventory-impact", "production-impact", "recovery-option"]),
  task("related-route", "related", "Partial route evidence but rerouting is possible", route, 0.4,
    { routeBlocked: true, alternativeRoute: true, stockDays: 2, demandDays: 6 }, ["route-risk", "reroute-option", "inventory-impact"]),
  task("related-source", "related", "Weak alerts for a verified replacement source", source, 0.3,
    { supplierUnreliable: true, alternateSupplier: true, complianceRecord: true }, ["supplier-risk", "alternate-source", "compliance-verified"]),
  task("related-compliance", "related", "Alternative still lacks verification", compliance, 0.35,
    { alternateSupplier: true }, ["supplier-verification-needed"]),
  task("related-customer", "related", "Low-intensity production alert threatens a promise", customer, 0.3,
    { customerAtRisk: true, productionAtRisk: true, alternativeRoute: true }, ["customer-impact", "production-impact", "recovery-option"]),
  task("related-stock", "related", "Shortage can be buffered before production stalls", stock, 0.3,
    { stockDays: 2, demandDays: 8, productionAtRisk: true, reserveStock: true }, ["inventory-impact", "buffer-option", "production-impact"]),
  task("related-promise", "related", "Strong closure evidence requires a new route", promise, 0.85,
    { routeBlocked: true, alternativeRoute: true, customerAtRisk: true }, ["route-risk", "reroute-option", "customer-impact"]),
  task("related-supplier", "related", "Strong supplier and transport alerts with low stock", supplier, 0.8,
    { supplierUnreliable: true, routeBlocked: true, stockDays: 1 }, ["supplier-risk", "route-risk", "inventory-impact"]),

  task("partial-stock", "partial", "Only the stock-risk part of a production episode recurs", ["INVENTORY_RISK"], 0.45,
    { stockDays: 1, productionAtRisk: true, reserveStock: true }, ["inventory-impact", "production-impact", "buffer-option"]),
  task("partial-route", "partial", "Route obstruction without an inventory-risk signal", ["SHIPMENT_DELAY", "ROUTE_DISRUPTION"], 0.35,
    { routeBlocked: true, alternativeRoute: true }, ["route-risk", "reroute-option"]),
  task("partial-source", "partial", "An alternate source exists but is not verified", ["ALTERNATIVE_SUPPLIER_AVAILABLE"], 0.4,
    { alternateSupplier: true }, ["supplier-verification-needed"]),
  task("partial-quality", "partial", "New quality alert alongside a compliance signal", ["COMPLIANCE_UNVERIFIED", "QUALITY_RISK"], 0.45,
    { qualityAlert: true, complianceRecord: true }, ["quality-hold", "compliance-verified"]),
  task("partial-customer", "partial", "Commitment risk without production disruption", ["CUSTOMER_COMMITMENT_RISK"], 0.4,
    { customerAtRisk: true }, ["customer-impact"]),
  task("partial-production", "partial", "Production-only signal with a replacement option", ["PRODUCTION_IMPACT"], 0.5,
    { productionAtRisk: true, alternateSupplier: true, complianceRecord: true }, ["production-impact", "recovery-option"]),
  task("partial-priority", "partial", "A new urgent promise joins route risk", ["ROUTE_DISRUPTION", "CUSTOMER_COMMITMENT_RISK", "HIGH_PRIORITY_ORDER"], 0.4,
    { routeBlocked: true, alternativeRoute: true, customerAtRisk: true, productionAtRisk: true }, ["route-risk", "customer-impact", "recovery-option"]),
  task("partial-repeat", "partial", "Recurring supplier concern with a new quality issue", ["SUPPLIER_RELIABILITY_RISK", "REPEAT_DISRUPTION", "QUALITY_RISK"], 0.5,
    { supplierUnreliable: true, qualityAlert: true }, ["supplier-risk", "quality-hold"]),

  task("unrelated-quality", "unrelated", "Standalone quality hold", ["QUALITY_RISK"], 0.8,
    { qualityAlert: true }, ["quality-hold"]),
  task("unrelated-repeat", "unrelated", "Recurring unreliable source", ["REPEAT_DISRUPTION"], 0.8,
    { supplierUnreliable: true }, ["supplier-risk"]),
  task("unrelated-priority", "unrelated", "Urgent production recovery", ["HIGH_PRIORITY_ORDER"], 0.8,
    { productionAtRisk: true, reserveStock: true, customerAtRisk: true }, ["production-impact", "customer-impact", "recovery-option"]),
  task("unrelated-repeat-quality", "unrelated", "Repeated faulty deliveries with an available source", ["REPEAT_DISRUPTION", "QUALITY_RISK"], 0.7,
    { supplierUnreliable: true, qualityAlert: true, alternateSupplier: true, complianceRecord: true }, ["supplier-risk", "quality-hold", "alternate-source"]),
  task("unrelated-quality-priority", "unrelated", "Quality release required before urgent recovery", ["QUALITY_RISK", "HIGH_PRIORITY_ORDER"], 0.6,
    { qualityAlert: true, complianceRecord: true, productionAtRisk: true, reserveStock: true }, ["quality-hold", "compliance-verified", "recovery-option"]),
  task("unrelated-repeat-priority", "unrelated", "An urgent repeat disruption needs a buffer", ["REPEAT_DISRUPTION", "HIGH_PRIORITY_ORDER"], 0.45,
    { supplierUnreliable: true, reserveStock: true, customerAtRisk: true }, ["supplier-risk", "buffer-option", "customer-impact"]),
  task("unrelated-compound", "unrelated", "Combined quality, recurrence, and urgency", ["QUALITY_RISK", "REPEAT_DISRUPTION", "HIGH_PRIORITY_ORDER"], 0.35,
    { qualityAlert: true, supplierUnreliable: true, productionAtRisk: true, alternativeRoute: true }, ["quality-hold", "supplier-risk", "production-impact", "recovery-option"]),
  task("unrelated-urgent-fallback", "unrelated", "Urgent but weak signal with no production impact", ["HIGH_PRIORITY_ORDER"], 0.25,
    { customerAtRisk: true }, ["customer-impact"]),

  task("misleading-supply", "misleading", "Supply-shaped signals mask a compliance and quality task", supply, 0.4,
    { qualityAlert: true, complianceRecord: true }, ["quality-hold", "compliance-verified"]),
  task("misleading-route", "misleading", "Route-shaped signals persist after rerouting; a commitment and quality review is needed", route, 0.4,
    { qualityAlert: true, customerAtRisk: true }, ["quality-hold", "customer-impact"]),
  task("misleading-source", "misleading", "Sourcing-shaped signals accompany a stock and production problem", source, 0.4,
    { stockDays: 0, productionAtRisk: true, reserveStock: true }, ["inventory-impact", "production-impact", "buffer-option"]),
  task("misleading-compliance", "misleading", "Compliance-shaped signals mask a closed transport route", compliance, 0.4,
    { routeBlocked: true, alternativeRoute: true }, ["route-risk", "reroute-option"]),
  task("misleading-customer", "misleading", "Commitment-shaped signals accompany an unverified source", customer, 0.4,
    { alternateSupplier: true }, ["supplier-verification-needed"]),
  task("misleading-stock", "misleading", "Inventory signals remain despite ample stock; verification is now required", stock, 0.4,
    { stockDays: 20, alternateSupplier: true }, ["supplier-verification-needed"]),
  task("misleading-promise", "misleading", "Route and promise signals mask a faulty supplier", promise, 0.4,
    { supplierUnreliable: true, qualityAlert: true, complianceRecord: true }, ["supplier-risk", "quality-hold", "compliance-verified"]),
  task("misleading-supplier", "misleading", "Supplier-delay signals persist while the actual need is production recovery", supplier, 0.4,
    { productionAtRisk: true, reserveStock: true }, ["production-impact", "recovery-option", "buffer-option"]),
];
