# Claude Workflow Tools

A structured workflow system for managing audit-implement-verify cycles on large codebases (70k-100k+ lines) using Claude Code. Designed as a reusable HTML tool with project-agnostic prompt templates that can be adapted to any project.

## What's in this repo

- **`claude-code-guide-v2.html`** — Interactive HTML tool with all prompts, project selector, invariant library, cycle tracker, and archive. Open in a browser to use.
- **`CLAUDE.md`** — Project-agnostic template versions of all prompts for quick reference and adaptation to new projects.

## Three-Tier Workflow

The system supports three levels of ceremony depending on project maturity and the type of work:

### Tier 1 — Broad Scan (single session)
Two-stage whole-codebase audit: broad pass first, then deep dive on areas where confidence was low. Produces findings with severity, confidence, and a "would this fire in production?" filter. Operator approves which findings to implement before any code changes.

**Command chain:** `/broad-scan` → review → `/broad-implement F03, F07` → `/test-sync` → `/sync-docs`

**When to use:** Project is new, rapid development phase, broad scans still find real bugs.

### Tier 2 — Targeted Subsystem Cycle (2 sessions)
Deep audit of one subsystem with audit+plan in Session 1 and implement+check+reflect in Session 2. Produces a Tier 2 Handoff Block with cross-module risks and a DO NOT TOUCH list.

**Command chain:** `/targeted-audit <subsystem>` → `/targeted-implement` → `/test-sync` → `/sync-docs`

**When to use:** Broad scans stopped finding real bugs in a specific area, a subsystem is causing pain, or you want depth without the full Tier 3 ceremony.

### Tier 3 — Full Cycle (5-6 sessions per subsystem)
Complete audit → plan → implement → regression check → independent verification → synthesis cycle. Two-axis scoring (vertical subsystem health + horizontal bug-shape posture), invariant library, policy-response feedback loop.

**Session flow:** `Systems Map (once)` → `Layered Audit` → `Planning` → `Implementation` → `Regression Check + Reflect` → `Verification Pass (fresh session)` → `Health Synthesis`

**When to use:** Quarterly, before releases, when accumulated Tier 1/2 sessions need verification, or when you want benchmarkable progress tracking.

### Graduation Rule
Use Tier 1 until it stops producing real bugs consistently. Graduate that subsystem to Tier 2. Run Tier 3 quarterly or before major milestones. Different subsystems can be at different tiers simultaneously.

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
- **Axis B (Horizontal):** Cross-cutting bug-shape posture (Silent Degradation, Startup Ordering, Operator-Only Gaps, Parallel Drift, Test Coverage Quality). Tells you which bug class needs policy intervention.

### Invariant Library
Project-specific rules that must always hold (e.g., "WAF ordering is wafPreBody → express.json → wafPostBody"). Probed during verification, validated during seams audits, grown organically via `/reflect`. Stored per-project in the HTML tool and in CLAUDE.md for each project.

### Policy Response Feedback Loop
When an Axis B category scores poorly for consecutive cycles, the synthesis outputs a mandatory policy fix for the next cycle's scope. Converts one-off bug fixing into systemic improvement.

### Independent Verification
A fresh session with no implementation context re-probes invariants, counts regressions with a hard definition (any behavior worse under realistic load = regression, regardless of "tradeoff" label), and checks whether fixes have corresponding regression tests.

## Adapting for a New Project

1. **Open `claude-code-guide-v2.html`** in a browser
2. **Click "Projects" → "+ Add custom project"**
3. **Fill in:** project name, subsystem names + file lists, health dimensions, invariants (can start empty), policy threshold
4. **For slash commands:** Copy the template prompts from `CLAUDE.md` and adapt the subsystem lists and health dimensions for your project. Place them in your project's `.claude/commands/` directory.

## Slash Commands Reference

| Command | Tier | Sessions | Purpose |
|---|---|---|---|
| `/broad-scan` | 1 | 1 | Two-stage whole-codebase audit |
| `/broad-implement` | 1 | 1 | Implement selected findings from broad scan |
| `/targeted-audit` | 2 | 1 of 2 | Scoped subsystem audit + plan |
| `/targeted-implement` | 2 | 2 of 2 | Implement from Tier 2 handoff block |
| `/audit` | 3 | 1 | Deep subsystem audit (produces Session Handoff Block) |
| `/plan` | 3 | 1 | Convert audit findings to implementation plan |
| `/implement` | 3 | 1 | Execute implementation plan |
| `/regression` | 3 | 1 | Post-implementation regression check |
| `/reflect` | 3 | 1 | Post-cycle honest assessment |
| `/test-sync` | 1,2,3 | 1 | Resolve test failures after implementation |
| `/sync-docs` | 1,2,3 | 1 | Detect and fix documentation drift |
| `/health-pulse` | any | 1 | Quick directional health check (both axes) |
| `/systems-map` | 3 | 1 | Architectural overview (run once per project) |
| `/roadmap` | 3 | 1 | Strategic planning across 4 time horizons |

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
