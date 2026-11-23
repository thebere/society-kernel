# Architecture

This reference describes current implementation behavior. The [hypothesis register](research-hypotheses.md) defines research claims, [methods](research-methods.md) defines evidence standards, and the [documentation map](README.md) explains their roles.

## Implementation boundary

Implemented mechanisms are typed primitives, immutable Workspace transitions, polyneme propagation, threshold-based recruitment, operation dispatch, an explicit agency-local execution contract with typed results, a single deterministic Society cycle with a causal trace, K-line consolidation, concept-set structural recall, and explicit similarity-scaled agency-activation reinstatement. Execution supports synchronous and asynchronous local handlers; current capability implementations are deterministic test fixtures.

Fact-to-concept interpretation, real external capability adapters, runtime scheduling, execution-result feedback, repeated settling cycles, learned parameters, and durable memory storage are not implemented. Recall is read-only; reinstatement derives Effects for explicit caller application. The deterministic core requires no LLM, embedding model, vector database, or autonomous agent framework; explicit inputs and mechanisms keep its behavior inspectable.

## Source modules

| Module | Responsibility |
| --- | --- |
| [`primitives/`](../ts/src/primitives/) | Cross-cutting signal/identity types and bounded activation. |
| [`workspace/`](../ts/src/workspace/) | Current state, immutable role bindings, and Effect application. |
| [`society/`](../ts/src/society/) | Stable agency contracts, propagation, recruitment, dispatch, local execution, and cycle traces. |
| [`memory/`](../ts/src/memory/) | K-line types, signatures, consolidation, similarity, read-only recall, and reinstatement Effects. |
| [`domains/supply-chain/`](../ts/src/domains/supply-chain/) | Concrete vocabulary, canonical identity order, agency configuration, and deterministic runtime fixtures. |
| [`integration/`](../ts/src/integration/) | The canonical test composing the mechanisms with the reference domain. |

Workspace depends on primitives; Society depends on primitives and Workspace; memory depends on those lower layers. Domain configuration composes the kernel. The domain's [`memory.ts`](../ts/src/domains/supply-chain/memory.ts) binds its existing canonical identity arrays to the memory functions, preserving the reference-domain call shapes. Memory imports no domain values. No barrel exports or domain framework are required.

One existing coupling remains explicit: [`primitives/types.ts`](../ts/src/primitives/types.ts) imports and re-exports the closed identifier unions from [`domains/supply-chain/types.ts`](../ts/src/domains/supply-chain/types.ts) through type-only dependencies. Widening these unions would change the current type contract. A second vocabulary would therefore still require changing the identity types; this layout does not establish H18 generality. The domain identity file has no imports, so this exception creates no dependency cycle.

## State and primitives

[`primitives/types.ts`](../ts/src/primitives/types.ts) exposes role, concept, agency, and operation identities and defines cross-cutting signals and agency activation entries. Memory-specific `KLine`, `KLineId`, and `SituationSignature` live in [`memory/types.ts`](../ts/src/memory/types.ts). [`activation.ts`](../ts/src/primitives/activation.ts) and [`similarity.ts`](../ts/src/memory/similarity.ts) provide distinct branded numeric quantities bounded to `[0, 1]`.

- A **pronome** binds a role identity to its current literal referent. [`Pronome.bind()`](../ts/src/workspace/pronome.ts) returns a new binding; role identity and literal value remain distinct.
- A **polyneme** is an active concept signal with a strength. Facts are episode-level assertions; concepts are interpretations supplied explicitly rather than inferred from those facts.
- An **agency** has stable identity, recruitment threshold, concept sensitivities, and supported operations in [`agency.ts`](../ts/src/society/agency.ts). Its transient activation lives separately in Workspace state.
- An **isonome** is an operation signal and strength. The cycle dispatches requests; separate local handlers implement the shared operation according to the target agency.
- A **K-line** records organization consolidated from a completed cycle. It does not store literal role referents or reinstate itself.

[`WorkspaceState`](../ts/src/workspace/workspace.ts) contains facts, pronomes, polynemes, isonomes, and agency activations. Constructors and transition functions preserve prior structural state; readonly types do not imply deep freezing of arbitrary supplied fact values.

## Effects and activation

[`applyEffect()`](../ts/src/workspace/effect.ts) is the established Workspace transition path. Its vocabulary is `bind_pronome`, `record_fact`, `emit_polyneme`, `invoke_isonome`, `activate_agency`, and `inhibit_agency`.

Positive signal/activation contributions accumulate with saturation; inhibition floors agency activation at zero:

```text
new positive value = min(1, current + contribution)
new inhibited activation = max(0, current - inhibition)
```

Role binding replaces the binding for that role, and recording a fact updates its key. These transitions return state rather than mutating caller-owned Workspace structures.

[`propagation()`](../ts/src/society/propagation.ts) calculates each sensitive agency's contribution as concept strength multiplied by local sensitivity. Zero contributions produce no activation Effect. [`recruitAgencyIds()`](../ts/src/society/recruitment.ts) recruits existing activation entries when activation is at least the agency's threshold; missing agency configuration fails explicitly.

## Cycle, dispatch, and trace

[`runCycle()`](../ts/src/society/cycle.ts) composes one deterministic transition:

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

[`dispatchIsonome()`](../ts/src/society/dispatch.ts) sends the full non-zero operation strength to each recruited agency supporting that operation. It does not divide strength, reevaluate recruitment, execute operations, or produce their outcomes. `AgencyOperationDispatch` is distinct from `Effect`. Unsupported agencies are filtered; missing configuration fails explicitly. `RESOLVE` is an operation identity currently supported by no configured agency.

## Agency-local execution

[`execution.ts`](../ts/src/society/execution.ts) provides the explicit boundary:

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

[`kline.ts`](../ts/src/memory/kline.ts) implements the memory operations:

- `deriveSituationSignature()` returns the canonical set of concept IDs whose strengths are greater than zero. Strength magnitude and literal referents are excluded. The memory function receives the canonical concept IDs; the supply-chain binding supplies the existing list.
- `consolidateKLine()` stores the signature, recruited agency activations, all bound role identities, unique operation identities actually dispatched, the caller-supplied ID, and externally supplied utility. The memory function receives canonical identity lists; the supply-chain binding supplies those in [`domains/supply-chain/types.ts`](../ts/src/domains/supply-chain/types.ts). Their membership filtering and ordering are unchanged. Consolidation does not select causally relevant roles, preserve an operation sequence, or retain the full trace.
- `situationSimilarity()` computes Jaccard similarity over concept sets: `|intersection| / |union|`. If either signature is empty, similarity is zero, including when both are empty.
- `recallKLines()` returns positive matches at or above the requested minimum, ordered by descending similarity and then ascending K-line ID. Utility, stored activations, roles, and operations do not affect the recall score or ranking.

For example, two situations sharing five concepts out of a six-concept union score `5 / 6`, regardless of different supplier or shipment referents. Recall at a minimum of `0.8` returns the memory without changing the current Workspace. This arithmetic example establishes no task-performance or transfer advantage.

## Explicit reinstatement

[`reinstatementEffects(match)`](../ts/src/memory/reinstatement.ts) is a pure transformation of one caller-selected `KLineMatch` into `readonly ActivateAgency[]`:

```text
recall → KLineMatch → reinstatementEffects()
                         ↓
memory contribution = stored agency activation × structural similarity
                         ↓
ActivateAgency Effects → applyEffect() → Workspace → normal recruitment
```

Each non-zero contribution passes through the existing branded `activation()` invariant and becomes `{ action: "activate_agency", agencyId, amount }`. Zero similarity, zero stored activation, and an empty stored coalition produce no corresponding Effects. Effects preserve the K-line's stored activation order, which consolidation already canonicalizes. The function uses no domain vocabulary or runtime registry.

The caller chooses a match and explicitly applies the returned Effects. For example, after selecting `match`:

```ts
const effects = reinstatementEffects(match);
const workspaceWithPrior = effects.reduce(applyEffect, workspace);
const result = runCycle(workspaceWithPrior, agencies);
```

This composition applies the prior before current concept propagation. Sequencing remains a caller decision; reinstatement neither applies its own Effects nor retrieves memories, recruits agencies, dispatches operations, or executes handlers. `recall ≠ reinstatement`, `reinstatement ≠ recruitment`, and `reinstatement ≠ replay`.

Ordinary Effect application accumulates and saturates activation at 1. Subsequent current contributions can reinforce it, and ordinary inhibition can reduce it to zero. Current thresholds and supported operations remain authoritative. Stored utility, role identities, operations, signature contents, and K-line ID do not modulate a supplied match's activation contributions; similarity is supplied by recall. No literal referents, facts, concepts, bindings, isonomes, or dispatches are reinstated.

The derivation does not validate the current capability configuration. It preserves remembered agency IDs; Effect application accepts them, while recruitment or the cycle fails explicitly if the current configuration is missing an activated agency. Capability migration/invalidation remains H15 work. Utility weighting (H9), multi-memory aggregation/competition/decay (H10), role or operation reinstatement, threshold/sensitivity modification, and learned reinstatement are not implemented.

Reinstatement stays outside `runCycle()` and its causal trace. The returned Effects expose the memory contributions, but the existing cycle trace records only subsequent propagation, Effect application, recruitment, and dispatch. There is no additional trace framework or hidden memory schedule.

Correctness and integration tests operationalize H6: memory can influence current organization without forcing the stored coalition. They do not themselves establish comparative benefit or investigate H8 negative transfer; zero-overlap and inhibition checks verify mechanism semantics only. The first H7 comparison uses this unchanged mechanism; its scoped, mixed evidence is recorded in the [results index](../evals/results/README.md).

## Verification and use

Focused tests beside the implementation cover boundaries, ordering, non-mutation, configuration failures, accumulation, dispatch, local sync/async execution, consolidation, and recall. See [`cycle.test.ts`](../ts/src/society/cycle.test.ts), [`execution.test.ts`](../ts/src/society/execution.test.ts), [`kline.test.ts`](../ts/src/memory/kline.test.ts), and the related mechanism tests.

[`reinstatement.test.ts`](../ts/src/memory/reinstatement.test.ts) verifies contribution arithmetic, zero contributions, stored order, metadata independence, determinism, and frozen-input purity. The [reinstatement integration tests](../ts/src/integration/reinstatement.integration.test.ts) cover consolidation-to-recall-to-prior composition across changed literal referents, threshold-governed recruitment, evidence reinforcement/inhibition, saturation, unrelated situations, repeatability, and missing configuration.

The [canonical supply-chain integration test](../ts/src/integration/society-cycle.integration.test.ts) composes Workspace Effects, a cycle, separate local execution, consolidation, and read-only recall. Its deterministic COMPARE handlers live in [`domains/supply-chain/runtimes.ts`](../ts/src/domains/supply-chain/runtimes.ts); episode-specific facts, bindings, and signals remain local to the test. It asserts activations, coalition and dispatch ordering, causal trace phases, distinct agency-specific COMPARE results, stored organization, changed role referents, and non-mutation. Its role is composition correctness, not transfer evaluation.

The reference vocabulary is supply-chain disruption response. Interpretation is supplied explicitly; the domain is an experimental environment rather than an implemented supply-chain optimizer. Run instructions are in the [project README](../README.md#running-the-project). Comparative evidence belongs in the [results index](../evals/results/README.md), separate from unit and integration tests.
