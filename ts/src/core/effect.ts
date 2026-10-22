// effect.ts

import type { Activation } from "./activation";
import type { AgencyId, ConceptId, OperationId, RoleId } from "./types";

type BindPronome<T> = {
  action: 'bind_pronome';
  roleId: RoleId;
  value: T;
}

type RecordFact = {
  action: 'record_fact';
  key: string;
  value: unknown;
};

type EmitPolyneme = {
  action: 'emit_polyneme';
  conceptId: ConceptId;
  strength: Activation;
}

type InvokeIsonome = {
  action: 'invoke_isonome';
  operationId: OperationId;
  strength: Activation;
}

type ActivateAgency = {
  action: 'activate_agency';
  agencyId: AgencyId;
  amount: Activation;
}

type InhibitAgency = {
  action: 'inhibit_agency';
  agencyId: AgencyId;
  amount: Activation;
}


export type Effect<T = unknown> =
  | BindPronome<T>
  | RecordFact
  | EmitPolyneme
  | InvokeIsonome
  | ActivateAgency
  | InhibitAgency;


function assertNever(value: never): never {
  throw new Error(`Unhandled effect: ${JSON.stringify(value)}`);
}

export function exhaustive(effect: Effect) {
  switch (effect.action) {
    case 'bind_pronome':
      return;
    case 'record_fact':
      return;
    case 'emit_polyneme':
      return;
    case 'invoke_isonome':
      return;
    case 'activate_agency':
      return;
    case 'inhibit_agency':
      return;
    default:
      return assertNever(effect);
  }
}
