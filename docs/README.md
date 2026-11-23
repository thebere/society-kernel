# Research documentation

Society Kernel separates implementation, hypotheses, methods, evaluation protocols, evidence, and interpretation so that one category does not silently establish another.

## Documentation map

| Document | Responsibility |
| --- | --- |
| [Architecture](architecture.md) | What the current implementation does and does not do. |
| [Research hypotheses](research-hypotheses.md) | Authoritative public register of T1 and H1–H21, their boundaries, counterevidence, and implementation/investigation status. |
| [Research methods](research-methods.md) | Standards for comparison design, measurement, reproducibility, analysis, and interpretation. |
| [Research findings](research-findings.md) | Current interpretation across retained results: observations, limits, and derived research questions. |
| [References](references.md) | Sources directly connected to the public artifact: historical proposals, comparison points, methods, implementations, and datasets where applicable. |
| [Evaluations](../evals/README.md) | Versioned protocols, the evaluation artifact contract, and [results](../evals/results/README.md). |

## Authority and evidence

Architecture describes mechanisms; it does not establish a research hypothesis. A hypothesis states a claim; it does not establish evidence. Methods define how evidence should be produced. A protocol specifies a particular evaluation before scoring. A completed evaluation records observations, with interpretation stated separately.

Hypotheses describe what is tested; methods define what counts as evidence; protocols fix specific designs; results record what happened; findings synthesize the current interpretation across those results. The findings document links to the immutable run records and keeps observations, interpretation, and new questions distinct. The current two retained H7 runs are one comparison plus a replication, not two independent samples.

A result does not silently rewrite a hypothesis. Unit tests verify individual mechanism semantics; [integration tests](../ts/src/integration/society-cycle.integration.test.ts) verify their end-to-end composition. Neither establishes comparative research advantage. Implementation status and comparative support remain separate.
