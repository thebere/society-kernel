# Research findings

## Evidence status

This document synthesizes what the retained evidence currently suggests. The [hypothesis register](research-hypotheses.md) owns claims, [methods](research-methods.md) defines evidence standards, and [run artifacts](../evals/results/README.md) preserve observations. Interpretation here does not replace those records or silently change a hypothesis.

The evidence is one authored, deterministic supply-chain comparison and its exact replication. The replication establishes repeatability, not an independent sample. H1–H6 are operationalized; H7 is **Investigated — mixed under protocol v1**. H8 remains proposed and uninvestigated and is the next empirical priority.

## H7 — First transfer experiment

### Question and protocol

Does reinstating remembered organization improve downstream task coverage or reduce execution work on structurally related episodes with different literal referents?

[Protocol v1](../evals/protocols/organization-memory.md) and its [registered suite](../evals/suites/organization-memory/README.md) compared no memory, organization memory, direct routing, and nearest-episode reuse. Eight episodes formed memory; 32 held-out cases comprised eight each related, partial, unrelated, and misleading cases. All conditions shared handlers, scoring, and a four-assessment budget in fixed agency order. Task coverage is required findings produced by executed handlers divided by required findings, not agreement with an expected coalition.

### Main result — observed

The retained report's interpretation is unchanged:

> Mixed under protocol v1: organization memory improved mean task coverage over no memory, but did not establish a consistent quality-and-cost advantage over the declared alternatives.

| Condition | Mean coverage | Median coverage | Mean executions | Perfect cases |
| --- | ---: | ---: | ---: | ---: |
| No memory | 42.71% | 16.67% | 1.0625 | 11/32 |
| Organization memory | 68.23% | 100% | 2.4688 | 20/32 |
| Direct routing | 81.77% | 100% | 3.1875 | 24/32 |
| Episode retrieval | 81.77% | 100% | 3.3125 | 25/32 |

| Case class | No memory | Organization memory | Direct routing | Episode retrieval |
| --- | ---: | ---: | ---: | ---: |
| Related | 56.25% | 100% | 100% | 100% |
| Partial | 58.33% | 100% | 100% | 100% |
| Unrelated | 45.83% | 45.83% | 100% | 100% |
| Misleading | 10.42% | 27.08% | 27.08% | 27.08% |

Organization memory gained **25.52 percentage points** over no memory while executing **1.4063** more agencies per case. Against direct routing and episode retrieval, it lost **13.54 points** while executing **0.7188** and **0.8438** fewer agencies, respectively. Lower work at lower quality is not an efficiency advantage.

On partial cases, all three alternatives achieved full coverage, with **2.375** mean executions for organization memory, **2.75** for direct routing, and **3.25** for episode retrieval. Separate overhead remains: **27 formation executions**, **256 signature comparisons per memory condition**, and **84 reinstatement Effects** for organization memory. Planning/search effort beyond signature comparisons, latency, storage cost, and an amortization horizon were not measured.

### What the result supports

**Observed:** Under this protocol, adding the memory prior improved task coverage over the same kernel without memory. Related and partially matching episodes reached useful task findings despite changed literal referents. Partial cases reached the alternatives' full quality with fewer handler executions.

**Interpretation:** This motivates a possible narrower niche: an informative organizational prior may reduce execution work when past organization is relevant but exact replay is unnecessary. It does not establish reduced search or total computation; those require another comparison with complete cost accounting.

### What the result does not support

The experiment does not establish overall superiority to direct routing or nearest-episode reuse, general computational efficiency, usefulness on unrelated situations, robust handling of misleading similarity, general agent benefit, cross-domain generality, or cognitive/biological validity. Its small authored sample, conditional mock handlers, signal strengths, and fixed execution budget/order limit the conclusion.

### Failure boundary

In `misleading-customer`, a retrieved match had **Jaccard similarity 1**, yet organization memory executed **four** agencies and produced **zero coverage**. No memory also produced zero coverage but executed only **one** agency. Structural overlap was not sufficient evidence of useful reinstatement; Jaccard was not a calibrated confidence estimate.

In `unrelated-urgent-fallback`, organization memory produced **zero coverage**, while direct routing and episode retrieval achieved **full coverage**. No positive memory was recalled and no reinstatement Effects were applied. This was a failure of the remaining evidence-only organization, not damage from an applied memory. Episode retrieval used its declared direct-routing fallback; that is a legitimate architectural comparison, not baseline misconduct.

The aggregate coverage deficit against both routing alternatives comes entirely from the unrelated class. Misleading cases exposed poor coverage and wasted work, but their mean coverage was the same for all three alternatives. H7 therefore motivates a focused H8 comparison; it does not establish that reinstatement generally caused negative transfer or identify one remedy.

### Derived research questions

> **When should a retrieved organization be trusted, attenuated, or ignored?**

Two distinctions organize the question:

- **Retrieval similarity ≠ transfer utility:** resemblance of situations does not establish the benefit of reusing their organization.
- **Memory availability ≠ memory authority:** being retrievable does not establish how much influence a memory deserves now.

These are clarifications for this project, not claims of conceptual novelty. Current H6 assigns influence using `stored activation × structural similarity`. Recall can already filter matches, and ordinary inhibition can counter activation; v1 supplied no separate applicability judgment or memory-condition fallback. A confidence, abstention, conflict-detection, or fallback policy remains a question, not an implemented answer.

[H8](research-hypotheses.md#h8-negative-transfer) should next characterize harmful or wasteful reinstatement against matched abstention and memory-free alternatives. [H11](research-hypotheses.md#h11-richer-structural-similarity) can later test whether richer structure predicts reuse better. [H9](research-hypotheses.md#h9-utility-guided-memory) concerns historical utility, which need not imply present applicability. Reduced computation and amortization also connect to [H17](research-hypotheses.md#h17-reduced-agent-computation). None is resolved by this result.

### Current interpretation

The useful shift is from asking only whether organizational memory helps to asking **under what conditions remembered organization should influence current organization**. First characterize the failure under H8, then test proposed remedies. The formal claims, H6 rule, and Jaccard mechanism remain unchanged.

### Result artifacts

The authoritative record is the [first report](../evals/results/organization-memory/20261123T053956445Z-h7/report.md), [summary](../evals/results/organization-memory/20261123T053956445Z-h7/summary.json), [case observations](../evals/results/organization-memory/20261123T053956445Z-h7/cases.json), and [manifest](../evals/results/organization-memory/20261123T053956445Z-h7/manifest.json). The [replication verification](../evals/results/organization-memory/20261123T053959279Z-h7/replication.json) records identical cases, summaries, and formation artifacts. Both runs remain immutable.
