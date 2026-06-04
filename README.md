# Claude Workflow Tools

A structured workflow system for managing audit-implement-verify cycles on large codebases (70k-100k+ lines) using Claude Code. Serves both quality improvement AND feature development — audits surface what to build next, not just what to fix. Designed as a reusable HTML tool with project-agnostic prompt templates that can be adapted to any project.

## What's in this repo

- **`CLAUDE.md`** — The **canonical source** for every command's prompt text (project-agnostic; commands reference the Cycle Workflow Config rather than inlining project specifics).
- **`.claude/commands/`** — Ready-to-copy slash-command files, one per command, **generated from `CLAUDE.md`** by `scripts/gen-commands.mjs`. Copy the whole directory into a project.
- **`claude-code-guide-v2.html`** — Interactive HTML console with all prompts, project selector, invariant library, cycle tracker, and archive. Open in a browser to use.
- **`scripts/`** — `gen-commands.mjs` (regenerate the command files) and `check-template-sync.mjs` (drift guard, run in CI).

## Three-Tier Workflow

The system supports three levels of ceremony depending on project maturity and the type of work:

### Tier 1 — Broad Scan (single session)
Three-stage whole-codebase audit: broad pass, deep dive on low-confidence areas, then effectiveness and strategic review. Produces findings across code quality, feature effectiveness, and completeness gaps. Operator approves which findings to implement before any code changes.

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

## Key Concepts

### Two-Axis Scoring (Tier 3)
- **Axis A (Vertical):** Per-subsystem health scores. Tells you which subsystem to audit next.
- **Axis B (Horizontal):** Cross-cutting bug-shape posture (Silent Degradation, Startup Ordering, Operator-Only Gaps, Parallel Drift, Test Coverage Quality). Tells you which bug class needs policy intervention. Rough rubric: 8-10 = strong evidence of mitigation, 5-7 = mixed signals, 1-4 = active evidence of the problem pattern.

### Invariant Library
Project-specific rules that must always hold (e.g., "WAF ordering is wafPreBody → express.json → wafPostBody"). Probed during verification, validated during seams audits, grown organically via `/reflect`. Stored per-project in the HTML tool and in CLAUDE.md for each project. Invariants marked STALE or UNVERIFIABLE for 2+ consecutive seams audits should be retired. Target library size: 15-40 invariants.

### Policy Response Feedback Loop
When an Axis B category scores at or below the policy threshold for consecutive cycles, the synthesis outputs a mandatory policy fix for the next cycle's scope. Converts one-off bug fixing into systemic improvement.

### Independent Verification
A fresh session with no implementation context re-probes invariants, counts regressions with a hard definition (any behavior worse under realistic load = regression, regardless of "tradeoff" label), and checks whether fixes have corresponding regression tests.

## Adapting for a New Project

1. **Run `/setup-cycle`** in a Claude Code session connected to the project — produces a Cycle Workflow Config section and rotation plan
2. **Paste the Cycle Workflow Config** into your project's CLAUDE.md — all commands reference this section, so it's the single source of truth for subsystems, dimensions, invariants, policy config, and (optionally) regression scenarios, frozen subsystems, and deploy commands
3. **Copy the `.claude/commands/` directory** from this repo into your project — the files are project-agnostic (they reference CLAUDE.md config, not inline project-specific content), so no placeholder replacement is needed. (These are generated from CLAUDE.md by `scripts/gen-commands.mjs`.)
4. **Optionally, add to the HTML tool:** Open `claude-code-guide-v2.html` → "Projects" → "+ Add custom project" → enter the same config

### Adapting for a small / correctness-focused project

For small projects (< ~30k LOC), single-organization tools, or projects where correctness matters more than scale (internal dashboards, admin tools, Apps Script, Salesforce, similar), three optional Cycle Workflow Config sections make the workflow fit better:

1. **`Test Command: manual`** + `Regression Scenarios` — for projects with no programmatic test runner. Manual walks of named scenarios replace test runs in `/broad-implement`, `/targeted-implement`, `/implement`, `/test-sync`, and Verification Pass.
2. **`Deploy Command`** — for projects where merge ≠ live (clasp, terraform, manual deploys). Implementation summaries gain a `DEPLOY STEP:` footer; `/regression` distinguishes git-verified vs. deploy-verified state.
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
- `.cycle/STATE.md` — a rolling "where I left off" file. The implement commands' CHECKPOINT step writes it; `/cycle-status` and `/cycle-resume` read it.
- `.cycle/metrics.csv` — per-cycle metrics (net score, Category D ratio, …).
- `.cycle/estimates.csv` — estimate-vs-actual effort log that `/reflect` appends, surfacing your personal calibration over time.

Run **`/cycle-init`** to scaffold all of the above (and `PROJECT_HEALTH.md`) in one step — it only creates what's missing.

Two optional helpers (both fail-safe, both covered by the Test Command):
- **SessionStart context hook** (`scripts/cycle-context.mjs`) — auto-loads the substrate (STATE + current standing + invariant count) into every new session, so you never have to paste it. Enable by copying the script and adding a `SessionStart` hook to `.claude/settings.json` (see CLAUDE.md "Cycle State & Memory" for the snippet). With no `.cycle/` it prints nothing.
- **Metrics report** (`scripts/render-metrics.mjs`) — renders `.cycle/metrics.csv` into a markdown trend report (table + net-score/Category-D sparklines + cumulative summary). Run `node scripts/render-metrics.mjs` anytime.
- **Executable invariant runner** (`scripts/invariant-check.mjs`) — runs every invariant whose `Verify:` field is a command and reports PASS/FAIL (prose/test-name `Verify:` fields are MANUAL). Write `Verify:` as a runnable command and the invariant becomes a test — the automated half of the §4v probe. `--list` shows the classification.
- **Portfolio dashboard** (`scripts/portfolio.mjs`) — aggregates several projects' `PROJECT_HEALTH.md` into one board (lowest overall first = audit next) so you can see across your whole portfolio which project needs attention. Pass the `PROJECT_HEALTH.md` paths.

Two commands navigate it:
- **`/cycle-status`** (read-only) — reports current standing and tells you explicitly whether to **resume** unfinished work or **start a fresh audit**.
- **`/cycle-resume`** — continues an in-progress *implementation* thread. It carries forward **substrate + facts** (systems map, invariants, what's done/pending) but **never inherits the prior session's findings as authoritative** — a new audit always uses fresh eyes. Resume is for continuation, not re-auditing.

This is **fully additive**: with no `.cycle/` directory every command behaves exactly as before (emit the block in chat, copy-paste into the next session). Deleting `.cycle/` returns you to the pure copy-paste workflow with no loss. See "Cycle State & Memory" in `CLAUDE.md` for the `STATE.md` template and the two-memory-channels rationale.

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

## Maintaining this repo

This repo has three presentations of the same workflow that must stay aligned:

- **`CLAUDE.md`** is the **canonical source** for command semantics. Every command is a `### /<name>` heading followed by a fenced prompt body.
- **`.claude/commands/`** is **generated** from CLAUDE.md (`node scripts/gen-commands.mjs`) — never edit these by hand; edit CLAUDE.md and regenerate.
- **`claude-code-guide-v2.html`** is a **self-contained prompt console** that inlines config from its own project store. Its prompt builders should produce the *same behavior* as the CLAUDE.md commands — they are deliberately not byte-identical.

**Versioning:** the templates are versioned in `VERSION` (semver) with a human-readable `CHANGELOG.md`. Bump both whenever you change command semantics, the config schema, or the tooling — `/sync-commands` reports the template version + latest changelog entry so consuming repos know what they're syncing to. The guard fails if `VERSION`/`CHANGELOG.md` are missing.

When you add or change a capability: edit CLAUDE.md (and the HTML builder + README where relevant), bump `VERSION` + add a `CHANGELOG.md` entry, run `node scripts/gen-commands.mjs`, then run the guard:

```
node scripts/check-template-sync.mjs
```

The guard exits non-zero if any tracked capability (manual test mode, Regression Scenarios, Frozen Subsystems, Deploy Command/Step, configurable Axis B, Dynamic Workflows, `.cycle/` state, `/cycle-resume`/`/cycle-status`, executable invariants, per-cycle metrics) is present in one artifact but missing from another, if a README-referenced command lacks a CLAUDE.md template, if `.claude/commands/` is stale, or if a workflow output block or pinned prompt behavior is missing from the HTML console. If you intentionally rename a marker, update `CHECKS` in that script. CI runs the guard on every push and pull request.

> **Gotcha (the repo's defining risk):** the HTML console is a *separate presentation* of the same prompts, not a copy generated from CLAUDE.md — so it can silently drift from the canonical commands. Keep its prompt behavior aligned with CLAUDE.md; the guard pins the known divergence points (workflow output blocks, the reflect Cycle Summary Block, the regression Verify/deploy notes) but does **not** verify full prompt equivalence. The durable fix is generating the console's prompts from CLAUDE.md (ROADMAP R3).
