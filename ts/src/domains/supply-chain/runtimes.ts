import type { AgencyRuntime } from "../../society/execution";

// Constant async architectural fixtures, not supply-chain analysis.
export const runtimes: readonly AgencyRuntime[] = [
  { agencyId: "SUPPLIER_ASSESSMENT", operations: { COMPARE: async () => ({ dimension: "supplier", preferred: "supplier_beta" }) } },
  { agencyId: "INVENTORY_ASSESSMENT", operations: { COMPARE: async () => ({ dimension: "inventory", preferred: "reserve_stock" }) } },
  { agencyId: "LOGISTICS_ASSESSMENT", operations: { COMPARE: async () => ({ dimension: "route", preferred: "route_north" }) } },
  { agencyId: "PRODUCTION_ASSESSMENT", operations: { COMPARE: async () => ({ dimension: "production", preferred: "reschedule" }) } },
  { agencyId: "PROCUREMENT_STRATEGY", operations: { COMPARE: async () => ({ dimension: "sourcing", preferred: "dual_source" }) } },
  { agencyId: "RISK_ASSESSMENT", operations: { COMPARE: async () => ({ dimension: "risk", preferred: "review_exposure" }) } },
  { agencyId: "CUSTOMER_COMMITMENT", operations: { COMPARE: async () => ({ dimension: "commitment", preferred: "review_date" }) } },
];
