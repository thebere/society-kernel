# Organization-memory evaluation v1

This is the first descriptive H7 comparison, using [protocol v1](../../protocols/organization-memory.md). Nothing here changes the kernel's H6 rule or concept-set Jaccard similarity.

## Run and freeze

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run eval:organization-memory -- --register
npm run eval:organization-memory
npm run eval:organization-memory -- --replicate-of <first-run-id>
```

Registration freezes the executable sources, fixtures, rules, this README, protocol, compiler configuration, and dependency files by SHA-256 **before held-out execution**. The runner refuses changed inputs. Registration is exclusive: a revised experiment needs an explicit protocol/version revision, not an overwritten registration. The first scored run and its deterministic replication each receive a new immutable result directory. Unit/smoke tests execute only memory-formation/development cases, never held-out outcomes.

The CLI compiles TypeScript with the existing compiler to a temporary directory, runs it with Node, and deletes only that temporary build. No new dependencies are required. Run from the repository root. Artifacts live under `evals/results/organization-memory/<run-id>/`.

## Dataset and observation boundary

Eight manually authored memory-formation episodes are separate from 32 held-out episodes: eight **related**, eight **partial**, eight **unrelated**, eight **misleading**. They vary concept sets, strengths, facts, and required findings, not just entity names. Five literal role occupants differ across every episode. Related cases repeat a formation signature; partial cases change subsets/extensions. Unrelated signatures use only the three concepts absent from formation. Misleading cases repeat signatures with materially changed facts and task needs. Their classification is fixed independently of observed results.

Every selector receives exactly `Observation`: current facts, weighted concepts, and role bindings. It receives no case ID, case class, description, required findings, or expected organization. There is no hidden environment state. All conditions share the committed agency configuration, capabilities, objective definition, output scorer, operation requests, scheduler, and four-assessment budget. Formation cases and their labels are available for development; no held-out tuning occurs.

## Conditions fixed before scoring

| Condition | Selection and information use |
| --- | --- |
| No memory | Existing `runCycle()` propagation and threshold recruitment from current inputs. No recall or reinstatement. |
| Organization memory | Existing `recallKLines()`, positive Jaccard scores with minimum 0, highest score then K-line ID; apply **one** match's production `reinstatementEffects()` before current propagation. No utility weighting or aggregation. |
| Direct routing | Union the broad semantic concept-to-capability table in `baselines.ts` for positive signals, in canonical agency order. Presence rather than strength determines eligibility. It deliberately avoids threshold penalties; it is a credible simple semantic router. It has access to all observations but uses concept membership for selection. |
| Episode retrieval | Same concept signature, Jaccard and tie rule; retrieve the nearest previous episode and directly replay its routed agency recommendation. No activation prior or fresh recruitment. If no positive match exists, fall back to direct routing. Stored episode content is available; this baseline uses its explicit routing recommendation. |

Both memory banks use exactly the same eight previous episodes, with no outcome-based filtering. Formation runs the same cycle, assessment scheduler, and scorer. K-line utility records formation coverage but is never used for selection/reinstatement. Episode advice preserves the historical selected coalition, including recommendations that exceeded the old execution budget. Neither arm receives a hand-corrected past plan. Both incur the declared formation execution cost; organization memory additionally consolidates K-lines. No routing weights, thresholds, rules, or H6 parameters are fitted on held-out cases.

## Task model and shared execution policy

Cases require information such as inventory impact, a reroute option, or compliance verification. Handlers return conditional findings from **current facts**, through the real H3 `executeDispatch()` contract. They never receive scoring labels. Several capabilities can produce the same finding, and one capability can produce several. `scorer.ts` only examines required/produced finding sets; it has no agency identities. Different valid organizations can earn the same score.

All conditions request VERIFY and COMPARE at strength 1. After capability-filtered dispatch, the common scheduler chooses **one assessment per agency**, preferring VERIFY when declared supported and otherwise COMPARE. Assessment candidates are ordered by the unchanged canonical agency list, then the first **four** are executed sequentially. Other requests remain unexecuted. This is a resource-constrained mock task, not kernel scheduling or automatic feedback. The budget makes irrelevant early selections capable of displacing useful later work. The priority rule is deliberately simple and identical across arms; it can affect the result and is a limitation.

Primary outcome: unique required findings produced / unique required findings, per case in [0,1]. All cases have nonempty requirements. Secondary outcomes: handler executions, actual threshold recruits (zero for the two routing baselines), selected capabilities, dispatch requests, unnecessary executions (a handler supplies no required finding), skipped assessments, selected memory/similarity, recall comparisons, and reinstatement Effects. Extra findings are not penalized directly; they can waste the fixed budget. Counts are deterministic computation proxies, not latency or energy measurements.

Cold-start formation costs are retained separately from per-case costs. No amortization horizon or wall-clock advantage is claimed. Memory arms each scan eight signatures per held-out episode; reinstatement costs its generated/applied Effect count. Report quality and all cost dimensions separately; do not turn them into a weighted score.

## Predeclared descriptive analysis and interpretation

Report mean/median/min/max coverage, perfect/zero cases, mean executions, recruits, selections, dispatches, and unnecessary executions by condition and class. Retain all per-case paired coverage/execution differences: organization memory minus each alternative. Use all 32 cases with equal weight; report all eight cases per class. No stochastic repetitions, confidence intervals, significance test, tuned success threshold, or exclusions are justified for these authored deterministic cases.

The following labels are descriptive for **this protocol**, not population-level validation. `run.ts` implements these rules before scoring:

- Initial support: higher mean coverage than **every** baseline, with no class-level coverage loss to no memory; or at least equal mean quality and no greater mean executions against every baseline, with a strict execution reduction against at least one and no class-level quality loss to no memory.
- Mixed: mean coverage improves over no memory but the initial-support rule fails. This includes poorer comparison with a simpler alternative or quality/cost tradeoffs.
- Unsupported: neither of the above; no demonstrated mean-coverage improvement over no memory or qualifying matched-quality cost advantage.
- An implementation failure makes the run invalid/incomplete, preserves its artifacts, and establishes no H7 support. Repair requires a new protocol registration and run ID; never overwrite it. An undiscriminating task model must be identified as inconclusive in interpretation rather than generalized as evidence against all organization memory.

Report missing findings, budget displacement, unnecessary work, misleading cases, and differences from the two alternatives, including unfavorable observations. H8 and H11 may be informed by these cases but are not completed investigations here. Do not modify the mechanism after inspecting results.

## Files and limitations

`cases.ts` owns the split/labels, `baselines.ts` owns observation-only routing, `capabilities.ts` owns mock findings/common execution, `training.ts` forms both banks, `scorer.ts` owns task coverage, `run.ts` executes and aggregates, and `cli.mjs` freezes sources/persists reports. Tests protect scorer arithmetic, shared handlers/scoring, leakage boundaries, split integrity, and deterministic development execution.

Each run preserves manifest, input and memory snapshots, full per-case `cases.json` plus `measurements.jsonl`, aggregates, source snapshot, and readable report. The index is refreshed from preserved manifests/summaries, including failed attempts. Dirty-source runs record the actual base commit, status, and recoverable source/configuration snapshot with hashes.

For historical reproduction, check out the manifest's base commit in an isolated directory, restore the UTF-8 repository-relative files from `source-snapshot.json`, and restore `manifest.registration` as the suite's `registration.json`. Install the pinned lockfile dependencies and run the documented command. The restored code must match the registered snapshot hash; current changed sources are rejected. A replication verifies identical case observations, memory-formation artifacts, and summaries, and is not an independent additional sample.

Limits: deterministic mock domain; small authored sample; hand-authored task requirements and semantic router; concept-only Jaccard; fixed agency order and four-assessment budget; no stochastic capabilities; no real LLM/tool/API calls; no learned perception, realistic business optimizer, or cognitive-validity claim. Positive findings cannot cause direct harmful actions in this model; harm is missing information or displaced budget. These comparisons establish no general agent benefit, cross-domain superiority, sophisticated-planner advantage, biological plausibility, or production usefulness.
