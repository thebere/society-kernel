# Organization-memory reinstatement and transfer

**Protocol ID:** organization-memory. **Version:** v1. **State:** registered descriptive comparison; see the [suite registration](../suites/organization-memory/registration.json) for the pre-run timestamp and source hashes.

**Revision from draft-1, before scored execution:** fixes eight memory-formation cases, 32 held-out cases (eight per class), four concrete conditions, a conditional mock-finding outcome model, one selected match with no utility weighting, a common four-assessment budget, deterministic agency-order execution, explicit formation/recall/reinstatement cost counts, and descriptive interpretation rules. No held-out results informed these choices. The [suite specification](../suites/organization-memory/README.md) and frozen sources make these decisions executable. H6 and Jaccard remain unchanged.

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

For v1, the primary outcome is required findings produced divided by required findings. Quality and execution cost remain separate. All 32 held-out cases are equally weighted, with eight related, partial, unrelated, and misleading cases. The unchanged reference configuration and fixed semantic routing table have no held-out tuning budget. All arms share current observations, handlers, scorer, and a maximum of four assessments in canonical agency order. One assessment is executed per selected agency; extra operation requests are recorded separately. See the suite for the exact scheduler and information-access boundaries.

Report mean/median/min/max coverage, perfect/zero cases, execution/selection/recruitment/dispatch counts, unnecessary executions, class breakdowns, and paired organization-memory differences against each baseline. Formation execution costs, eight signature comparisons per memory query, and activation Effect counts are recorded separately. No random seeds are needed; one deterministic run plus an exact replication is required. No wall-clock efficiency or amortized benefit is inferred from count proxies.

This first study is descriptive. There is no statistical success threshold, minimum meaningful effect, or tolerated negative-transfer rate. The suite predeclares when to describe the comparison as initial support, mixed, or unsupported; these are scoped descriptions rather than general validation. All failures and unfavorable cases are retained. H8's broader negative-transfer claim is not completed by this protocol.

## Readiness and reporting

Readiness requires the reinstatement treatment, an outcome/scoring model, independent fixtures or a versioned dataset manifest, executable baselines, and the completed pre-run design decisions above. Kernel changes should retain existing invariants and correctness tests.

The [executable suite](../suites/organization-memory/README.md) follows the [artifact contract](../README.md#run-artifact-contract), preserves all attempted runs, and refreshes the [results index](../results/README.md). Register and hash sources before the first held-out run; any dirty run retains a recoverable source snapshot. A failed run remains visible and any repaired execution receives a new run ID. Report whether observations support, contradict, mix, or leave inconclusive the scoped claims; explanations and broad generalizations require explicit review.
