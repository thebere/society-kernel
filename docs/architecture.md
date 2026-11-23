# Architecture

This reference describes current implementation behavior. The [hypothesis register](research-hypotheses.md) defines research claims, [methods](research-methods.md) defines evidence standards, and the [documentation map](README.md) explains their roles.

## Implementation boundary

Implemented mechanisms are typed primitives, immutable Workspace transitions, polyneme propagation, threshold-based recruitment, operation dispatch, an explicit agency-local execution contract with typed results, a single deterministic Society cycle with a causal trace, K-line consolidation, and concept-set structural recall. Execution supports synchronous and asynchronous local handlers; current capability implementations are deterministic test fixtures.

Fact-to-concept interpretation, real external capability adapters, runtime scheduling, execution-result feedback, repeated settling cycles, K-line reinstatement, learned parameters, and durable memory storage are not implemented. Recall is read-only. The deterministic core requires no LLM, embedding model, vector database, or autonomous agent framework; explicit inputs and mechanisms keep its behavior inspectable.

## State and primitives

[`types.ts`](../ts/src/core/types.ts) defines role, concept, agency, and operation identities. [`activation.ts`](../ts/src/core/activation.ts) and [`similarity.ts`](../ts/src/core/similarity.ts) provide distinct branded numeric quantities bounded to `[0, 1]`.

- A **pronome** binds a role identity to its current literal referent. [`Pronome.bind()`](../ts/src/core/pronome.ts) returns a new binding; role identity and literal value remain distinct.
- A **polyneme** is an active concept signal with a strength. Facts are episode-level assertions; concepts are interpretations supplied explicitly rather than inferred from those facts.
- An **agency** has stable identity, recruitment threshold, concept sensitivities, and supported operations in [`agency.ts`](../ts/src/core/agency.ts). Its transient activation lives separately in Workspace state.
- An **isonome** is an operation signal and strength. The cycle dispatches requests; separate local handlers implement the shared operation according to the target agency.
- A **K-line** records organization consolidated from a completed cycle. It does not store literal role referents or reinstate itself.

[`WorkspaceState`](../ts/src/core/workspace.ts) contains facts, pronomes, polynemes, isonomes, and agency activations. Constructors and transition functions preserve prior structural state; readonly types do not imply deep freezing of arbitrary supplied fact values.

## Effects and activation

[`applyEffect()`](../ts/src/core/effect.ts) is the established Workspace transition path. Its vocabulary is `bind_pronome`, `record_fact`, `emit_polyneme`, `invoke_isonome`, `activate_agency`, and `inhibit_agency`.

Positive signal/activation contributions accumulate with saturation; inhibition floors agency activation at zero:

```text
new positive value = min(1, current + contribution)
new inhibited activation = max(0, current - inhibition)
```

Role binding replaces the binding for that role, and recording a fact updates its key. These transitions return state rather than mutating caller-owned Workspace structures.

[`propagation()`](../ts/src/core/propagation.ts) calculates each sensitive agency's contribution as concept strength multiplied by local sensitivity. Zero contributions produce no activation Effect. [`recruitAgencyIds()`](../ts/src/core/recruitment.ts) recruits existing activation entries when activation is at least the agency's threshold; missing agency configuration fails explicitly.

## Cycle, dispatch, and trace

[`runCycle()`](../ts/src/core/cycle.ts) composes one deterministic transition:

```text
Workspace
    ↓
polyneme propagation
    ↓
activation Effects applied in order
    ↓
accumulated agency activation
    ↓
threshold-based recruitment
    ↓
capability-filtered isonome dispatch
    ↓
CycleResult: Workspace, recruited IDs, dispatches, trace
```

Propagation follows Workspace polyneme order and agency configuration order. Recruitment and its trace follow existing activation-entry order. Dispatch follows isonome order and recruited-agency order. Trace events are `polyneme_propagation`, `effect_applied`, `agency_recruitment`, and `isonome_dispatch` in the order produced by these phases.

[`dispatchIsonome()`](../ts/src/core/dispatch.ts) sends the full non-zero operation strength to each recruited agency supporting that operation. It does not divide strength, reevaluate recruitment, execute operations, or produce their outcomes. `AgencyOperationDispatch` is distinct from `Effect`. Unsupported agencies are filtered; missing configuration fails explicitly. `RESOLVE` is an operation identity currently supported by no configured agency.

## Agency-local execution

[`execution.ts`](../ts/src/core/execution.ts) provides the explicit boundary:

```text
Isonome
    ↓
dispatchIsonome() / CycleResult.dispatches
    ↓
AgencyOperationDispatch
    ↓
executeDispatch(dispatch, workspace, agencies, runtimes)
    ↓
agency-local handler
    ↓
AgencyOperationResult
```

`Agency` remains stable capability configuration: identity, sensitivities, threshold, and supported operations. A separate `AgencyRuntime` associates an agency ID with a readonly, partial operation-to-handler map. Executable functions are not added to agency configuration.

A handler receives `AgencyExecutionContext` containing the caller's Workspace and readonly dispatch. It returns a local value synchronously or through a Promise. `executeDispatch()` awaits that value and wraps it as `{ agencyId, operationId, value }`; the identity fields come from the request rather than from handler-supplied metadata. Results are typed data, distinct from dispatches and Effects, and do not modify Workspace automatically.

Execution validates that agency configuration exists and declares the operation supported, even if a runtime exposes a handler. Missing configuration, unsupported operation, missing runtime, and missing local implementation produce distinct invariant errors. Handler throws/rejections propagate without fallback, retry, or silent dropping. Recruitment and zero-strength filtering remain responsibilities of the upstream dispatcher; execution consumes its requests without recomputing recruitment.

Handlers must not mutate caller-owned context or registry/configuration objects. The executor performs no input writes or state transitions; readonly types express the contract rather than sandboxing arbitrary handler code or deep-freezing supplied data. Tests use deterministic handlers and frozen inputs to verify non-mutation at this boundary.

Execution stays outside `runCycle()`, so the cycle remains synchronous and its causal trace still ends at dispatch. Local results do not enter that trace, become Effects, initiate another cycle, or change K-line contents. The integration test explicitly executes COMPARE requests through distinct async fixtures; VERIFY/ESCALATE remain requests in that scenario. Fixture results demonstrate local interpretation, not realistic supply-chain competency, task-level reasoning, or comparative advantage.

## Consolidation and structural recall

[`kline.ts`](../ts/src/core/kline.ts) implements the memory operations:

- `deriveSituationSignature()` returns the canonical set of concept IDs whose strengths are greater than zero. Strength magnitude and literal referents are excluded.
- `consolidateKLine()` stores the signature, recruited agency activations, all bound role identities, unique operation identities actually dispatched, the caller-supplied ID, and externally supplied utility. Collections use the canonical identity order in `types.ts`. Consolidation does not select causally relevant roles, preserve an operation sequence, or retain the full trace.
- `situationSimilarity()` computes Jaccard similarity over concept sets: `|intersection| / |union|`. If either signature is empty, similarity is zero, including when both are empty.
- `recallKLines()` returns positive matches at or above the requested minimum, ordered by descending similarity and then ascending K-line ID. Utility, stored activations, roles, and operations do not affect the recall score or ranking.

For example, two situations sharing five concepts out of a six-concept union score `5 / 6`, regardless of different supplier or shipment referents. Recall at a minimum of `0.8` returns the memory without changing the current Workspace. This arithmetic example establishes no task-performance or transfer advantage.

## Verification and use

Focused tests beside the implementation cover boundaries, ordering, non-mutation, configuration failures, accumulation, dispatch, local sync/async execution, consolidation, and recall. See [`cycle.test.ts`](../ts/src/core/cycle.test.ts), [`execution.test.ts`](../ts/src/core/execution.test.ts), [`kline.test.ts`](../ts/src/core/kline.test.ts), and the related core tests.

The [canonical supply-chain integration test](../ts/src/integration/society-cycle.integration.test.ts) composes Workspace Effects, a cycle, separate local execution, consolidation, and read-only recall. It asserts activations, coalition and dispatch ordering, causal trace phases, distinct agency-specific COMPARE results, stored organization, changed role referents, and non-mutation. Its role is composition correctness, not transfer evaluation.

The reference vocabulary is supply-chain disruption response. Interpretation is supplied explicitly; the domain is an experimental environment rather than an implemented supply-chain optimizer. Run instructions are in the [project README](../README.md#running-the-project). Comparative evidence belongs in the [results index](../evals/results/README.md), separate from unit and integration tests.
