// types.ts

import type { Activation } from "./activation";

// Core Ids
export const agencyIds = [
  "SUPPLIER_ASSESSMENT",
  "INVENTORY_ASSESSMENT",
  "LOGISTICS_ASSESSMENT",
  "PRODUCTION_ASSESSMENT",
  "PROCUREMENT_STRATEGY",
  "COMPLIANCE_ASSESSMENT",
  "RISK_ASSESSMENT",
  "CUSTOMER_COMMITMENT",
] as const;

export type AgencyId = (typeof agencyIds)[number];

export const roleIds = [
  "SUPPLIER",
  "ALTERNATIVE_SUPPLIER",
  "COMPONENT",
  "SHIPMENT",
  "WAREHOUSE",
  "FACILITY",
  "PRODUCTION_ORDER",
  "PURCHASE_ORDER",
  "CUSTOMER",
  "CARRIER",
] as const;

export type RoleId = (typeof roleIds)[number];

export const conceptIds = [
  "SHIPMENT_DELAY",
  "INVENTORY_RISK",
  "SUPPLIER_RELIABILITY_RISK",
  "PRODUCTION_IMPACT",
  "ALTERNATIVE_SUPPLIER_AVAILABLE",
  "COMPLIANCE_UNVERIFIED",
  "HIGH_PRIORITY_ORDER",
  "REPEAT_DISRUPTION",
  "ROUTE_DISRUPTION",
  "QUALITY_RISK",
  "CUSTOMER_COMMITMENT_RISK",
] as const;

export type ConceptId = (typeof conceptIds)[number];


export const operationIds = [
  'VERIFY',
  'CLASSIFY',
  'COMPARE',
  'ESCALATE',
  'RESOLVE',
] as const;

export type OperationId = (typeof operationIds)[number];

export type SituationFeatureId = ConceptId;
export type KLineId = `kline_${string}`;

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

export type KLine = {
  id: KLineId;
  signature: SituationSignature;

  agencyActivations: readonly AgencyActivation[];
  roleIds: readonly RoleId[];
  operationIds: readonly OperationId[];

  utility: Activation;
};
