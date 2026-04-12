# Claude Workflow Tools

A structured workflow system for managing audit-implement-verify cycles on large codebases (70k-100k+ lines) using Claude Code. Serves both quality improvement AND feature development — audits surface what to build next, not just what to fix. Designed as a reusable HTML tool with project-agnostic prompt templates that can be adapted to any project.

## What's in this repo

- **`claude-code-guide-v2.html`** — Interactive HTML tool with all prompts, project selector, invariant library, cycle tracker, and archive. Open in a browser to use.
- **`CLAUDE.md`** — Project-agnostic template versions of all prompts for quick reference and adaptation to new projects.

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
2. **Paste the Cycle Workflow Config** into your project's CLAUDE.md — all commands reference this section, so it's the single source of truth for subsystems, dimensions, invariants, and policy config
3. **Copy command files** from this repo's CLAUDE.md templates into `.claude/commands/` — they are project-agnostic (they reference CLAUDE.md config, not inline project-specific content), so no placeholder replacement is needed
4. **Optionally, add to the HTML tool:** Open `claude-code-guide-v2.html` → "Projects" → "+ Add custom project" → enter the same config

### Keeping Commands in Sync

Command files are identical across projects because they reference CLAUDE.md config instead of inlining project-specific content. When the templates are updated in this repo, run `/sync-commands <path-to-this-repo>` in your project to check for updates and overwrite outdated command files.

## Operational Guidance

### Emergency Hotfixes
For urgent production fixes, use `/broad-implement <describe the bug>` directly without running `/broad-scan` first. It includes regression check and reflect steps. Follow up with `/test-sync` and `/sync-docs`.

### Context Window Overflow
If a session runs out of context mid-audit (typically 100k+ line codebases with deep subsystems), produce a partial handoff block with what you've covered and a "NOT COVERED" section listing remaining files. Run a second session on the uncovered scope. The `/setup-cycle` command sizes subsystems to fit in one session, but broad-scan covers the entire codebase and may overflow.

### When Tests Can't Run
If the test suite requires infrastructure that isn't available (database, API keys, external services), note why tests couldn't run and perform a manual regression check with extra thoroughness. Flag the test gap as a follow-on item.

### Known Limitations
- **Single-operator design.** The workflow assumes one developer + Claude Code. Multi-developer usage would need shared state (shared Archive, coordination on which subsystems are in-progress).
- **Axis B scoring is qualitative.** Claude reads code but can't run load tests or collect runtime metrics. Axis B scores are based on code structure evidence, not measured performance.
- **Handoff blocks require manual copy-paste between sessions.** Save blocks to the Archive immediately after each session to prevent loss.

## Slash Commands Reference

| Command | Tier | Sessions | Purpose |
|---|---|---|---|
| `/setup-cycle` | setup | 1 | Define subsystems, dimensions, invariants for a new project |
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
