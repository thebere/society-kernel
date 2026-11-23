# Research documentation

Society Kernel separates implementation, hypotheses, methods, evaluation protocols, evidence, and interpretation so that one category does not silently establish another.

## Documentation map

| Document | Responsibility |
| --- | --- |
| [Architecture](architecture.md) | What the current implementation does and does not do. |
| [Research hypotheses](research-hypotheses.md) | Authoritative public register of T1 and H1–H21, their boundaries, counterevidence, and implementation/investigation status. |
| [Research methods](research-methods.md) | Standards for comparison design, measurement, reproducibility, analysis, and interpretation. |
| [References](references.md) | Sources directly connected to the public artifact: historical proposals, comparison points, methods, implementations, and datasets where applicable. |
| [Evaluations](../evals/README.md) | Versioned protocols, the evaluation artifact contract, and [results](../evals/results/README.md). |

## Authority and evidence

Architecture describes mechanisms; it does not establish a research hypothesis. A hypothesis states a claim; it does not establish evidence. Methods define how evidence should be produced. A protocol specifies a particular evaluation before scoring. A completed evaluation records observations, with interpretation stated separately.

A result does not silently rewrite a hypothesis. Unit tests verify individual mechanism semantics; [integration tests](../ts/src/integration/society-cycle.integration.test.ts) verify their end-to-end composition. Neither establishes comparative research advantage. Implementation status and comparative support remain separate.
