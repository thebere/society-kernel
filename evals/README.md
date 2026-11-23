# Evaluations

This directory is the home for executable research comparisons and their evidence for the public research claims: organizational memory/control, agent integration, persistence/scale, generality, and cognitive comparison.

The [hypothesis register](../docs/research-hypotheses.md) defines claims. [Research methods](../docs/research-methods.md) defines the common method. Protocols specify an individual study. Evaluation code executes it; raw measurements and reports record what happened.

## Current state

No comparative suite or result-publishing command is implemented yet. The [first protocol](protocols/organization-memory.md) is a design draft for reinstatement and transfer. The [results index](results/README.md) records the current evidence state. Existing correctness tests remain with the kernel in [`ts/src`](../ts/src/).

## Layout and ownership

| Location | Responsibility | Current state |
| --- | --- | --- |
| `protocols/` | Versioned experiment definitions linked to hypothesis IDs. | Initial memory protocol drafted. |
| `suites/<suite-id>/` | Future runner, treatment/baseline adapters, scoring, fixtures or dataset manifests, and suite-specific instructions. | Created when a suite is implemented. |
| `results/<suite-id>/<run-id>/` | Future immutable run artifacts, including failed and incomplete attempts. | No runs recorded. |
| `results/README.md` | Comparative results index linking exact runs and their limits. | Explicitly records no comparative results. |

These locations define a reporting contract, not an existing generic evaluation framework. Suites may use the appropriate language/runtime for their architectures while producing an auditable record.

## Run artifact contract

Each future runner should allocate a unique run directory and write:

- `manifest.json`: run and suite IDs, protocol version/hash, hypothesis IDs, workstream and domain, source/baseline revisions, dirty-source snapshot reference/hash, input/configuration hashes, exact invocation, seeds, budgets, repetitions, and environment/dependency/model/tool versions.
- `measurements.jsonl`: per-case, per-condition, per-repetition observations with case IDs, completion/error status, measured outcomes, costs, and trace references. Failed and missing observations retain their status instead of disappearing.
- `summary.json`: aggregates derived from those observations, sample counts, exclusions/failures, units, uncertainty where applicable, declared decision criteria, and run completion status.
- `report.md`: a readable account of the comparison, observations, scope, limitations, and links to the protocol and raw artifacts. Label generated observations and researcher interpretation distinctly.

Preserve the configuration and accessible input/source snapshots needed to reproduce the run, or a manifest pointing to versioned datasets and access requirements. Protocol revisions and actual artifacts remain identifiable after later code changes. Re-runs get new run IDs.

## Reporting lifecycle

When a suite is implemented, its documented command should execute the comparison, retain raw observations, derive aggregates, write the run report, and refresh the results index from preserved run summaries. The index should retain historical comparisons and failed/incomplete runs, with explicit labels; a newest result must not silently replace an older conclusion or a different protocol.

The root README links to the results index instead of holding a second leaderboard. Runs update evidence artifacts and the index; changes to claim wording or scientific interpretation remain explicit research edits. Automated generation must not promote a unit test, demonstration, invalid comparison, or incomplete run into a supported research claim.

The first implementation should establish this contract for one meaningful comparison before extracting shared runner/reporting infrastructure. A new workstream adds its own protocol and suite rather than assuming that evidence for one claim establishes another.
