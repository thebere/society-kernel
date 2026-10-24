import { type Activation, activation } from "./activation";
import { Pronome } from "./pronome";
import type { AgencyId, ConceptId, OperationId, RoleId } from "./types";
import type { WorkspaceState } from "./workspace";

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

export type ActivateAgency = {
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



/***
 * Utils and helpers
 */

function assertNever(value: never): never {
  throw new Error(`Unhandled effect: ${JSON.stringify(value)}`);
}

function min(a: number, b: number): Activation {
  return activation(Math.min(a, b));
}

function max(a: number, b: number): Activation {
  return activation(Math.max(a, b));
}

/***
 * addiing delta with saturation
 * because we want a maximum of 1
 * regardless of the input values
 * Example: add(.5, .8) = 1.3 => 1
 */
function add(a: Activation, b: Activation): Activation {
  return min(1, a + b)
}

/***
 * subtracting delta with saturation
 * becausee we want a minimum of 0
 * regardless of the input values
 * Example: subtract(.2, .9) = -0.7 => 0
 */
function subtract(a: Activation, b: Activation): Activation {
  return max(0, a - b);
};






/***
 * Core effect handlers
 */
function bindPronome(w: WorkspaceState, e: Extract<Effect, { action: 'bind_pronome' }>): WorkspaceState {
  const exists = w.pronomes.some(p => p.roleId === e.roleId);

  return {
    ...w,
    pronomes: exists
      ? w.pronomes.map((p) => {
          if (p.roleId === e.roleId) {
            return p.bind(e.value)
          }
          return p
        })
      : [...w.pronomes, new Pronome(e.roleId, e.value)],
  }
}


function recordFact(w: WorkspaceState, e: Extract<Effect, { action: 'record_fact' }>): WorkspaceState {
  return {
    ...w,
    facts: { ...w.facts, [e.key]: e.value },
  }
}

function emitPolyneme(w: WorkspaceState, e: Extract<Effect, { action: 'emit_polyneme' }>): WorkspaceState {
  const exists = w.polynemes.some(p => p.conceptId === e.conceptId);

  return {
			...w,
			polynemes: exists
				? w.polynemes.map((p) => {
						if (p.conceptId === e.conceptId) {
							return { ...p, strength: add(p.strength, e.strength) };
						}
						return p;
					})
        : [...w.polynemes, { kind: 'polyneme', conceptId: e.conceptId, strength: e.strength }],
		};
}

function invokeIsonome(w: WorkspaceState, e: Extract<Effect, { action: 'invoke_isonome' }>): WorkspaceState {
  const exists = w.isonomes.some(p => p.operationId === e.operationId);

  return {
			...w,
			isonomes: exists
				? w.isonomes.map((i) => {
						if (i.operationId === e.operationId) {
							return { ...i, strength: add(i.strength, e.strength) };
						}
						return i;
					})
				: [...w.isonomes, { kind: 'isonome', operationId: e.operationId, strength: e.strength }],
		};
}

function activateAgency(w: WorkspaceState, e: Extract<Effect, { action: 'activate_agency' }>): WorkspaceState {
  const exists = w.agencyActivations.some(aa => aa.agencyId === e.agencyId);

  return {
		...w,
    agencyActivations: exists
      ? w.agencyActivations.map((aa) => {
          if (aa.agencyId === e.agencyId) {
            return { ...aa, activation: add(aa.activation, e.amount) };
          }
          return aa;
        })
      : [...w.agencyActivations, { agencyId: e.agencyId, activation: e.amount }],
	};
}

function inhibitAgency(w: WorkspaceState, e: Extract<Effect, { action: 'inhibit_agency' }>): WorkspaceState {
  const exists = w.agencyActivations.some(aa => aa.agencyId === e.agencyId);

  return {
    ...w,
    agencyActivations: exists
      ? w.agencyActivations.map((aa) => {
          if (aa.agencyId === e.agencyId) {
              return { ...aa, activation: subtract(aa.activation, e.amount) };
            }
            return aa;
        })
      : w.agencyActivations,
  }
}

export function applyEffect(w: WorkspaceState, e: Effect): WorkspaceState {
  switch (e.action) {
    case 'bind_pronome':
      return bindPronome(w, e);
    case 'record_fact':
      return recordFact(w, e);
    case 'emit_polyneme':
      return emitPolyneme(w, e)
    case 'invoke_isonome':
      return invokeIsonome(w, e);
    case 'activate_agency':
      return activateAgency(w, e);
    case 'inhibit_agency':
      return inhibitAgency(w, e)
    default:
       return assertNever(e);
  }
};
