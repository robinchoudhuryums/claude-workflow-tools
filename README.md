# Claude Workflow Tools

A structured workflow system for managing audit-implement-verify cycles on large codebases (70k-100k+ lines) using Claude Code. Serves both quality improvement AND feature development — audits surface what to build next, not just what to fix. Designed as a reusable HTML tool with project-agnostic prompt templates that can be adapted to any project.

## What's in this repo

- **`CLAUDE.md`** — The **canonical source** for every command's prompt text (project-agnostic; commands reference the Cycle Workflow Config rather than inlining project specifics).
- **`.claude/commands/`** — Ready-to-copy slash-command files, one per command, **generated from `CLAUDE.md`** by `scripts/gen-commands.mjs`. Copy the whole directory into a project.
- **`claude-code-guide-v2.html`** — Interactive HTML console with all prompts, project selector, invariant library, cycle tracker, and archive. Open in a browser to use, or use the hosted version at **https://robinchoudhuryums.github.io/claude-workflow-tools/** (served via GitHub Pages from `index.html`, a redirect to this file — always the latest `main`).
- **`index.html`** — Tiny redirect to the console above, so the GitHub Pages root URL lands on the tool. Not a content copy (no drift with the console).
- **`scripts/`** — the generators, drift guards, and `.cycle/` helpers. Generation/guards (run in CI): `gen-commands.mjs` (regenerate the command files), `gen-html-prompts.mjs` (generate/lock the console §-prompts from CLAUDE.md), `check-template-sync.mjs` (cross-artifact drift guard), `check-html.mjs` (console JS soundness), `check-output-blocks.mjs` (output-block shape). `.cycle/` helpers: `cycle-context.mjs` (SessionStart substrate loader), `render-metrics.mjs` (metrics trend report), `invariant-check.mjs` (executable invariant runner), `portfolio.mjs` (cross-project health board), `portfolio-status.mjs` (cross-project *status* board — health + phase/in-progress/trend/seams-due), `verification-pack.mjs` (assembles the §4v prompt for a fresh session), `csv.mjs` (the one quote-aware CSV parser every `metrics.csv` reader imports).

## Three-Tier Workflow

The system supports three levels of ceremony depending on project maturity and the type of work:

### Tier 1 — Broad Scan (single session)
Three-stage whole-codebase audit: broad pass, deep dive on low-confidence areas, then effectiveness and strategic review. Produces findings across code quality, feature effectiveness, completeness gaps, and — for projects with a user-facing surface — the interface and visual layer (see below) — and closes with an **implementation batch plan** that sequences every finding into `/broad-implement`-sized batches with effort estimates. Operator approves which findings (or batches) to implement before any code changes.

**Command chain:** `/broad-scan` → review → `/broad-implement F03, F07` → `/test-sync` → `/sync-docs`

**When to use:** Project is new, rapid development phase, broad scans still find real bugs or meaningful feature gaps.

### Tier 2 — Targeted Subsystem Cycle (2 sessions)
Deep audit of one subsystem with audit+plan in Session 1 and implement+check+reflect in Session 2. Produces a Tier 2 Handoff Block with cross-module risks and a DO NOT TOUCH list.

**Command chain:** `/targeted-audit <subsystem>` → `/targeted-implement` → `/test-sync` → `/sync-docs`

**When to use:** Broad scans stopped finding significant issues in a specific area, a subsystem is causing pain, or you want depth without the full Tier 3 ceremony.

### Tier 3 — Full Cycle (5-6 sessions per subsystem)
Complete audit → plan → implement → regression check → independent verification → synthesis cycle. Two-axis scoring (vertical subsystem health + horizontal bug-shape posture), invariant library, policy-response feedback loop.

**Session flow:** `Systems Map (once)` → `Layered Audit` → `Planning` → `Implementation` → `Regression Check + Reflect` → `Verification Pass (fresh session)` → `Health Synthesis`

**When to use:** Quarterly, before releases, when accumulated Tier 1/2 sessions need verification, or when you want benchmarkable progress tracking.

### Tier Graduation

- **Tier 1 → Tier 2:** When the last 2 broad scans found fewer than 5 production bugs in a subsystem, or when findings are mostly feature gaps rather than code issues.
- **Tier 2 → Tier 3:** When you want benchmarkable scoring, when Tier 2 sessions surface cross-module issues that need independent verification, or quarterly/before releases.
- **Project size and focus:** For small (< ~30k LOC) or correctness-focused projects (low traffic, known user set, deterministic data flows), Tier 1 may be sufficient indefinitely. Tier 3 ceremony often outweighs its benefits below this threshold; the optional config sections (`Test Command: manual` + Regression Scenarios, Frozen Subsystems, Deploy Command) make Tier 1 work well even without a traditional test runner or single-deployable.
- **Shifting balance:** The cycle workflow serves both quality improvement and feature development. When a subsystem reaches stability (no Critical/High findings open, positive net score, no Axis B policy triggers), shift effort from fixing to building — use Stage 3 effectiveness gaps and strategic suggestions to guide feature work.

## Cycle Rotation (Tier 3)

```
Cycle 1: Subsystem A (audit + implement + verify)
Cycle 2: Subsystem B (audit + implement + verify)
Cycle 3: Subsystem C (audit + implement + verify)
Cycle 4: Seams & Invariants (no implementation — updates invariant library)
Cycle 5: Subsystem D (audit + implement + verify)
...repeat
```

The frequency is a config field — **`Seams Audit Cadence`** (default: every 4 subsystem cycles) in the Cycle Workflow Config. `/reflect` increments a "Subsystem cycles since last Seams audit" counter in `.cycle/STATE.md`; `/audit` and `/cycle-status` read it against the cadence and remind you when a Seams audit is **DUE**, so the rotation isn't purely manual. A Seams audit resets the counter.

## Key Concepts

### Two-Axis Scoring (Tier 3)
- **Axis A (Vertical):** Per-subsystem health scores. Tells you which subsystem to audit next.
- **Axis B (Horizontal):** Cross-cutting bug-shape posture (Silent Degradation, Startup Ordering, Operator-Only Gaps, Parallel Drift, Test Coverage Quality). Tells you which bug class needs policy intervention. Rough rubric: 8-10 = strong evidence of mitigation, 5-7 = mixed signals, 1-4 = active evidence of the problem pattern.

### Invariant Library
Project-specific rules that must always hold (e.g., "WAF ordering is wafPreBody → express.json → wafPostBody"). Probed during verification, validated during seams audits, grown organically via `/reflect`. Stored per-project in the HTML tool and in CLAUDE.md for each project. Invariants marked STALE or UNVERIFIABLE for 2+ consecutive seams audits should be retired. Target library size: 15-40 for a library probed by code read — this repo runs 66, which is only sustainable because every one of them is a runnable `Verify:` command proven fail-closed by `tests/mutation-audit.mjs`. Grow past ~40 only if the probing is automated; otherwise a seams audit cannot honestly validate them all.

### Policy Response Feedback Loop
When an Axis B category scores at or below the policy threshold for consecutive cycles, the synthesis outputs a mandatory policy fix for the next cycle's scope. Converts one-off bug fixing into systemic improvement.

### Independent Verification
A fresh session with no implementation context re-probes invariants, counts regressions with a hard definition (any behavior worse under realistic load = regression, regardless of "tradeoff" label), and checks whether fixes have corresponding regression tests.

### Health per-change (`/pr-review`)
The console carries this prompt too, under **PR Review** in the sidebar (added v1.20.0 — it was missing for four releases). The cycle grades health *over time*; `/pr-review` is its sibling for health *per change*. It applies the same rubrics — severity/confidence, "would it fire in production this month," the hard regression definition, plus the test-vs-production-path and test-double probes — to a single PR's diff, and emits a PR REVIEW BLOCK with a verdict and blocking items. It is read-only and runs either by hand (`/pr-review 142`) or off a `subscribe_pr_activity` webhook event; it posts to the PR only when you ask.

## Adapting for a New Project

1. **Run `/setup-cycle`** in a Claude Code session connected to the project — produces a Cycle Workflow Config section and rotation plan
2. **Paste the Cycle Workflow Config** into your project's CLAUDE.md — all commands reference this section, so it's the single source of truth for subsystems, dimensions, invariants, policy config, and (optionally) regression scenarios, frozen subsystems, and deploy commands
3. **Copy the `.claude/commands/` directory** from this repo into your project — the files are project-agnostic (they reference CLAUDE.md config, not inline project-specific content), so no placeholder replacement is needed. (These are generated from CLAUDE.md by `scripts/gen-commands.mjs`.)
4. **Optionally, add to the HTML tool:** Open `claude-code-guide-v2.html` → "Projects" → "+ Add custom project" → enter the same config

### Adapting for a small / correctness-focused project

For small projects (< ~30k LOC), single-organization tools, or projects where correctness matters more than scale (internal dashboards, admin tools, Apps Script, Salesforce, similar), three optional Cycle Workflow Config sections make the workflow fit better:

1. **`Test Command: manual`** + `Regression Scenarios` — for projects with no programmatic test runner. Manual walks of named scenarios replace test runs in `/broad-implement`, `/targeted-implement`, `/implement`, `/test-sync`, and Verification Pass.
2. **`Deploy Command`** — for projects where merge ≠ live (clasp, terraform, manual deploys). Implementation summaries gain an `OPERATOR ACTIONS / DEPLOY:` footer (human-only out-of-PR steps tagged `BLOCKS DEPLOY: Y/N`, plus the deploy command); `/regression` distinguishes git-verified vs. deploy-verified state.
3. **`Frozen Subsystems`** — for projects with legacy code being migrated out. Frozen subsystems are excluded from rotation and default audit scope; explicit targeting still works (with a banner).

Tier 1 (broad scan) is usually the right starting point at this scale. Tier 3 ceremony often outweighs its benefits below ~30k LOC; revisit if the project grows or you want benchmarkable scoring.

### Keeping Commands in Sync

Command files are identical across projects because they reference CLAUDE.md config instead of inlining project-specific content. When the templates are updated in this repo, run `/sync-commands <path-to-this-repo>` in your project to check for updates and overwrite outdated command files.

## Operational Guidance

### Emergency Hotfixes
For urgent production fixes, use `/broad-implement <describe the bug>` directly without running `/broad-scan` first. It includes regression check and reflect steps. Follow up with `/test-sync` and `/sync-docs`.

### Context Window Overflow
If a session runs out of context mid-audit (typically 100k+ line codebases with deep subsystems), produce a partial handoff block with what you've covered and a "NOT COVERED" section listing remaining files. Run a second session on the uncovered scope. The `/setup-cycle` command sizes subsystems to fit in one session, but broad-scan covers the entire codebase and may overflow.

If context fills mid-implementation (work unfinished), the optional `.cycle/` state directory makes resumption lossless — see "Cycle State & Resuming" below.

### Cycle State & Resuming
For session-to-session continuity without manual copy-paste, projects can keep an optional `.cycle/` directory at the repo root:
- `.cycle/STATE.md` — a rolling "where I left off" file. The implement commands' CHECKPOINT step writes it; `/cycle-status` and `/cycle-resume` read it. It keeps the shape of the template in `CLAUDE.md` and carries the *current* cycle only — `check-template-sync` fails if it grows a section the template doesn't define, because unchecked it accumulates per-release narrative until the substrate a new session loads is buried in it.
- `.cycle/HISTORY.md` — optional: the narrative record of completed cycles, moved out of `STATE.md` so that file stays rolling. Reference prose; nothing reads it.
- `.cycle/metrics.csv` — per-cycle metrics (net score, Category D ratio, …).
- `.cycle/estimates.csv` — estimate-vs-actual effort log that `/reflect` appends, surfacing your personal calibration over time.

Run **`/cycle-init`** to scaffold all of the above (and `PROJECT_HEALTH.md`) in one step — it only creates what's missing.

Two optional helpers (both fail-safe, both covered by the Test Command):
- **SessionStart context hook** (`scripts/cycle-context.mjs`) — auto-loads the substrate (STATE + current standing + invariant count) into every new session, so you never have to paste it. Enable by copying the script and adding a `SessionStart` hook to `.claude/settings.json` (see CLAUDE.md "Cycle State & Memory" for the snippet). With no `.cycle/` it prints nothing.
- **Metrics report** (`scripts/render-metrics.mjs`) — renders `.cycle/metrics.csv` into a markdown trend report (table + net-score/Category-D sparklines + cumulative summary). Run `node scripts/render-metrics.mjs` anytime.
- **Executable invariant runner** (`scripts/invariant-check.mjs`) — runs every invariant whose `Verify:` field is a command and reports PASS/FAIL (prose/test-name `Verify:` fields are MANUAL). Write `Verify:` as a runnable command and the invariant becomes a test — the automated half of the §4v probe. `--list` shows the classification.
- **Invariant mutation audit** (`tests/mutation-audit.mjs`) — the other half of that proof, and the reason an "N/N invariants PASS" line means something. A `Verify:` command passing on a clean tree is not evidence it would *fail* if the rule were violated: a command that cannot see its own invariant reports PASS forever. This violates each rule in a throwaway copy of the repo, runs that invariant's own `Verify:` command, and requires it to fail **via that invariant's own assertion** — so when twenty invariants share one check, a mutation caught by a neighbour is not counted as proof. Coverage is derived from the live library (an invariant with no mutation case fails the audit), and a case whose find string has rotted away fails instead of reporting a neutral skip. `--only INV-05,INV-20` narrows it. Run it before trusting any invariant probe, including §4v's.
- **Portfolio dashboard** (`scripts/portfolio.mjs`) — aggregates several projects' `PROJECT_HEALTH.md` into one board (lowest overall first = audit next) so you can see across your whole portfolio which project needs attention. Pass the `PROJECT_HEALTH.md` paths.
- **Verification pack** (`scripts/verification-pack.mjs`) — assembles the §4v Independent Verification prompt so it can be pasted into a fresh session in one go: canonical body + live invariant library + the *current* cycle's blocks from `.cycle/blocks/` (by `<cycle>-` prefix; the directory accumulates, and other cycles' blocks are listed as excluded) + rotation probes **seeded from the commit sha**, so the implementer cannot steer them and a verifier can reproduce the selection. Warns automatically when `/reflect` corrected a self-reported count. `node scripts/verification-pack.mjs --out pack.md`
- **Portfolio status board** (`scripts/portfolio-status.mjs`) — the *development-status* sibling of the dashboard: joins each project's health score with the `.cycle/` data it already writes (`STATE.md` phase / in-progress / seams counter, `metrics.csv` net trend) into one board — `Project | Overall | Phase | In-progress | Net Δ | Seams | Updated` — so you see not just which project is unhealthiest but where your next action is (resume in-progress work, run a DUE Seams audit). Same args as `portfolio.mjs`; projects without a `.cycle/` directory still list (status columns show `—`).

**Secrets are never backed up.** The console's optional GitHub token (and anything stored under `ccg:secret:*`) is excluded from **Export state** and from **Save → repo**, on both the write and the restore side — so a credential can neither be written into a backup file or into `.cycle/console-state.json`, nor installed into your browser from someone else's backup. You re-enter the token after restoring state on a new machine. `.cycle/console-state.json` is also gitignored as a second layer.

The HTML console's Backup & Restore card also has a **"Connect repo folder"** option (File System Access API, Chromium-based browsers, served over http(s)/localhost) that syncs the console's state straight to the repo's `.cycle/console-state.json` instead of download/upload — converging the console's `localStorage` with the repo's `.cycle/` state, with the directory handle persisted across reloads via IndexedDB. It falls back to Export/Import where the API is unavailable.

Two commands navigate it:
- **`/cycle-status`** (read-only) — reports current standing and tells you explicitly whether to **resume** unfinished work or **start a fresh audit**.
- **`/cycle-resume`** — continues an in-progress *implementation* thread. It carries forward **substrate + facts** (systems map, invariants, what's done/pending) but **never inherits the prior session's findings as authoritative** — a new audit always uses fresh eyes. Resume is for continuation, not re-auditing.

This is **fully additive**: with no `.cycle/` directory every command behaves exactly as before (emit the block in chat, copy-paste into the next session). Deleting `.cycle/` returns you to the pure copy-paste workflow with no loss. See "Cycle State & Memory" in `CLAUDE.md` for the `STATE.md` template and the two-memory-channels rationale.

### Interface & Visual Layer

Stage 3 of `/broad-scan` assesses the interface, not just the logic behind it. It is **gated**: a library, CLI, or service with no client writes "No user-facing surface — not assessed" and skips it, so non-UI projects pay nothing.

The lens splits findings by what an agent can actually verify, and that split is the point:

- **(a) Structural — verifiable by code read**, reported as ordinary findings under the Stage 1 severity/confidence rubric: keyboard and assistive access (click handlers on `div`/`span`/`tr` with no `role`, `tabindex`, or key handler; focus order; focus traps), missing empty/loading/error states, absent responsive breakpoints, incomplete theme/token coverage, design-token bypass, and whether an action that can fail tells the user it failed.
- **(b) Perceptual — contrast, hierarchy, spacing, whether it looks right.** These cannot be verified from code, so the audit is forbidden from reporting them as findings or guessing at them. They are emitted as **OPERATOR VISUAL CHECKS** instead — written in `Regression Scenarios` format so you can promote them straight into that block and walk them every cycle, rather than leaving "worth an eyeball before merge" in a handoff note.

Two config hooks make it score rather than just report: include an interface Health Dimension (e.g. `UI/UX & Accessibility`) when the project has a client surface — `/setup-cycle` now proposes one — and optionally swap an Axis B category for `Visual / Interaction Regression Posture`. `/reflect` counts a user-visible interface defect as a production fix (its trigger is a user opening the surface, not load), so interface work shows up in `net_score` instead of being flattened into the excluded defensive/structural bucket.

`/audit` and `/pr-review` do **not** carry this lens yet — a deliberate deferral (ROADMAP R18) pending a cycle's experience with it in `/broad-scan`.

### When Tests Can't Run
If the test suite requires infrastructure that isn't available (database, API keys, external services), note why tests couldn't run and perform a manual regression check with extra thoroughness. Flag the test gap as a follow-on item.

For projects with no programmatic test runner at all, set `Test Command: manual` + define a `Regression Scenarios` block. Manual scenario walks become the canonical verification path, not a fallback. See "Adapting for a small / correctness-focused project" above.

### Known Limitations
- **Single-operator design.** The workflow assumes one developer + Claude Code. Multi-developer usage would need shared state (shared Archive, coordination on which subsystems are in-progress).
- **Axis B scoring is qualitative.** Claude reads code but can't run load tests or collect runtime metrics. Axis B scores are based on code structure evidence, not measured performance.
- **Handoff blocks require manual copy-paste between sessions** by default. Save blocks to the Archive immediately after each session to prevent loss — or opt into the `.cycle/` state directory (see "Cycle State & Resuming") to persist them to files and resume with `/cycle-resume`.

## Optional: Dynamic Workflows acceleration (Opus 4.8+)

This is an **optional accelerator, not a dependency**. The entire workflow runs exactly as documented on a single Claude Code session per phase. If Dynamic Workflows isn't available to you, or the project doesn't fit the criteria below, ignore this section — nothing else changes.

[Dynamic Workflows](https://www.anthropic.com/news/claude-opus-4-8) (research preview; Enterprise/Team/Max) lets one orchestrator plan a task and fan out parallel subagents — up to 16 concurrent, 1,000 total per run — each with its own context, with the plan held outside the orchestrator's context window. It's essentially the *automated* form of the audit→plan→implement→verify chain this tool drives by hand.

### Use it only when ALL of these hold
- **The project has a real test suite** (`Test Command` ≠ `manual`). Dynamic Workflows verifies subagent output against your tests; with no programmatic bar, don't use it for implementation.
- **The work is genuinely parallel** — e.g. a broad scan across many independent subsystems, or a codebase-scale migration — where serial sessions are the bottleneck, not the thinking.
- **You want throughput**, and the cost of a wrong autonomous change is bounded by tests + review.

### Do NOT use it when
- `Test Command: manual`, or the project is small enough that one session already covers it.
- The value of the cycle is the **human judgment gates** (approving which findings to fix, the pre-implementation dependency check, mandatory policy responses) more than raw speed.
- You're early in a project and still calibrating subsystem boundaries or invariants.

### How the existing pieces map
- **Per-subsystem audit subagents** — fan out `/broad-scan` or `/audit` across subsystems in one run (`/setup-cycle` already sizes and lists them). Each returns its handoff block; the orchestrator merges them.
- **Verifier subagent = §4v Independent Verification.** Spawn a verifier with no implementation context to re-probe the invariant library — the native "refute then converge" pattern is exactly the "don't let the implementer grade its own work" rule.
- **Handoff blocks become orchestrator state.** The block formats are already structured contracts; keep them as the data passed between subagents rather than copy-pasted between sessions.

### Non-negotiable: keep the human gates
Even when orchestrated, these stay manual checkpoints between phases — do not let autonomy dissolve them:
1. Operator approves which findings to implement before any code changes.
2. The pre-implementation dependency check runs before High/Very High risk changes.
3. Triggered policy responses are mandatory scope in the next cycle.

Treat Dynamic Workflows as a **delivery mechanism for these prompts**, not a replacement for them — the prompts (severity/confidence rubrics, the "would it fire in production this month" test, the hard regression definition) are the durable part. It's a research preview; expect orchestration semantics to shift.

## Slash Commands Reference

| Command | Tier | Sessions | Purpose |
|---|---|---|---|
| `/setup-cycle` | setup | 1 | Define subsystems, dimensions, invariants — plus optional regression scenarios, frozen subsystems, and deploy commands |
| `/broad-scan` | 1 | 1 | Three-stage whole-codebase audit (broad + deep dive + effectiveness) |
| `/broad-implement` | 1 | 1 | Implement selected findings from broad scan |
| `/targeted-audit` | 2 | 1 of 2 | Scoped subsystem audit + plan |
| `/targeted-implement` | 2 | 2 of 2 | Implement from Tier 2 handoff block |
| `/audit` | 3 | 1 | Deep subsystem audit (produces Session Handoff Block) |
| `/plan` | 3 | 1 | Convert audit findings to implementation plan |
| `/implement` | 3 | 1 | Execute implementation plan |
| `/regression` | 3 | 1 | Post-implementation regression check |
| `/reflect` | 3 | 1 | Post-cycle honest assessment |
| `/test-sync` | 1,2,3 | 1 | Test quality assessment + failure resolution |
| `/sync-docs` | 1,2,3 | 1 | Detect and fix documentation drift |
| `/health-pulse` | any | 1 | Quick directional health check (both axes) |
| `/systems-map` | 3 | 1 | Architectural overview (run once per project) |
| `/roadmap` | 3 | 1 | Strategic planning across 4 time horizons |
| `/cycle-init` | any | 1 | Scaffold the optional `.cycle/` state dir + `PROJECT_HEALTH.md` (idempotent) |
| `/cycle-status` | any | 1 | Read-only: report standing + whether to resume or start fresh |
| `/cycle-resume` | any | 1 | Continue an in-progress implementation thread from `.cycle/STATE.md` |
| `/pr-review` | any | 1 | Apply the cycle's audit rubrics to a single PR (health per-change); runs by hand or off a PR webhook |
| `/sync-commands` | maintenance | 1 | Sync command files with latest templates from this repo |

## Handoff Block Types

| Block | Produced by | Consumed by |
|---|---|---|
| SESSION HANDOFF BLOCK | `/audit` | `/plan`, Health Synthesis |
| IMPLEMENTATION HANDOFF BLOCK | `/plan` | `/implement` |
| IMPLEMENTATION SUMMARY BLOCK | `/implement` | `/regression`, `/reflect`, Verification Pass |
| TIER 2 HANDOFF BLOCK | `/targeted-audit` | `/targeted-implement` |
| BROAD SCAN IMPLEMENTATION SUMMARY | `/broad-implement` | `/test-sync`, `/sync-docs` |
| TARGETED IMPLEMENTATION SUMMARY | `/targeted-implement` | `/test-sync`, `/sync-docs` |
| VERIFICATION BLOCK | Verification Pass | Health Synthesis |
| SEAMS & INVARIANTS AUDIT BLOCK | Seams Audit | Next subsystem audit, Synthesis |
| CYCLE SUMMARY BLOCK | `/reflect` | Health Synthesis |
| PR REVIEW BLOCK | `/pr-review` | Operator (merge decision); optionally posted to the PR |

## Maintaining this repo

This repo has three presentations of the same workflow that must stay aligned:

- **`CLAUDE.md`** is the **canonical source** for command semantics. Every command is a `### /<name>` heading followed by a fenced prompt body.
- **`.claude/commands/`** is **generated** from CLAUDE.md (`node scripts/gen-commands.mjs`) — never edit these by hand; edit CLAUDE.md and regenerate.
- **`claude-code-guide-v2.html`** is a **self-contained prompt console** that inlines config from its own project store. Its prompt builders should produce the *same behavior* as the CLAUDE.md commands — they are deliberately not byte-identical.

**Versioning:** the templates are versioned in `VERSION` (semver) with a human-readable `CHANGELOG.md`. Bump both whenever you change command semantics, the config schema, or the tooling — `/sync-commands` reports the template version + latest changelog entry so consuming repos know what they're syncing to. The guard fails if `VERSION`/`CHANGELOG.md` are missing.

The console's static §-prompts are a known drift surface (Cycle 1 F02/F03). `node scripts/gen-html-prompts.mjs` reports how far each console `<pre>` sits from its canonical CLAUDE.md command (the R14 transform engine + drift report); `--write` regenerates them from CLAUDE.md, but **mutates the console surface, so verify rendering in a browser** — CI never runs `--write`.

**Output-block shape (R13).** `node scripts/check-output-blocks.mjs` is a second-order guard: where `check-template-sync` verifies a workflow block's *name* appears, this validates each block's *shape* — balanced `---NAME---` / `---END…---` delimiters, every required field present, and that the producing command still emits it (e.g. `/audit` still produces a well-formed SESSION HANDOFF BLOCK). It also catches field drift between a command's inline block and the canonical copy in Handoff Block Formats. It is the static, deterministic half of a prompt-output regression harness; running the prompts through an LLM against fixture repos (real output capture) is non-deterministic and out of scope for the CI gate.

When you add or change a capability: edit CLAUDE.md (and the HTML builder + README where relevant), bump `VERSION` + add a `CHANGELOG.md` entry, run `node scripts/gen-commands.mjs`, then run the guard:

```
node scripts/check-template-sync.mjs
```

The guard exits non-zero if any tracked capability (manual test mode, Regression Scenarios, Frozen Subsystems, Deploy Command/Step, configurable Axis B, Dynamic Workflows, `.cycle/` state, `/cycle-resume`/`/cycle-status`, executable invariants, per-cycle metrics) is present in one artifact but missing from another, if a README-referenced command lacks a CLAUDE.md template, if `.claude/commands/` is stale, or if a workflow output block or pinned prompt behavior is missing from the HTML console. If you intentionally rename a marker, update `CHECKS` in that script. CI runs the guard on every push and pull request.

> **Gotcha (the repo's defining risk — now largely closed):** the HTML console is a *separate presentation* of the same prompts, so historically it could silently drift from the canonical commands. That durable fix has shipped (ROADMAP **R14** for the static §-prompts, **R16** for the dynamic builders): the seven static `<pre>` prompts are **generated** from CLAUDE.md and locked by `gen-html-prompts --assert`, and as of v1.20.0 **all nine dynamic builders are locked too, at 100% canonical line coverage, with no exemption tier**. Editing a command body therefore requires regenerating *and* mirroring the change into its builder, or CI goes red.
>
> As of v1.29.0 the lock covers **every** prompt the console renders: all 16 static `<pre>` blocks (the nine that had no slash-command counterpart now have canonical bodies under "Console Reference Prompts" in `CLAUDE.md`) and all nine dynamic builders — and `--assert` fails if a *new* static prompt appears with no manifest entry, so the class cannot quietly reopen. That last gap was real, not theoretical: the console's `/setup-cycle` prompt had decayed to a pre-R18 copy that never asked about a user-facing surface, and the file-global markers could not see it.
>
> What is still *not* verified automatically: the console's surrounding prose, section framing and layout, and anything about how it renders (the Cycle-6 scan found the mobile layout broken below 768px by driving headless Chromium; no CI stage does that yet — ROADMAP R20). Two lessons the closure cost: a marker check is file-global, so it can be green while an individual builder is stale; and a `locked:false` exemption, however well reasoned when written, stops being re-read — §T2b's decayed behind one for four releases. See Common Gotchas in `.cycle/config.md`.
