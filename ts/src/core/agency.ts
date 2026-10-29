import { type Activation, activation } from "./activation";
import type { AgencyId, ConceptId, OperationId } from "./types";

type Sensitivities = Readonly<
  Partial<Record<ConceptId, Activation>>
>;

type OperationHandler = () => void;

type Operations = Readonly<Partial<Record<OperationId, OperationHandler>>>;

export type Agency = {
  id: AgencyId;
  threshold: Activation;
  sensitivities: Sensitivities;
  operations: Operations;
};

export function createEmptyOperations(): Operations {
  return {
    VERIFY: () => {},
    CLASSIFY: () => {},
    COMPARE: () => {},
    ESCALATE: () => {},
    RESOLVE: () => {},
  }
}


export const agencies: readonly Agency[] = [
  {
    id: "SUPPLIER_ASSESSMENT",
    threshold: activation(0.5),
    sensitivities: {
      SUPPLIER_RELIABILITY_RISK: activation(0.9),
      REPEAT_DISRUPTION: activation(0.7),
      QUALITY_RISK: activation(0.6),
      COMPLIANCE_UNVERIFIED: activation(0.4),
    },
    operations: {VERIFY: () => {}, CLASSIFY: () => {}, COMPARE: () => {}},
  },
  {
    id: "INVENTORY_ASSESSMENT",
    threshold: activation(0.4),
    sensitivities: {
      INVENTORY_RISK: activation(1),
      SHIPMENT_DELAY: activation(0.6),
      PRODUCTION_IMPACT: activation(0.5),
      HIGH_PRIORITY_ORDER: activation(0.3),
    },
    operations: {VERIFY: () => {}, COMPARE: () => {}},
  },
  {
    id: "LOGISTICS_ASSESSMENT",
    threshold: activation(0.6),
    sensitivities: {
      SHIPMENT_DELAY: activation(1),
      ROUTE_DISRUPTION: activation(0.9),
      INVENTORY_RISK: activation(0.4),
      HIGH_PRIORITY_ORDER: activation(0.2),
    },
    operations: {VERIFY: () => {}, CLASSIFY: () => {}, COMPARE: () => {}, ESCALATE: () => {}},
  },
  {
    id: "PRODUCTION_ASSESSMENT",
    threshold: activation(0.6),
    sensitivities: {
      PRODUCTION_IMPACT: activation(1),
      INVENTORY_RISK: activation(0.7),
      HIGH_PRIORITY_ORDER: activation(0.4),
      SHIPMENT_DELAY: activation(0.4),
    },
    operations: {VERIFY: () => {}, COMPARE: () => {}, ESCALATE: () => {}},
  },
  {
    id: "PROCUREMENT_STRATEGY",
    threshold: activation(0.5),
    sensitivities: {
      ALTERNATIVE_SUPPLIER_AVAILABLE: activation(0.9),
      SUPPLIER_RELIABILITY_RISK: activation(0.7),
      REPEAT_DISRUPTION: activation(0.7),
      INVENTORY_RISK: activation(0.4),
    },
    operations: {COMPARE: () => {}, ESCALATE: () => {}},
  },
  {
    id: "COMPLIANCE_ASSESSMENT",
    threshold: activation(0.7),
    sensitivities: {
      COMPLIANCE_UNVERIFIED: activation(1),
      QUALITY_RISK: activation(0.8),
      ALTERNATIVE_SUPPLIER_AVAILABLE: activation(0.4),
      SUPPLIER_RELIABILITY_RISK: activation(0.3),
    },
    operations: {VERIFY: () => {}, CLASSIFY: () => {}, ESCALATE: () => {}},
  },
  {
    id: "RISK_ASSESSMENT",
    threshold: activation(0.6),
    sensitivities: {
      INVENTORY_RISK: activation(0.7),
      PRODUCTION_IMPACT: activation(0.8),
      QUALITY_RISK: activation(0.8),
      CUSTOMER_COMMITMENT_RISK: activation(0.6),
      REPEAT_DISRUPTION: activation(0.6),
    },
    operations: {VERIFY: () => {}, COMPARE: () => {}, ESCALATE: () => {}},
  },
  {
    id: "CUSTOMER_COMMITMENT",
    threshold: activation(0.5),
    sensitivities: {
      CUSTOMER_COMMITMENT_RISK: activation(0.9),
      HIGH_PRIORITY_ORDER: activation(0.8),
      PRODUCTION_IMPACT: activation(0.6),
      SHIPMENT_DELAY: activation(0.4),
    },
    operations: {VERIFY: () => {}, COMPARE: () => {}},
  },
];
