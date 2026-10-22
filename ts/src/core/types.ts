// types.ts

import type { Activation } from "./activation";

// Core Ids
export type AgencyId =
  | "SUPPLIER_ASSESSMENT"
  | "INVENTORY_ASSESSMENT"
  | "LOGISTICS_ASSESSMENT"
  | "PRODUCTION_ASSESSMENT"
  | "PROCUREMENT_STRATEGY"
  | "COMPLIANCE_ASSESSMENT"
  | "RISK_ASSESSMENT"
  | "CUSTOMER_COMMITMENT";

export type RoleId =
  | "SUPPLIER"
  | "ALTERNATIVE_SUPPLIER"
  | "COMPONENT"
  | "SHIPMENT"
  | "WAREHOUSE"
  | "FACILITY"
  | "PRODUCTION_ORDER"
  | "PURCHASE_ORDER"
  | "CUSTOMER"
  | "CARRIER";

export type ConceptId =
  | "SHIPMENT_DELAY"
  | "INVENTORY_RISK"
  | "SUPPLIER_RELIABILITY_RISK"
  | "PRODUCTION_IMPACT"
  | "ALTERNATIVE_SUPPLIER_AVAILABLE"
  | "COMPLIANCE_UNVERIFIED"
  | "HIGH_PRIORITY_ORDER"
  | "REPEAT_DISRUPTION"
  | "ROUTE_DISRUPTION"
  | "QUALITY_RISK"
  | "CUSTOMER_COMMITMENT_RISK";

export type OperationId =
  | 'VERIFY'
  | 'CLASSIFY'
  | 'COMPARE'
  | 'ESCALATE'
  | 'RESOLVE';

export type SituationFeatureId = ConceptId;
export type KlineId = `kline_${string}`;

// Core substates embellished contracts
export type AgencyActivation = {
  agencyId: AgencyId;
  activation: Activation;
}

export type SituationSignature = {
	featureIds: readonly SituationFeatureId[];
};


// Core primitives
export type Polyneme = {
  kind: 'polyneme';
  conceptId: ConceptId;
  strength: Activation;
};

export type Isonome = {
  kind: 'isonome',
  operationId: OperationId;
  strength: Activation;
};

export type Kline = {
  id: KlineId;
  signature: SituationSignature;

  agencyActivations: readonly AgencyActivation[];
  roleIds: readonly RoleId[];
  operationIds: readonly OperationId[];

  utility: Activation;
};
