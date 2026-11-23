import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { cpus, release, tmpdir, totalmem } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const suitePath = "evals/suites/organization-memory";
const protocolPath = "evals/protocols/organization-memory.md";
const registrationPath = join(root, suitePath, "registration.json");
const resultRoot = join(root, "evals/results/organization-memory");
const encode = value => `${JSON.stringify(value, null, 2)}\n`;
const hash = text => createHash("sha256").update(text).digest("hex");
const readJSON = path => JSON.parse(readFileSync(path, "utf8"));
const writeJSON = (path, value) => writeFileSync(path, encode(value), { flag: "wx" });
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
function filesIn(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? filesIn(join(path, entry.name)) : [join(path, entry.name)]);
}
function sourceSnapshot() {
  const paths = [...filesIn(join(root, "ts")), ...filesIn(join(root, suitePath))]
    .filter(path => /\.(ts|mjs)$/.test(path) || path.endsWith("/README.md"));
  paths.push(...["package.json", "pnpm-lock.yaml", "tsconfig.json", "biome.json", protocolPath].map(path => join(root, path)));
  return { version: 1, files: paths.sort().map(path => ({ path: relative(root, path), content: readFileSync(path, "utf8") })) };
}
function refreshIndex() {
  const rows = existsSync(resultRoot) ? readdirSync(resultRoot).sort().flatMap(id => {
    const directory = join(resultRoot, id);
    if (!existsSync(join(directory, "manifest.json"))) return [];
    const manifest = readJSON(join(directory, "manifest.json"));
    const summary = existsSync(join(directory, "summary.json")) ? readJSON(join(directory, "summary.json")) : null;
    return [`| [${id}](organization-memory/${id}/report.md) | H7 / protocol v1 | ${manifest.status} | ${manifest.status === "completed" ? summary?.evidenceStatus ?? "no evidence" : "no valid evidence"} | ${manifest.replicationOf ? "Determinism replication" : "Initial comparison"} |`];
  }) : [];
  const path = join(root, "evals/results/README.md");
  let text = readFileSync(path, "utf8");
  const table = `<!-- organization-memory-runs:start -->\n| Run | Scope | Status | Evidence | Purpose |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}\n<!-- organization-memory-runs:end -->`;
  const pattern = /<!-- organization-memory-runs:start -->[\s\S]*?<!-- organization-memory-runs:end -->/;
  text = pattern.test(text) ? text.replace(pattern, table) : `${text.trim()}\n\n## Recorded organization-memory runs\n\n${table}\n`;
  // Update only the index's state sentences, preserving other workstreams/history.
  text = text.replace("No completed comparative evaluations are currently recorded. No comparative performance advantage over another architecture is currently claimed.",
    "Organization-memory H7 comparative runs are recorded below. Evidence is scoped to the deterministic mock-domain protocol; no general performance advantage is claimed.");
  text = text.replace("No runs; [initial protocol](../protocols/organization-memory.md) is a design draft.",
    "See the preserved H7 runs below and [protocol v1](../protocols/organization-memory.md).");
  writeFileSync(path, text);
}

function report(manifest, result) {
  const { summary, measurements, training } = result;
  const fmt = number => number.toFixed(4);
  const table = stats => ["| Condition | Mean coverage | Median | Min–max | Mean executions | Mean selected | Mean recruits | Mean dispatches | Mean unnecessary | Perfect | Zero |",
    "| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...Object.entries(stats).map(([condition, value]) => `| ${condition} | ${fmt(value.meanCoverage)} | ${fmt(value.medianCoverage)} | ${fmt(value.minCoverage)}–${fmt(value.maxCoverage)} | ${fmt(value.meanAgencyExecutions)} | ${fmt(value.meanSelectedAgencies)} | ${fmt(value.meanRecruitedAgencies)} | ${fmt(value.meanDispatchCount)} | ${fmt(value.meanUnnecessaryExecutions)} | ${value.perfectCoverageCases} | ${value.zeroCoverageCases} |`)].join("\n");
  const blocks = [
    `# H7 organization-memory comparison: ${manifest.runId}`,
    `## Run metadata\n\nRun ID: ${manifest.runId}. Time: ${manifest.startedAt}. Hypothesis: H7. Protocol: [organization-memory v1](../../../protocols/organization-memory.md), SHA-256 ${manifest.protocol.sha256}. Suite: ${manifest.suite.version}. Base commit: ${manifest.source.commit}. Dirty working tree: ${manifest.source.dirty}. Source snapshot: [source-snapshot.json](source-snapshot.json), SHA-256 ${manifest.source.snapshotSha256}. ${manifest.replicationOf ? `Determinism replication of ${manifest.replicationOf}.` : "First scored execution under the registered protocol."}`,
    "## Research question\n\nWhen a new situation is structurally related to a previous episode but has different literal referents, does organization-memory reinstatement improve task outcome or computational efficiency relative to reasonable alternatives?",
    "## Conditions\n\nNo memory uses the unchanged Society cycle. Organization memory adds one top recalled match's production H6 activation Effects before propagation. Direct routing unions the fixed semantic concept-to-capability table for positive signals. Episode retrieval replays the nearest stored episode's routing recommendation, falling back to direct routing when no positive match exists. All conditions receive the same observations, capabilities, four-assessment budget, common execution scheduler, and scorer. See the [frozen suite specification](../../../suites/organization-memory/README.md) and recoverable source snapshot for exact policies.",
    `## Dataset\n\nMemory formation: ${manifest.dataset.formationCases} cases. Held-out: ${manifest.dataset.scoredCases} distinct cases, eight each related, partial, unrelated, misleading. All five role occupants differ between formation and held-out episodes. No held-out outcomes were used for memory formation, routing rules, parameter tuning, or registration. [inputs.json](inputs.json) preserves facts, concepts, requirements, configuration, and routing table.`,
    "## Primary metric\n\nTask coverage = unique required findings produced by executed assessments / unique required findings. It is not coalition agreement. Conditional handlers derive findings from current facts; several different capabilities can satisfy overlapping requirements. Every case has at least one requirement.",
    "## Secondary metrics\n\nLocal handler executions, selected agencies, actual threshold recruits, all dispatch requests, unnecessary executions (a handler produces no required finding), skipped assessments, recall comparisons, and reinstatement Effects. Direct/replay policies bypass recruitment, so their actual threshold-recruit count is zero; selected count is provided for comparing organization size. All counts are deterministic work proxies. No measured latency, energy, amortized gain, significance test, or population generalization is claimed.",
    `## Results\n\nGenerated observations, all ${manifest.dataset.scoredCases * 4} paired observations completed.\n\n${table(summary.byCondition)}`,
    ...Object.entries(summary.byClass).map(([kind, stats]) => `### ${kind}\n\n${table(stats)}`),
    `## Pairwise comparison\n\nDifferences are organization memory minus the named baseline. Coverage is in [0,1] units; positive execution difference means more work.\n\n| Baseline | Mean coverage difference | Mean execution difference |\n| --- | ---: | ---: |\n${summary.pairs.map(pair => `| ${pair.baseline} | ${fmt(pair.meanCoverageDifference)} | ${fmt(pair.meanExecutionDifference)} |`).join("\n")}`,
    `### Class-level coverage differences\n\n| Baseline | Related | Partial | Unrelated | Misleading |\n| --- | ---: | ---: | ---: | ---: |\n${summary.pairs.map(pair => `| ${pair.baseline} | ${["related", "partial", "unrelated", "misleading"].map(kind => fmt(pair.byClass[kind])).join(" | ")} |`).join("\n")}`,
    `## Formation and memory overhead\n\n${training.measurements.length} formation cycles; ${training.measurements.reduce((sum, row) => sum + row.executions, 0)} formation handler executions; ${training.measurements.reduce((sum, row) => sum + row.dispatches, 0)} formation dispatch requests. Each memory condition is charged that cold-start execution work separately. Organization memory stores ${training.bank.klines.length} K-lines with ${training.measurements.reduce((sum, row) => sum + row.storedActivationEntries, 0)} activation entries; episode retrieval stores ${training.bank.episodes.length} episode/advice records. Each memory arm scans eight signatures per held-out case (256 total). Organization memory generated/applied ${measurements.filter(row => row.condition === "organization-memory").reduce((sum, row) => sum + row.costs.reinstatementEffectCount, 0)} activation Effects. These dimensions are not added into an arbitrary total-cost score.`,
    `## Observed failure cases\n\nThe following organization-memory cases have incomplete task coverage; no case was removed or repaired after scoring. Missing findings and skipped assessments are retained in raw results.\n\n| Case | Class | Coverage | Missing findings | Skipped assessments | Unnecessary executions |\n| --- | --- | ---: | --- | ---: | ---: |\n${measurements.filter(row => row.condition === "organization-memory" && row.coverage < 1).map(row => `| ${row.caseId} | ${row.caseClass} | ${fmt(row.coverage)} | ${row.missing.join(", ")} | ${row.costs.skippedAssessments} | ${row.unnecessaryExecutions} |`).join("\n")}`,
    `## Interpretation\n\n${summary.interpretation}\n\nThis is the predeclared descriptive classification, not a claim of broad scientific support. The full class and baseline comparisons govern the scope; increased coverage alone establishes no efficiency advantage. Misleading cases expose boundaries relevant to H8/H11 but do not complete those investigations.`,
    "## Limitations\n\nDeterministic mock domain; small sample; hand-authored task requirements, facts, concepts, and semantic routing table; simple Jaccard similarity; fixed canonical agency priority and four-assessment budget; no stochastic capabilities; no real LLM/tool/API calls; no claim of cognitive validity, realistic business performance, general agent benefit, biological plausibility, cross-domain superiority, sophisticated-planner advantage, or production usefulness. Memory-only and no-memory use graded activation while the direct baseline uses signal presence. Baseline schedules and handlers are matched, but selection mechanisms differ by design. Findings have only informational value; negative effects are omissions and budget displacement, not harmful business actions. No utility selection, aggregation, forgetting, or H6 modification was made.",
    `## H7 status\n\nInvestigated — ${summary.evidenceStatus} under this run. H6 remains operationalized and unchanged. H8–H11 remain separate questions. [Manifest](manifest.json), [case results](cases.json), [raw measurements](measurements.jsonl), [summary](summary.json), and [formation artifacts](memories.json) preserve this attempt.`,
  ];
  return `${blocks.join("\n\n")}\n`;
}

const args = process.argv.slice(2);
if (args.some((arg, i) => arg !== "--register" && arg !== "--replicate-of" && args[i - 1] !== "--replicate-of")) {
  throw new Error("Usage: npm run eval:organization-memory -- [--register | --replicate-of RUN_ID]");
}
const build = mkdtempSync(join(tmpdir(), "society-h7-"));
try {
  execFileSync(join(root, "node_modules/.bin/tsc"), ["--project", "tsconfig.json", "--noEmit", "false", "--outDir", build], { cwd: root, stdio: "inherit" });
  const require = createRequire(import.meta.url);
  const compiled = path => require(join(build, suitePath, path));
  const { formationCases, heldOutCases } = compiled("cases.js");
  const { runExperiment } = compiled("run.js");
  const { conditions, suiteVersion, assessmentBudget } = compiled("types.js");
  const { routingTable } = compiled("baselines.js");
  const { agencies } = require(join(build, "ts/src/domains/supply-chain/agencies.js"));
  const inputs = { formationCases, heldOutCases, agencies, routingTable, assessmentBudget };
  const trainingIds = new Set(formationCases.map(task => task.id));
  const trainingReferents = new Set(formationCases.flatMap(task => task.observation.bindings.map(binding => binding.value)));
  if (heldOutCases.some(task => trainingIds.has(task.id) || task.observation.bindings.some(binding => trainingReferents.has(binding.value)))) {
    throw new Error("Memory formation/held-out leakage");
  }
  const snapshot = sourceSnapshot();
  const snapshotHash = hash(encode(snapshot));
  const inputHash = hash(encode(inputs));
  if (args.includes("--register")) {
    writeJSON(registrationPath, { protocolVersion: "v1", suiteVersion, registeredAt: new Date().toISOString(),
      sourceSnapshotSha256: snapshotHash, inputSha256: inputHash,
      files: snapshot.files.map(file => ({ path: file.path, sha256: hash(file.content) })),
      note: "Frozen before held-out execution. Development tests use formation-derived cases only." });
    process.stdout.write(`Registered protocol v1 before scoring. Source SHA-256: ${snapshotHash}\n`);
  } else {
    const registration = readJSON(registrationPath);
    if (registration.sourceSnapshotSha256 !== snapshotHash || registration.inputSha256 !== inputHash) {
      throw new Error("Frozen source/input mismatch; do not score a changed registered experiment");
    }
    const replicationOf = args.includes("--replicate-of") ? args[args.indexOf("--replicate-of") + 1] : null;
    if (args.includes("--replicate-of") && (!replicationOf || !/^[a-zA-Z0-9_-]+$/.test(replicationOf))) throw new Error("Invalid replication run ID");
    const runId = `${new Date().toISOString().replace(/[-:.]/g, "")}-h7`;
    mkdirSync(resultRoot, { recursive: true });
    const directory = join(resultRoot, runId);
    mkdirSync(directory);
    const packageInfo = readJSON(join(root, "package.json"));
    const status = git(["status", "--porcelain=v1", "--untracked-files=all"]);
    const manifest = { runId, startedAt: new Date().toISOString(), status: "running", hypothesisIds: ["H7"],
      contextHypotheses: ["H6", "H8", "H20"], workstream: "organizational-memory/control", domain: "deterministic-supply-chain",
      protocol: { path: protocolPath, version: "v1", sha256: hash(readFileSync(join(root, protocolPath))) },
      suite: { path: suitePath, version: suiteVersion }, registration,
      source: { commit: git(["rev-parse", "HEAD"]), dirty: status.length > 0, status, snapshot: "source-snapshot.json", snapshotSha256: snapshotHash },
      inputs: { path: "inputs.json", sha256: inputHash },
      dataset: { formationCases: formationCases.length, scoredCases: heldOutCases.length,
        classes: Object.fromEntries(["related", "partial", "unrelated", "misleading"].map(kind => [kind, heldOutCases.filter(task => task.class === kind).length])) },
      conditions, primaryOutcome: "unique required findings produced / unique required findings",
      secondaryMetrics: ["executions", "selected agencies", "threshold recruits", "dispatches", "unnecessary executions", "recall comparisons", "reinstatement effects", "skipped assessments"],
      rules: { reinstatement: "stored activation * Jaccard similarity", similarity: "concept-set Jaccard; empty/zero matches excluded", selection: "top positive match; ID ascending ties", utility: "not used", aggregation: "none" },
      budgets: { localAssessmentsPerCase: assessmentBudget, repeatedCycles: false, seeds: [], repetitions: 1, heldOutTuning: 0 },
      invocation: { argv: process.argv, npmCommand: process.env.npm_lifecycle_script ?? null, cwd: root }, replicationOf,
      environment: { node: process.version, versions: process.versions, platform: process.platform, arch: process.arch,
        hardware: { cpuModel: cpus()[0]?.model ?? "unknown", logicalCPUs: cpus().length, memoryBytes: totalmem(), osRelease: release() },
        dependencies: packageInfo.dependencies, devDependencies: packageInfo.devDependencies, externalModels: [], externalAPIs: [] },
      notes: ["Dirty source is recoverable from source-snapshot.json. Private research and Codex files are excluded.", "All measurements are deterministic counts/coverage, not hardware timing."] };
    writeJSON(join(directory, "manifest.json"), manifest);
    writeJSON(join(directory, "source-snapshot.json"), snapshot);
    writeJSON(join(directory, "inputs.json"), inputs);
    try {
      const result = await runExperiment(heldOutCases, formationCases, row => appendFileSync(join(directory, "measurements.jsonl"), `${JSON.stringify(row)}\n`));
      writeJSON(join(directory, "cases.json"), result.measurements);
      writeJSON(join(directory, "memories.json"), result.training);
      writeJSON(join(directory, "summary.json"), result.summary);
      if (replicationOf) {
        const previous = join(resultRoot, replicationOf);
        const verification = {
          identicalCases: encode(result.measurements) === encode(readJSON(join(previous, "cases.json"))),
          identicalSummary: encode(result.summary) === encode(readJSON(join(previous, "summary.json"))),
          identicalMemories: encode(result.training) === encode(readJSON(join(previous, "memories.json"))),
        };
        writeJSON(join(directory, "replication.json"), verification);
        if (Object.values(verification).some(value => !value)) throw new Error("Deterministic replication mismatch");
      }
      manifest.status = "completed";
      manifest.finishedAt = new Date().toISOString();
      writeFileSync(join(directory, "manifest.json"), encode(manifest));
      writeFileSync(join(directory, "report.md"), report(manifest, result), { flag: "wx" });
      process.stdout.write(`Organization Memory Evaluation\nRun: ${runId}\nCases: ${heldOutCases.length}\n\nCondition              Coverage   Executions\n`);
      for (const condition of conditions) {
        const value = result.summary.byCondition[condition];
        process.stdout.write(`${condition.padEnd(23)}${value.meanCoverage.toFixed(4).padEnd(11)}${value.meanAgencyExecutions.toFixed(4)}\n`);
      }
      process.stdout.write(`\n${result.summary.interpretation}\n\nArtifacts: evals/results/organization-memory/${runId}/report.md\n`);
    } catch (error) {
      manifest.status = "invalid";
      manifest.finishedAt = new Date().toISOString();
      writeFileSync(join(directory, "manifest.json"), encode(manifest));
      writeJSON(join(directory, "failure.json"), { message: String(error), stack: error instanceof Error ? error.stack : null });
      if (!existsSync(join(directory, "cases.json"))) {
        const rows = existsSync(join(directory, "measurements.jsonl")) ? readFileSync(join(directory, "measurements.jsonl"), "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line)) : [];
        writeJSON(join(directory, "cases.json"), rows);
      }
      writeFileSync(join(directory, "report.md"), `# Invalid H7 attempt: ${runId}\n\n${String(error)}\n\nNo H7 evidence is inferred. Preserve [manifest](manifest.json), [failure](failure.json), and partial observations; repair requires a new run.\n`);
      throw error;
    } finally { refreshIndex(); }
  }
} finally { rmSync(build, { recursive: true, force: true }); }
