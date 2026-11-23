# Society Kernel

**An experimental architecture for memory of cognitive organization.**

Society Kernel investigates a simple question:

> **Can a system remember and reinstate a useful organization of capabilities, rather than only retrieve information from previous experience?**

Most computational memory systems focus on remembering content: facts, documents, episodes, summaries, trajectories, or skills.

Society Kernel explores a complementary possibility: remembering **how a system organized itself** around a situation.

A previous episode might establish that a particular combination of concepts recruited a useful coalition of capabilities and operations. When a structurally similar but literally different situation appears later, the system may be able to retrieve that organization as a prior for current processing.

The project is inspired by Marvin Minsky's ideas about K-lines, agencies, pronomes, polynemes, and isonomes, but it is not an implementation of *Society of Mind* and does not assume those ideas are biologically correct.

Society Kernel treats them as computational hypotheses that can be implemented, inspected, compared, and falsified.

---

## Why?

Consider two situations involving completely different entities:

```text
Episode A

SUPPLIER  → supplier_alpha
COMPONENT → component_AX14
SHIPMENT  → shipment_2049
```

```text
Episode B

SUPPLIER  → supplier_beta
COMPONENT → component_K92
SHIPMENT  → shipment_7711
```

Their literal data may be unrelated while their structure is similar:

```text
SHIPMENT_DELAY
INVENTORY_RISK
SUPPLIER_RELIABILITY_RISK
PRODUCTION_IMPACT
```

The useful thing to remember may therefore not be the old supplier or shipment.

It may be that situations with this structure previously recruited something like:

```text
LOGISTICS_ASSESSMENT
INVENTORY_ASSESSMENT
SUPPLIER_ASSESSMENT
PRODUCTION_ASSESSMENT

VERIFY
COMPARE
ESCALATE
```

Society Kernel asks whether that **organization itself can become reusable memory**.

---

## Core hypothesis

The working hypothesis is:

> **A system can consolidate useful cognitive organization from one episode and later reinstate that organization as a prior when processing a structurally related episode.**

The important phrase is **as a prior**.

Memory should not simply replay the previous solution.

Current evidence must remain able to confirm, modify, override, or reject remembered organization.

The stronger question, which remains experimental, is:

> **Does this improve transfer compared with retrieving information or reconstructing the organization from scratch?**

---

## Model

Society Kernel currently separates several kinds of state:

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
K-line memory
```

### Pronome

A role whose current referent can change.

```text
SUPPLIER → supplier_alpha
```

The role `SUPPLIER` can later refer to another supplier without changing the role itself.

### Polyneme

An active concept signal.

```text
INVENTORY_RISK @ 0.8
```

The same concept can affect different capabilities with different strengths.

### Agency

A specialized capability.

Agencies have stable configuration and transient activation. Multiple concepts can contribute toward recruiting an agency.

### Isonome

A shared operation signal such as:

```text
VERIFY
COMPARE
CLASSIFY
ESCALATE
```

The same operation may have a different local interpretation in each agency.

### K-line

A stored representation of previously useful cognitive organization.

A K-line can contain:

```text
situation structure
relevant roles
recruited agency activations
operations
utility
```

without using the previous episode's literal entities as its structural identity.

---

## Current execution model

A deterministic cycle currently looks roughly like:

```text
Workspace
    │
    ├── active concepts
    │       ↓
    │   propagation
    │       ↓
    │   agency activation
    │
    ▼
threshold evaluation
    │
    ▼
recruited coalition
    │
    ├── active operations
    │       ↓
    │   capability filtering
    │
    ▼
operation dispatches
    │
    ▼
causal trace
```

A completed cycle can be consolidated into a K-line.

A later situation can derive a structural signature and retrieve related K-lines.

---

## Where it is today

Implemented:

- typed cognitive primitives and bounded activation
- immutable role bindings
- deterministic Workspace transitions
- distributed concept propagation
- accumulated agency activation
- threshold-based coalition recruitment
- shared-operation dispatch
- explicit agency-local sync/async execution with typed results, tested using deterministic fixtures
- a single deterministic Society cycle
- causal cycle traces
- K-line consolidation
- structural situation signatures
- deterministic K-line recall
- explicit similarity-scaled K-line reinstatement through activation Effects

The kernel is currently deterministic and intentionally small.

It does **not** currently depend on:

```text
LLMs
embeddings
vector databases
learned neural models
autonomous agent frameworks
```

This keeps the mechanism inspectable while the core hypothesis is being investigated.

Reinstatement lets a recalled organization contribute an activation prior through ordinary Workspace Effects. Current evidence and thresholds still govern recruitment. The first comparative evaluation produced mixed evidence: the [evaluation status](#evaluation-status) links its scope and limitations.

See the [documentation map](docs/README.md) and [hypothesis register](docs/research-hypotheses.md) for the research claims and their current boundaries.

---

## Experimental domain

The current reference environment is **supply-chain disruption response**.

It provides useful properties for the experiments:

- recurring but non-identical situations
- changing role occupants
- distributed specialized capabilities
- multiple interacting signals
- shared operations
- opportunities for structural transfer

The domain is a test environment, not the intended application of Society Kernel.

The architecture is intended to remain domain-independent.

---

## Example

A situation may activate:

```text
SHIPMENT_DELAY              @ 0.90
INVENTORY_RISK              @ 0.80
SUPPLIER_RELIABILITY_RISK   @ 0.75
PRODUCTION_IMPACT           @ 0.60
```

These signals propagate differently through the available agencies:

```text
SUPPLIER_ASSESSMENT
INVENTORY_ASSESSMENT
LOGISTICS_ASSESSMENT
PRODUCTION_ASSESSMENT
PROCUREMENT_STRATEGY
RISK_ASSESSMENT
```

Activation accumulates until a subset crosses its recruitment threshold.

An operation such as:

```text
COMPARE @ 0.70
```

is then dispatched only to recruited agencies capable of interpreting `COMPARE`.

The resulting organization can later be consolidated as a K-line.

---

## Determinism and observability

The current implementation favors explicit mechanisms over hidden inference.

Given the same:

```text
workspace
agency configuration
memory
thresholds
```

the kernel should produce the same:

```text
activation
coalition
dispatches
trace
memory matches
```

The goal is to make questions such as these answerable:

```text
Why was this agency activated?

Which concepts contributed to its activation?

Why was it recruited?

Why did it receive this operation?

Why did this K-line match the current situation?
```

This becomes particularly important once learned or probabilistic mechanisms are introduced later.

---

## Running the project

Install dependencies:

```bash
npm install
```

Run the test suite:

```bash
npm test -- --run
```

Check imports and lint rules, or apply safe fixes:

```bash
npm run lint
npm run lint:fix
npm run typecheck
```

Biome checks kernel and evaluation sources plus project JSON configuration. Formatting is disabled to keep lint commands focused on import organization and safe fixes. Typechecking covers the kernel, tests, and evaluation TypeScript.

The test suite verifies individual kernel mechanisms and their end-to-end composition. The [canonical supply-chain integration test](ts/src/integration/society-cycle.integration.test.ts) covers Workspace construction, propagation, recruitment, dispatch, separate agency-local execution, causal tracing, K-line consolidation, and read-only structural recall after literal entity substitution. Local operation results are deterministic fixtures, with no automatic feedback into Workspace.

The [reinstatement integration tests](ts/src/integration/reinstatement.integration.test.ts) explicitly apply recalled activation priors and verify normal recruitment, saturation, and current-evidence inhibition. These are mechanism checks, not comparative transfer results.

---

## Evaluation status

The first held-out H7 comparison is complete, with an exact deterministic replication. **Result: mixed under protocol v1.** Organization memory improved coverage over no memory and matched full coverage on related and partial cases, using fewer executions on partial cases than both routing alternatives. Both alternatives performed better overall, with the coverage gap in unrelated cases; misleading matches also exposed wasted work. H8 negative-transfer characterization is next. This is a small deterministic mock-domain result, not general validation.

See [research findings](docs/research-findings.md) for the current interpretation and open questions, and the [first result report](evals/results/organization-memory/20261123T053956445Z-h7/report.md) for observations. The [protocol](evals/protocols/organization-memory.md), [suite](evals/suites/organization-memory/README.md), and [results index](evals/results/README.md) preserve the design and both runs. Unit and integration checks remain separate from comparative evidence.

See the [research hypotheses](docs/research-hypotheses.md), [research methods](docs/research-methods.md), [evaluation protocol](evals/protocols/organization-memory.md), and [evaluation results](evals/results/README.md).

---

## Research documentation

The repository contains the executable kernel, formal public hypotheses, methods, evaluation protocols, and evidence records. The [documentation map](docs/README.md) explains their authority and scope.

### Repository documentation

- [`docs/research-hypotheses.md`](docs/research-hypotheses.md) — authoritative public register of T1 and H1–H21
- [`docs/research-methods.md`](docs/research-methods.md) — comparison design, baselines, measures, and reproducibility
- [`docs/references.md`](docs/references.md) — shared bibliography and source provenance
- [`docs/architecture.md`](docs/architecture.md) — computational model, terminology, invariants, and architecture
- [`evals/README.md`](evals/README.md) — evaluation protocols, future suite layout, and run-reporting contract

---

## What this project is not

Society Kernel is not currently:

- a production agent framework
- a general-purpose memory database
- a model of the human brain
- a supply-chain product
- an AGI architecture
- a generative UI framework
- a claim that Minsky's theory is correct

It is an executable research project for investigating:

> **Can memory preserve useful organization from previous cognition and make that organization available to future cognition?**

---

## Contributions

The project is currently research-driven and the architecture is still evolving.

Issues and discussions that challenge the model, identify related research, propose experimental baselines, expose failure modes, or improve reproducibility are especially useful.

Before proposing substantial architectural changes, please review:

- [`docs/research-hypotheses.md`](docs/research-hypotheses.md)
- [`docs/research-methods.md`](docs/research-methods.md)
- [`docs/architecture.md`](docs/architecture.md)

Changes should preserve the distinction between:

```text
implemented mechanism
experimental hypothesis
observed result
speculative direction
```

A contribution should not turn an untested hypothesis into an architectural assumption without evidence.

---

## Citation

If Society Kernel becomes useful to your research, citation information will be added alongside the first research release.

Until then, please link to this repository.

---

## License

Society Kernel is licensed under the Apache License 2.0. See [`LICENSE`](LICENSE).
