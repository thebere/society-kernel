# AGENTS.md

## Purpose

Society Kernel is **research software**, not a feature-driven product.

The project investigates whether a system can remember and reinstate a useful organization of cognitive capabilities rather than only retrieve information from previous experience.

Development should optimize for:

- conceptual precision
- falsifiable mechanisms
- deterministic behavior
- inspectability
- reproducibility
- explicit limitations
- meaningful experiments
- minimal unnecessary machinery

Do not optimize for product completeness, framework generality, or speculative future requirements.

---

## Authority

There are three categories of decisions.

### Research decisions

Research decisions include:

- changing the meaning of a cognitive primitive
- changing the mathematical behavior of a mechanism
- adding information to K-line retrieval
- changing reinstatement semantics
- defining new learning rules
- deciding how utility affects behavior
- changing experimental baselines
- interpreting experimental results
- changing what a hypothesis claims

Do **not** make these decisions implicitly.

If implementation exposes an unresolved research question, surface it explicitly.

Do not choose a plausible answer merely because it is convenient to implement.

### Architectural decisions

Established architectural contracts should be preserved unless the task explicitly changes them.

Examples:

- Workspace state changes through Effects
- dispatch is distinct from Effect
- stable agency configuration is distinct from transient activation
- literal referents are distinct from role identities
- recall is distinct from reinstatement
- implementation success is distinct from experimental evidence

### Local engineering decisions

You may independently make local engineering decisions that preserve established semantics.

Examples:

- module organization
- internal data structures
- helper extraction
- TypeScript implementation details
- removing duplication
- test utilities
- build configuration
- straightforward performance improvements

Prefer the smallest change that satisfies the specified contract.

---

# Research discipline

Always distinguish between:

1. **Historical inspiration**
2. **Established research**
3. **Society Kernel's computational interpretation**
4. **Experimental hypotheses**
5. **Observed experimental results**

Do not turn an interpretation into an established fact.

Do not turn a passing test into evidence for a scientific hypothesis.

Do not rewrite documentation to imply stronger evidence than the experiments support.

Negative results are valid results.

---

# Current core question

The primary research question is:

> Can episodic experience be consolidated as a reusable organization of capabilities, and can similarity-triggered reinstatement of that organization improve processing of structurally related future situations?

The stronger claim remains unproven:

> Does organization memory provide useful capabilities beyond ordinary content-oriented memory or reconstructing organization from scratch?

The architecture must remain capable of testing that question rather than assuming the answer.

---

# Core conceptual model

The current high-level flow is:

```text
literal state
    ↓
facts / observations
    ↓
roles + active concepts
    ↓
distributed activation
    ↓
capability coalition
    ↓
shared operations
    ↓
effects / outcomes
    ↓
K-line consolidation
    ↓
future structural recall
```

These stages should remain conceptually separable.

---

# Core primitives

## Pronome

A named role whose literal referent can change.

Example:

```text
SUPPLIER → supplier_alpha
```

later:

```text
SUPPLIER → supplier_beta
```

The role is structurally relevant.

The previous literal value should not automatically become part of structural memory.

---

## Polyneme

An active concept signal.

Example:

```text
INVENTORY_RISK @ 0.8
```

A concept may affect multiple agencies according to their local sensitivities.

A polyneme is not the same thing as a fact.

---

## Agency

A specialized capability.

Stable configuration currently includes concepts such as:

- identity
- recruitment threshold
- concept sensitivities
- supported operations

Current activation belongs to transient Workspace state.

Do not merge stable agency configuration with current activation.

---

## Isonome

A shared operation/control signal.

Examples:

```text
VERIFY
CLASSIFY
COMPARE
ESCALATE
```

Different agencies may interpret the same operation differently.

An isonome does not itself execute an agency.

---

## Effect

An Effect describes a Workspace state transition.

Current effect categories include mechanisms such as:

```text
bind_pronome
record_fact
emit_polyneme
invoke_isonome
activate_agency
inhibit_agency
```

Effects are the established path for modifying Workspace state.

Do not mutate Workspace state through unrelated mechanisms unless the research specification explicitly changes this contract.

---

## AgencyOperationDispatch

A dispatch describes an operation request directed at an eligible agency.

```text
AgencyOperationDispatch ≠ Effect
```

Dispatch is not agency execution.

---

## Agency-local execution and results

[`executeDispatch()`](ts/src/society/execution.ts) invokes a separate agency-local handler after dispatch. Stable `Agency` configuration remains distinct from executable `AgencyRuntime` implementations; declared `supportedOperations` remain authoritative even when a handler exists.

Handlers receive readonly caller-owned context and return a local value synchronously or asynchronously. They must not mutate Workspace, dispatch, configuration, or the runtime registry. Execution wraps the value in an `AgencyOperationResult` identifying the agency and operation. Missing configuration, unsupported operations, missing runtimes, and missing handlers fail explicitly; handler failures propagate.

Preserve `Isonome ≠ AgencyOperationDispatch ≠ local execution ≠ AgencyOperationResult ≠ Effect`. Execution stays outside `runCycle()` and its trace. Results are data, with no automatic Effects, Workspace feedback, repeated cycles, or scheduling. Deterministic fixture handlers operationalize H3; real heterogeneous capability usefulness remains H14 research.

---

## K-line

A K-line represents remembered cognitive organization.

The current model may preserve:

- structural situation signature
- recruited agency activations
- relevant roles
- operations actually dispatched
- utility

A K-line is not:

- an episode transcript
- a database record of the old situation
- a replay of old literal values
- automatically the correct organization for the current situation

---

# Experimental domain

The current reference domain is **supply-chain disruption response**.

It is an experimental environment, not the intended product domain.

Examples of roles include:

```text
SUPPLIER
ALTERNATIVE_SUPPLIER
COMPONENT
SHIPMENT
WAREHOUSE
FACILITY
PRODUCTION_ORDER
PURCHASE_ORDER
CUSTOMER
CARRIER
```

Examples of concepts include:

```text
SHIPMENT_DELAY
INVENTORY_RISK
SUPPLIER_RELIABILITY_RISK
PRODUCTION_IMPACT
ALTERNATIVE_SUPPLIER_AVAILABLE
COMPLIANCE_UNVERIFIED
HIGH_PRIORITY_ORDER
REPEAT_DISRUPTION
ROUTE_DISRUPTION
QUALITY_RISK
CUSTOMER_COMMITMENT_RISK
```

Examples of agencies include:

```text
SUPPLIER_ASSESSMENT
INVENTORY_ASSESSMENT
LOGISTICS_ASSESSMENT
PRODUCTION_ASSESSMENT
PROCUREMENT_STRATEGY
COMPLIANCE_ASSESSMENT
RISK_ASSESSMENT
CUSTOMER_COMMITMENT
```

Do not reintroduce previous property-management or reputation-management examples.

Domain vocabulary may change only when explicitly requested.

---

# Current implemented progression

The architecture has evolved deliberately.

## Task 1

Kernel primitives and invariants.

## Task 2

Workspace state and deterministic Effect application.

## Task 3

Polyneme propagation:

```text
activation contribution
=
concept strength × agency sensitivity
```

## Task 4

Threshold-based agency recruitment:

```text
activation >= threshold
→ recruited
```

## Task 5

Isonome dispatch:

```text
recruited
AND
supports operation
→ dispatch
```

## Task 6

One deterministic Society cycle with ordered causal trace.

## Task 7

K-line consolidation and structural recall.

Current structural recall uses an explicit, deterministic similarity baseline.

At the current architectural boundary:

```text
recall ≠ reinstatement
```

A recalled K-line does not automatically modify current Workspace state.

Consult [H6](docs/research-hypotheses.md#h6-reinstatement) and the [organization-memory protocol](evals/protocols/organization-memory.md) for the current experimental boundary.

---

# Reinstatement guardrail

H6 K-line reinstatement is implemented as explicit activation Effects outside `runCycle()` through [`reinstatementEffects()`](ts/src/memory/reinstatement.ts). Recall remains read-only; reinstatement does not itself apply Effects or recruit agencies.

The intended research question is:

> Can recalled organization influence current cognition without simply forcing the previous coalition?

Do not implement reinstatement by directly assigning:

```text
workspace.agencyActivations = kline.agencyActivations
```

Do not directly declare the K-line's agencies recruited.

Do not treat a recalled organization as the answer.

Memory should act as a prior whose influence remains contestable by current evidence.

The current contribution rule is `stored agency activation × structural similarity`. Preserve ordinary activation saturation, inhibition, and current recruitment thresholds. Utility, roles, and operations do not modulate reinstatement, and no multi-memory policy is defined. Changes to this rule require explicit research direction. H7 comparative evaluation is the next research task; passing H6 tests does not establish transfer benefit.

---

# Determinism

The initial kernel is intentionally deterministic.

Given the same:

```text
Workspace
agency configuration
memory
thresholds
```

the system should produce the same:

```text
activation
coalition
dispatches
trace
memory matches
```

Do not introduce randomness unless the experiment explicitly requires it.

If randomness becomes necessary, require explicit seeds and reproducible execution.

---

# Observability

Prefer mechanisms that can answer:

```text
Why did this concept activate this agency?

Which concepts contributed to this activation?

Why was this agency recruited?

Why did this operation reach this agency?

Why did this memory match?

What did reinstatement change?
```

Causal traces are part of the research architecture, not merely debugging output.

Do not remove observability in exchange for implementation convenience.

---

# State-transition discipline

Prefer:

```text
mechanism
→ Effect
→ applyEffect()
→ Workspace
```

over hidden mutation.

Functions should generally:

- accept readonly inputs
- return new values
- avoid mutating caller-owned state
- preserve deterministic ordering

When ordering affects observable behavior, define and test it explicitly.

---

# Types and invariants

Use the type system to preserve meaningful distinctions.

Examples:

```text
Activation ≠ Similarity
ConceptId ≠ AgencyId
RoleId ≠ literal referent
Effect ≠ AgencyOperationDispatch
stable Agency ≠ AgencyActivation
recall ≠ reinstatement
```

Do not collapse semantically different quantities merely because they share the same runtime representation.

Prefer:

- discriminated unions
- exhaustive switches
- branded numeric types where useful
- readonly structures
- explicit invariant failures

Invalid configuration should generally fail loudly rather than silently disappear.

---

# Mathematical baselines

Prefer simple, transparent mechanisms before sophisticated ones.

Current examples include:

```text
concept strength × sensitivity
```

and explicit structural similarity.

Do not introduce:

- learned similarity
- embeddings
- neural scoring
- hidden weighting schemes
- opaque heuristics

unless they are themselves the subject of an experiment.

A more sophisticated mechanism should be compared against the simpler baseline it replaces.

---

# AI and learned components

The deterministic kernel currently does not require:

```text
LLMs
embeddings
vector databases
learned neural models
autonomous agent frameworks
```

Do not add them merely because they are available.

They may become experimental variables later.

When they do, preserve separation between:

```text
semantic interpretation
organizational control
memory
execution
```

Do not let an LLM silently absorb several architectural layers into one prompt.

---

# Scope control

Do not implement future architecture preemptively.

In particular, do not introduce speculative support for:

- persistence infrastructure
- databases
- distributed execution
- event buses
- dependency injection frameworks
- generic plugin systems
- multi-tenant runtime infrastructure
- generative UI
- agent marketplaces
- vector search
- learned policies
- neural activation models
- autonomous repeated cycling
- arbitrary workflow engines

unless the active task or experiment requires them.

A possible future use is not an implementation requirement.

---

# Publication scope

Speculative systems directions must not be promoted into public architecture or hypotheses without explicit research direction. Preserve the public focus on memory for cognitive organization and distinguish proposed mechanisms from demonstrated evidence.

---

# Testing standards

Tests should protect semantics, not merely increase coverage.

Keep the evidence categories distinct: unit tests verify individual mechanism semantics, integration tests verify composition, and evaluation suites compare research hypotheses against alternatives. Evaluation results preserve experimental evidence; passing tests does not establish a comparative research advantage.

The canonical end-to-end test lives in [society-cycle.integration.test.ts](ts/src/integration/society-cycle.integration.test.ts). Keep focused tests colocated with the mechanisms and integration tests separate from evaluation code.

Prefer tests that establish:

- exact boundary behavior
- deterministic ordering
- no input mutation
- missing configuration failures
- accumulation rules
- saturation rules
- category separation
- structural transfer
- negative cases
- hand-calculated expected values

For mathematical behavior, prefer independently calculated expected results over copying implementation output into fixtures.

When floating-point arithmetic is involved, use appropriate numerical comparison without weakening semantic assertions.

---

# Experimental standards

When implementing an experiment:

1. Define the hypothesis.
2. Define the baseline.
3. Define the experimental condition.
4. Define independent variables.
5. Define dependent variables.
6. Define expected observations without assuming the desired result.
7. Run both positive and failure cases where possible.
8. Record actual results.
9. Separate observations from interpretation.
10. Do not redesign the system merely to make the experiment succeed.

Where appropriate, include negative-transfer or counterexample conditions.

---

# Working with existing code

Before making substantial changes:

1. Inspect the relevant implementation.
2. Inspect the relevant tests.
3. Inspect applicable files under `docs/`.
4. Identify the current semantic contract.
5. Determine whether the requested work requires a research decision.

Do not infer current behavior solely from this file if the source and tests establish something more specific.

The implementation and current task specification take precedence over historical descriptions here.

---

# Documentation structure

Source responsibilities under `ts/src/`: `primitives/` owns cross-cutting types and numeric invariants; `workspace/` owns current state and Effects; `society/` owns current capability organization and execution; `memory/` owns remembered organization; `domains/` owns concrete experimental vocabulary/configuration; `integration/` composes them in tests. Keep these boundaries separate. The existing closed identity unions retain a type-only dependency from primitives to the supply-chain vocabulary; see the [source map](docs/architecture.md#source-modules) before attempting a second domain.

Read the [project README](README.md) and [documentation map](docs/README.md), then the documents relevant to the task:

| Public document | Responsibility |
| --- | --- |
| [Architecture](docs/architecture.md) | Implemented terminology, contracts, invariants, execution, and limitations. |
| [Research hypotheses](docs/research-hypotheses.md) | Authoritative T1 and H1–H21 claims, boundaries, counterevidence, and statuses. |
| [Research methods](docs/research-methods.md) | Comparison design, evidence hierarchy, measurement, and reproducibility. |
| [References](docs/references.md) | Sources directly connected to the public artifact. |
| [Evaluations](evals/README.md) | Versioned [protocols](evals/protocols/organization-memory.md), run artifacts, and [results](evals/results/README.md). |

The README is a durable introduction, not a notebook or hypothesis ladder. Public documents must be self-contained and must not depend on local-only files. Keep implementation, hypothesis, method, protocol, observation, and interpretation distinct. Passing tests does not establish comparative research advantage. A result does not silently rewrite a hypothesis.

---

# Public claims

Do not describe Society Kernel as currently being:

- a production agent framework
- a general-purpose memory system
- a model of the human brain
- an AGI architecture
- a supply-chain product
- a generative UI framework
- an adaptive application runtime
- proof that Minsky's theory is correct

Prefer language such as:

```text
investigates
tests
operationalizes
explores
provides a baseline
current implementation
working hypothesis
```

when evidence remains limited.

---

# Contributions and implementation changes

When proposing or implementing a substantial change, be able to state:

```text
What problem does this solve?

Which hypothesis or invariant requires it?

What simpler alternative exists?

What new assumption does it introduce?

How will we know whether it helped?
```

If those questions do not have good answers, the change may be premature.

---

# Code quality

Prefer:

- small modules
- explicit contracts
- direct implementations
- clear names
- deterministic functions
- minimal dependencies
- strong tests
- readable traces

Avoid unnecessary abstraction.

A research kernel that is easy to inspect is more valuable than an elegant framework whose behavior is difficult to explain.

---

# Performance

Do not optimize speculatively.

When performance becomes relevant:

1. establish a benchmark;
2. measure the current implementation;
3. identify the actual bottleneck;
4. optimize without changing semantics;
5. record before/after results.

Performance claims require measurements.

---

# Git discipline

Keep commits conceptually coherent.

Prefer commits that correspond to:

```text
one mechanism
one invariant
one experiment
one documentation change
```

rather than large mixed changes.

Do not rewrite research history to suggest that later ideas were known earlier unless explicitly instructed to perform a deliberate history reconstruction.

Do not push unless explicitly requested.

---

# Before considering a task complete

Run the relevant repository checks.

At minimum, where available:

```bash
npm test
npm run typecheck
npm run lint
```

If the task affects an experiment, run the experiment and report actual output.

Do not state that something works without running the relevant verification when it is available.

---

# Reporting work

After substantial implementation, report:

1. what changed;
2. which files changed;
3. what semantic contract was implemented;
4. tests added or changed;
5. verification commands run;
6. actual results;
7. unresolved questions;
8. any decision that may affect the research model.

Do not bury research-significant decisions inside implementation summaries.

---

# Guiding principle

Society Kernel should remain small enough that its behavior can be explained.

The project is trying to discover whether a useful mechanism exists.

It is not trying to build the largest architecture that could contain one.
