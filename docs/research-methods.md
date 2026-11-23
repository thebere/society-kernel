# Research methods

This document owns the common experimental method. The [hypothesis register](research-hypotheses.md) owns claims and their scope. Individual, versioned protocols under [evals](../evals/README.md) make these methods concrete for a particular comparison. [References](references.md) records external sources and baseline provenance.

## Evidence levels

Unit tests verify individual mechanism semantics and invariants. Integration tests verify that multiple mechanisms compose according to specification. A demonstration illustrates a mechanism on chosen inputs. A comparative evaluation measures an identified claim against declared alternatives. A cognitive study additionally compares predictions with empirical observations. Passing one level does not establish the next.

The tests under [`ts/src`](../ts/src/) support mechanism correctness; the [canonical supply-chain integration test](../ts/src/integration/society-cycle.integration.test.ts) verifies their end-to-end composition through consolidation and read-only recall. The [reinstatement integration tests](../ts/src/integration/reinstatement.integration.test.ts) verify explicit activation priors, ordinary recruitment, and current-evidence override. The [results index](../evals/results/README.md) now records the first H7 comparative evaluation and its deterministic replication, with mixed evidence scoped to protocol v1. Neither read-only recall nor passing reinstatement correctness tests alone demonstrates comparative transfer benefit.

## Comparison design

Every evaluation starts with a protocol registered before the scored run. It specifies the hypothesis IDs, research workstream, task domain, treatment, baselines, task distribution, held-out split, outcome definition, budgets, seeds/repetitions, analysis, and decision criteria. Register changes as protocol revisions; do not silently redefine success after observing results.

Separate two kinds of comparison:

1. **Mechanism contribution:** change one mechanism within the same system, such as memory off/on, while holding the remaining conditions fixed. This isolates a contribution.
2. **Architecture comparison:** compare Society Kernel with an alternative system under the same task contract, capabilities, evidence access, outcome scoring, and resource budget. Internal implementations may differ; an end-to-end comparison does not isolate which mechanism caused a difference.

Use both when claiming that a particular mechanism explains an architecture-level improvement. Compare against a simple credible baseline before a complex architecture. Baseline families include no memory, direct rules/routing, finite-state controllers, production systems, episode or trajectory retrieval, nearest-neighbor strategy retrieval, case-based reasoning, semantic memory, learned policies, and agent planners. Choose the relevant subset for the claim and task.

ACT-R and Soar are intellectual comparison points in [References](references.md); listing them does not mean that faithful baseline implementations or adapters exist. A named architecture comparison must pin its implementation, version, configuration, adaptation effort, and sources. A simplified proxy must be identified as such and cannot stand in for a result about the full architecture.

### Matched conditions and confounds

For within-kernel memory comparisons, keep current facts, concepts, role bindings, agency configuration, supported operations, and available content memory fixed. For end-to-end systems, give all conditions the same observable inputs and capabilities; measure interpretation and routing costs rather than making them invisible.

Match tuning effort and training access. Separate data used to form memories, learn parameters, or select thresholds from scored episodes. Prevent leakage through literal identifiers, outcomes, handcrafted test-specific sensitivities, or access to the expected answer. Record unavoidable asymmetries and constrain the conclusion accordingly.

For stochastic agents, use matched tasks and paired seeds where appropriate, repeat runs, pin model/tool versions and prompts, and declare timeout/retry/error handling. Failures, abstentions, exhausted budgets, and incomplete runs belong in the record. Report quality/cost tradeoffs instead of treating lower effort as an improvement when task quality has changed.

## Workstreams and measurement

A research workstream identifies the mechanism or claim family under investigation: organizational memory/control, agent integration, persistence/scale, or generality/cognitive comparison. A task domain identifies the environment and tasks, such as supply-chain disruption response. Each evaluation names both; evidence from one task domain does not establish another workstream or general usefulness.

| Workstream | Relevant claims | Candidate comparisons | Measures to operationalize |
| --- | --- | --- | --- |
| Organizational memory and control | H6–H12 | No reinstatement, content/episode/trajectory retrieval, direct routing, strategy retrieval | Task success, useful/irrelevant recruitment, activation trajectory, operations requested/executed, corrective transitions, transfer, interference, abstention, cycles/time to useful organization. |
| Agent orchestration | H13–H17 | Content-only/organization-only/combined memory, direct planner, single agent with matched tools, other orchestration architectures | Quality, reasoning iterations, incorrect branches, tool calls, tokens, context retrieved, corrections, latency, robustness under changed conditions. |
| Persistence and scale | H10, H15, H16 | Local/shared agent-memory policies and indexing alternatives | Memory count/footprint, write/retrieval latency, throughput, indexing and consolidation cost, recall precision/quality, invalidation behavior, isolation and sharing violations. |
| Generality and cognitive relevance | H18, H19, H21 | Same kernel across domains, transfer with/without explicit mapping, competing models of a specified phenomenon | Domain adaptation effort, held-out transfer, mapping cost, interference, empirical fit/prediction under declared constraints. |

These are measurement candidates, not existing benchmarks or interchangeable scores. Each protocol chooses a primary outcome, quality constraints, and secondary measures with explicit definitions and directions. Define a useful coalition and irrelevant recruitment independently of the coalition produced by the treatment. A faster cycle or a smaller coalition alone is not evidence of better cognition.

Distinguish requested operations from executed work: the Society cycle emits dispatch requests, and a separate executor can invoke local sync/async handlers and return typed data. Deterministic fixture results establish that mechanism without task scoring or automatic state feedback. Repeated-cycle measures require a defined scheduler, stopping criterion, and execution policy; the current single-cycle implementation does not supply them.

## Experimental families

### Reinstatement and transfer

Begin with paired episodes that differ in literal role occupants while controlling relevant conceptual structure. Include positive-transfer cases, unrelated memories, superficially similar but misleading memories, changed evidence, and cases where abstention is appropriate. Evaluate the proposed reinstatement mechanism separately from read-only recall.

Compare no memory, content retrieval, organization reinstatement, and combined memory when feasible. Keep accessible episode information matched; for H7/H17, include the cost of creating, storing, retrieving, and adapting memories. Report both cold-start cost and any claimed amortized benefit over a declared reuse horizon.

### Ablations and learning

Remove or vary concept propagation, memory, roles, operation control, utility, similarity representation, and learned parameters as relevant to the claim. Compare learned and hand-authored sensitivities with equivalent training/tuning access. Freeze evaluation criteria and learned parameters before held-out scoring. Credit assignment and consolidation choices require their own controls.

### Persistence and scale

Vary memory volume, overlap, contradictory memories, obsolescence, concurrency, and capability versions. Measure quality as well as lookup cost. Record storage/indexing policy separately from cognitive semantics.

## Analysis and interpretation

Report per-task outcomes, aggregates, sample sizes, exclusions, missing values, failures, and the evaluation budget. For stochastic comparisons, report variability and uncertainty with a declared analysis appropriate to the design. Avoid selecting favorable seeds, metrics, or domains after the run. Treat hardware timing, tool/provider latency, token cost, and algorithmic operation counts as different measurements.

A protocol specifies the meaningful improvement threshold and any acceptable tradeoff before scoring. A result can support a scoped claim, contradict it, be mixed, or remain inconclusive. A failed implementation/run is evidence about feasibility or reliability but may not be a valid test of the intended mechanism; preserve that distinction. Negative and mixed findings remain part of the index.

No automatic report should turn a numerical difference into a broad scientific verdict. Link interpretation to the exact protocol, task population, implementation, and limitations. A new run adds evidence; it does not silently rewrite a hypothesis or prove the whole program.

## Reproducibility and result publication

Each completed or attempted run records its protocol version/hash, suite and baseline revisions, source revision and dirty-state information, exact invocation/configuration, input identifiers and content hashes, seeds, repetitions, budgets, environment/hardware, dependency versions, and model/tool/provider versions where relevant. A dirty run requires a recoverable source snapshot or patch, with its hash, before it can support a reproducible published comparison.

Keep raw per-case measurements and traces sufficient to audit aggregate scores, respecting dataset and data-sharing restrictions. Record failed/incomplete attempts. Never overwrite a historical run with a later one.

The [evaluation layout and reporting contract](../evals/README.md) defines where protocols, runners, measurements, and reports belong. The dedicated [results index](../evals/results/README.md) is the public entry point; the project README links to it. When executable suites are introduced, their reporting step should generate run reports and refresh the index from retained artifacts. Until then, the index records the absence of comparative runs. Passing unit or integration tests is not a comparative result entry.
