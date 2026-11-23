# Organization-memory reinstatement and transfer

**Protocol ID:** organization-memory. **Version:** draft-1. **State:** design draft; no executable suite or scored runs exist.

**Claims:** [H6: Reinstatement](../../docs/research-hypotheses.md#h6-reinstatement), [H7: Transfer benefit](../../docs/research-hypotheses.md#h7-transfer-benefit), and [H8: Negative transfer](../../docs/research-hypotheses.md#h8-negative-transfer). H20 supplies the comparison requirement. This protocol does not test runtime, agent-orchestration, or UI superiority.

**Workstream:** organizational memory and control. **Initial task domain:** supply-chain disruption response.

## Research question

Does recalling and reinstating a previous capability organization help a new, structurally related episode while leaving current evidence able to override misleading memory?

Read-only signature matching is already testable through correctness tests. It cannot answer this comparative question. The treatment must include an implemented, specified reinstatement mechanism and a task/outcome model capable of measuring useful behavior.

## Conditions

Use the same current facts, concept signals, role bindings, agency configuration, available capabilities, task scorer, and budget for paired conditions:

1. Kernel without memory assistance.
2. Kernel with organizational recall and a specified reinstatement mechanism.
3. A credible direct-routing policy with equivalent configuration/tuning access.
4. Episode/content or nearest-neighbor strategy retrieval with matched access to prior experience, once testing the contribution beyond retrieval.

An initial no-memory versus reinstatement comparison can isolate the effect within the kernel. It cannot establish advantage over ordinary retrieval or alternative architectures until those conditions are implemented and evaluated fairly. Where content and organization memory are combined, include the corresponding content-only and organization-only ablations.

## Case families and separation

Separate memory-formation/tuning episodes from scored cases. Change literal role occupants independently of relevant structure. Include related episodes with useful memories, unchanged concepts with different referents, partial matches, unrelated memories, misleading near-matches, contradictory current evidence, and cases where abstention is appropriate. Then investigate multiple competing or obsolete memories under a revised protocol.

Expected task outcomes and useful/irrelevant capabilities must be defined independently of the treatment's outputs. A hand-authored expected coalition alone can evaluate routing agreement; it cannot establish that the coalition solves a task better.

## Measures and decision criteria

Record task quality, useful and irrelevant recruitment, dispatch requests separately from executed operations, corrective transitions, and memory formation/retrieval/reinstatement cost. Define cycle/trajectory measures only after specifying execution, scheduling, stopping, and failure behavior. Report harm on misleading-memory cases separately from average benefit on positive-transfer cases.

Before a scored run, revise this protocol to fix the primary outcome and minimum meaningful improvement, quality constraints, negative-transfer tolerance, task distribution/split, baseline tuning budget, seeds/repetitions, timing/cost method, and statistical analysis where applicable. These are unresolved design decisions; this draft supplies no acceptance thresholds and supports no performance conclusion.

## Readiness and reporting

Readiness requires the reinstatement treatment, an outcome/scoring model, independent fixtures or a versioned dataset manifest, executable baselines, and the completed pre-run design decisions above. Kernel changes should retain existing invariants and correctness tests.

The future suite should follow the [artifact contract](../README.md#run-artifact-contract), preserve all attempted runs, and refresh the [results index](../results/README.md). Report whether observations support, contradict, mix, or leave inconclusive the scoped claims; explanations and broad generalizations require explicit review.
