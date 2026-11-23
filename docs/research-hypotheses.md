# Research hypotheses

This is the authoritative public register of Society Kernel's research claims: T1 and H1–H21, covering organization memory, cognitive control, transfer, agent integration, generality, and cognitive comparison. A claim introduced elsewhere must link to its entry here; changes to its meaning belong here.

The [documentation map](README.md) explains the public research surfaces. [Research methods](research-methods.md) defines how claims are investigated. [References](references.md) records intellectual sources. The [results index](../evals/results/README.md) records comparative findings and links to run artifacts. These documents serve different purposes and do not establish independent versions of a hypothesis.

## Central thesis

### T1: Memory for cognitive organization

Remembering and reinstating a previously useful organization of capabilities can improve processing of structurally related situations beyond the benefit obtained from remembering episode content alone.

The claim concerns the contribution of remembered organization while current facts, available capabilities, and access to content memory are controlled. An improvement must be established against suitable alternatives and include the cost of consolidation, retrieval, and reinstatement. Replaying a previous solution regardless of current evidence does not establish this thesis.

H1–H6 make the mechanism precise; H7–H12 investigate its usefulness and limits. H13–H19 extend the investigation to agents, persistence, scale, and other domains. T1 has no comparative evaluation result yet.

## Status and interpretation

Implementation status and empirical support are separate. **Operationalized** means a mechanism exists with correctness tests. **Partial** means only part of the proposed behavior exists. **Proposed** means the research claim remains to be implemented or investigated. None of these labels means a comparative advantage has been demonstrated.

| Entries | Implementation or investigation status | Evidence boundary |
| --- | --- | --- |
| H1–H5 | Operationalized | Deterministic mechanisms, including agency-local execution, have unit/integration coverage; comparative usefulness untested. |
| H6–H19, H21 | Proposed | No completed comparative evaluation recorded. |
| H20 | Methodological requirement | Defines the comparison obligation across all workstreams. |

Each evaluation scopes its claims to a named task distribution, domain, implementation, and resource budget. The entries below define the proposition and what would weaken it; executable protocols define the actual comparisons and decision criteria. Sources of inspiration are catalogued in [References](references.md), including Minsky's proposals and comparison architectures. Historical terminology alone supplies no empirical support for Society Kernel.

## Mechanism and transfer

### H1: Distributed conceptual activation

**Claim:** A shared concept signal can produce different activation contributions across specialized capabilities through local sensitivities.

**Boundary:** The deterministic propagation implementation establishes the mechanics. It does not establish that the sensitivities are learned, cognitively realistic, or better than direct routing. See [`propagation.test.ts`](../ts/src/society/propagation.test.ts).

**Counterevidence:** Contributions fail to reflect the configured signal strengths and sensitivities, or produce inconsistent or unexplained activation.

### H2: Dynamic coalition formation

**Claim:** Multiple active concepts can jointly recruit a capability coalition through accumulated activation and local thresholds, without a procedure explicitly choosing the complete coalition.

**Boundary:** Accumulation and recruitment are implemented; usefulness relative to a centralized selection policy remains untested. See [`recruitment.test.ts`](../ts/src/society/recruitment.test.ts) and [`cycle.test.ts`](../ts/src/society/cycle.test.ts).

**Counterevidence:** Recruitment is inconsistent with accumulated activation and thresholds. Equal or better direct routing with less machinery weakens the architectural motivation rather than the arithmetic implementation.

### H3: Shared control with local interpretation

**Claim:** A shared operation identity can coordinate recruited, capable agencies while allowing each agency to implement the operation according to its competence.

**Boundary:** Shared operation dispatch and agency-local execution are implemented and tested using deterministic capability implementations, including async handlers. See [`dispatch.test.ts`](../ts/src/society/dispatch.test.ts), [`execution.test.ts`](../ts/src/society/execution.test.ts), and the [canonical integration test](../ts/src/integration/society-cycle.integration.test.ts). This operationalizes the architectural mechanism, not its usefulness relative to ordinary function calls or alternative orchestration. Dispatch, execution, typed results, and Workspace Effects remain distinct; execution results do not automatically change state. Real heterogeneous capabilities remain the proposed investigation under H14.

**Counterevidence:** The abstraction prevents needed local behavior, routes operations incorrectly, or adds complexity without improving coordination over ordinary function calls or routing.

### H4: Consolidation of cognitive organization

**Claim:** A completed cycle can be consolidated into a representation of organization without retaining the episode's literal role referents.

**Boundary:** Consolidation stores the concept signature, recruited activations, bound role identities, dispatched operation identities, and caller-supplied utility. It does not identify causal relevance or establish successful transfer. See [`kline.test.ts`](../ts/src/memory/kline.test.ts) and [the memory semantics](architecture.md#consolidation-and-structural-recall).

**Counterevidence:** Consolidation depends on literal referents, loses the specified organizational state, or cannot reproduce the same representation from equivalent inputs.

### H5: Structural recall across literal episodes

**Claim:** An episode can retrieve organizational memory from a different episode when active concept structure overlaps despite changed literal entities.

**Boundary:** Concept-set signatures and Jaccard recall are implemented and tested in [`kline.test.ts`](../ts/src/memory/kline.test.ts). Recall is read-only. Neither richer relational similarity nor transfer benefit is established.

**Counterevidence:** Entity substitution changes recall despite unchanged concept structure, or the defined overlap and ranking rules are violated. Retrieval of operationally inappropriate memories is a further utility question under H8 and H11.

### H6: Reinstatement

**Claim:** Recalled organization can prime current capability recruitment while current evidence remains able to confirm, modify, override, or reject that prior.

**Boundary:** Proposed; this is the next mechanism experiment. Current recall does not change the Workspace. Activation injection, threshold reduction, sensitivity changes, operation priming, and role priming are distinct candidate reinstatement mechanisms; none is selected or implemented by this entry.

**Counterevidence:** Memory forces the old coalition despite contradictory evidence, imports old literal referents, or cannot be distinguished from replay.

### H7: Transfer benefit

**Claim:** Reinstating relevant organization improves task quality, useful coalition formation, or computational efficiency on structurally related episodes relative to the same system without assistance and to suitable retrieval alternatives.

**Boundary:** Proposed. The contribution must exceed access to the old episode or its content alone. Cost and quality are evaluated separately under the [methods](research-methods.md).

**Counterevidence:** Benefits disappear under matched conditions, fail on held-out episodes, are explained by extra information or tuning, or are outweighed by retrieval and adaptation costs.

### H8: Negative transfer

**Claim:** Organization memory can provide positive transfer while limiting harm from superficially similar but operationally inappropriate memories.

**Boundary:** Proposed. Abstention, weak recall, confidence, competing memories, inhibition, and current-evidence override are candidate controls, not implemented guarantees.

**Counterevidence:** Misleading memories systematically degrade task quality or make recovery more expensive than the no-memory and retrieval baselines within the protocol's declared tolerance.

### H9: Utility-guided memory

**Claim:** Outcome information can improve decisions about which organizations to consolidate, retain, reinforce, weaken, or reuse compared with fixed retention and recall policies.

**Boundary:** Proposed. Utility is currently supplied externally. Identifying causal contributors to success and selecting the right consolidation target remain open design questions.

**Counterevidence:** Apparent gains depend on outcome leakage, arbitrary utility assignments, or retention policies that perform no better than simpler alternatives.

### H10: Memory coexistence, competition, and decay

**Claim:** Organization memory remains useful with many partially overlapping, contradictory, redundant, or obsolete experiences through appropriate competition, consolidation, generalization, specialization, and forgetting.

**Boundary:** Proposed. Ranking multiple recalled K-lines is implemented; a useful memory-management policy is not established.

**Counterevidence:** Interference, overgeneralization, or memory growth erodes benefit faster than experience improves it, or memory management merely shifts the problem into extensive manual curation.

### H11: Richer structural similarity

**Claim:** A richer similarity representation can improve useful recall beyond concept-set Jaccard similarity while preserving interpretability and experimental control.

**Boundary:** Proposed. Weighted concepts, role/relational structure, activation geometry, graph similarity, learned representations, and metric learning are alternatives to investigate.

**Counterevidence:** Better apparent similarity fails to improve downstream behavior, depends on memorized identities, or imposes cost and opacity without corresponding benefit.

### H12: Learning sensitivities and thresholds

**Claim:** Recruitment parameters can be learned from experience while retaining useful and inspectable coalition dynamics, reducing dependence on manually authored behavior.

**Boundary:** Proposed. Sensitivities, thresholds, and supported operations are currently configured explicitly.

**Counterevidence:** Learned parameters fail outside training episodes, require equivalent manual tuning, or reveal that hand-authored weights account for the claimed memory benefit.

## Agent integration

### H13: Integration with existing agent memory

**Claim:** Organization memory adds useful capability alongside semantic, episodic, conversation, trajectory, or procedural/tool memory.

**Boundary:** Proposed. Its contribution must be separable from ordinary retrieval and from giving an agent more context or tools.

**Counterevidence:** Content memory alone explains the gain, or combined memory adds cost and confusion without improved outcomes.

### H14: Real agent capabilities

**Claim:** Coalition and shared-operation mechanisms remain useful when agencies are heterogeneous real capabilities, including tools, prompts, subagents, retrievers, procedures, code execution, domain models, verification, and human escalation.

**Boundary:** Proposed. Expensive, asynchronous, and stochastic execution introduce coordination questions absent from the deterministic kernel.

**Counterevidence:** Direct orchestration or a simpler agent controller achieves equal or better task quality at lower cost, or the abstraction obstructs capability-specific needs.

### H15: Persistence and capability evolution

**Claim:** Organizational memories can survive process/session boundaries and remain useful as capabilities, schemas, and agents evolve, with invalid memories recognized rather than silently reused.

**Boundary:** Proposed. Storage identity, indexing, provenance, versioning, invalidation, concurrent use, and shared memory remain research concerns.

**Counterevidence:** Persisted memories become unreliable after ordinary changes, require continual manual repair, or lose their contribution across sessions or capability versions.

### H16: Scale

**Claim:** Recall and memory management can retain useful precision and task benefit as memory volume grows, at acceptable memory, write, indexing, consolidation, and retrieval costs.

**Boundary:** Proposed. Cognitive semantics should remain separable from the storage/indexing mechanism. Linear scanning can support an experiment without demonstrating systems scalability.

**Counterevidence:** Retrieval quality, latency, throughput, or resource use violates the protocol's declared operating budget as memory volume increases.

### H17: Reduced agent computation

**Claim:** Remembered organization can reduce reasoning steps, irrelevant branches, context retrieval, tool calls, token consumption, or latency at matched task quality.

**Boundary:** Proposed. Efficiency gains and accuracy gains are separate outcomes; accuracy improvement alone does not establish this claim.

**Counterevidence:** Savings disappear when memory construction and retrieval are included, or lower computation is achieved by doing less work or accepting worse outcomes.

## Generality and scientific comparison

### H18: Generality across domains

**Claim:** The same kernel semantics can support substantially different task domains without redesigning the underlying mechanism.

**Boundary:** Proposed beyond the supply-chain reference environment. Scientific or biomedical research operations are candidate second domains. Renaming concepts is insufficient evidence.

**Counterevidence:** Each domain requires a different mechanism, or apparent generality is only a common wrapper around domain-specific workflows.

### H19: Cross-domain structural correspondence

**Claim:** Organizational structures learned in one domain can be meaningfully related to or reused in another under an explicit structural mapping.

**Boundary:** Proposed and stronger than H18. Independent success of one kernel in two domains does not establish cross-domain transfer; shared words such as verification and escalation are insufficient.

**Counterevidence:** Transfer fails once vocabulary and manual mapping advantages are controlled, or misleading correspondences dominate useful reuse.

### H20: Comparison with alternative architectures

**Methodological requirement:** Every comparative claim must identify suitable simpler and established alternatives, matched conditions, measured outcomes, and the limits of the comparison. This requirement applies to memory, orchestration, runtimes, software architecture, and interfaces.

H20 preserves the project's comparison question; it is an evaluation obligation rather than a separate empirical claim. [Research methods](research-methods.md#comparison-design) owns baseline selection and experimental design. A missing, weak, or unfair comparison leaves the relevant hypothesis untested.

### H21: Cognitive phenomena

**Claim:** The architecture can reproduce or explain specified phenomena involving transfer, priming, interference, generalization, specialization, forgetting, competition, context sensitivity, strategy reuse, habit-like recruitment, or recovery after changed conditions.

**Boundary:** Proposed. Engineering behavior may motivate a cognitive model; psychological or neurological relevance requires explicit comparison with empirical findings and competing explanations.

**Counterevidence:** Agreement is only verbal, is obtained through unrestricted fitting, or fails to explain/predict the empirical phenomenon better than suitable alternatives.
