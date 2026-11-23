# Evaluations

This directory is the home for executable research comparisons and their evidence for the public research claims: organizational memory/control, agent integration, persistence/scale, generality, and cognitive comparison.

The [hypothesis register](../docs/research-hypotheses.md) defines claims. [Research methods](../docs/research-methods.md) defines the common method. Protocols specify an individual study. Evaluation code executes it; raw measurements and reports record what happened.

## Current state

The [organization-memory suite](suites/organization-memory/README.md) implements the first four-condition H7 comparison under [protocol v1](protocols/organization-memory.md). Its held-out run and exact replication produced mixed evidence, retained in the [results index](results/README.md). Existing mechanism correctness tests remain with the kernel in [`ts/src`](../ts/src/); evaluation machinery tests live beside the suite.

## Layout and ownership

| Location | Responsibility | Current state |
| --- | --- | --- |
| `protocols/` | Versioned experiment definitions linked to hypothesis IDs. | Memory protocol v1 registered before scored execution. |
| `suites/<suite-id>/` | Runner, treatment/baseline adapters, scoring, fixtures, registration, and suite instructions. | Organization-memory suite v1 implemented. |
| `results/<suite-id>/<run-id>/` | Immutable completed, failed, and incomplete run artifacts. | Initial H7 run and exact deterministic replication preserved. |
| `results/README.md` | Comparative results index linking exact runs and their limits. | Refreshed from retained run manifests/summaries. |

These locations define a reporting contract, not an existing generic evaluation framework. Suites may use the appropriate language/runtime for their architectures while producing an auditable record.

## Run artifact contract

Each runner allocates a unique run directory and writes:

- `manifest.json`: run and suite IDs, protocol version/hash, hypothesis IDs, workstream and domain, source/baseline revisions, dirty-source snapshot reference/hash, input/configuration hashes, exact invocation, seeds, budgets, repetitions, and environment/dependency/model/tool versions.
- `measurements.jsonl`: per-case, per-condition, per-repetition observations with case IDs, completion/error status, measured outcomes, costs, and trace references. Failed and missing observations retain their status instead of disappearing.
- `summary.json`: aggregates derived from those observations, sample counts, exclusions/failures, units, uncertainty where applicable, declared decision criteria, and run completion status.
- `report.md`: a readable account of the comparison, observations, scope, limitations, and links to the protocol and raw artifacts. Label generated observations and researcher interpretation distinctly.

Preserve the configuration and accessible input/source snapshots needed to reproduce the run, or a manifest pointing to versioned datasets and access requirements. Protocol revisions and actual artifacts remain identifiable after later code changes. Re-runs get new run IDs.

The first suite additionally writes `cases.json` (the readable JSON counterpart of raw measurements), `inputs.json`, `memories.json`, and `source-snapshot.json`. The snapshot retains dirty executable sources/configuration with a manifest hash. Deterministic replications also write `replication.json`. The registered source/input hashes must match before scoring; the two retained runs are repeatability checks on one dataset, not independent samples.

## Reporting lifecycle

When a suite is implemented, its documented command should execute the comparison, retain raw observations, derive aggregates, write the run report, and refresh the results index from preserved run summaries. The index should retain historical comparisons and failed/incomplete runs, with explicit labels; a newest result must not silently replace an older conclusion or a different protocol.

The root README links to the results index instead of holding a second leaderboard. Runs update evidence artifacts and the index; changes to claim wording or scientific interpretation remain explicit research edits. Automated generation must not promote a unit test, demonstration, invalid comparison, or incomplete run into a supported research claim.

The first implementation should establish this contract for one meaningful comparison before extracting shared runner/reporting infrastructure. A new workstream adds its own protocol and suite rather than assuming that evidence for one claim establishes another.
