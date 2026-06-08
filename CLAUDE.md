# Claude Workflow Tools — Prompt Templates

Project-agnostic prompt templates for every slash command, and the canonical source from which this repo's `.claude/commands/` are generated. The commands are project-agnostic: they reference a per-project **Cycle Workflow Config** rather than inlining specifics, so adapting to a new project means writing that config (via `/setup-cycle`) and copying the `.claude/commands/` directory — not replacing placeholders.

> **Dogfooding note (this repo runs the workflow on itself):** the
> `## Cycle Workflow Config` sections in this file are the *template /
> schema* that consuming projects copy. This repo's own live config —
> its subsystems, dimensions, Axis B categories, and invariant library —
> lives in [`.cycle/config.md`](.cycle/config.md). When running any cycle
> command against THIS repo, read `.cycle/config.md` as the Cycle
> Workflow Config, not the template blocks below.

## Adaptation Checklist

When setting up a new project:

1. Run `/setup-cycle` to generate the Cycle Workflow Config
2. Add the config to your project's CLAUDE.md (see format below)
3. Copy this repo's `.claude/commands/` directory into your project (generated from these CLAUDE.md templates by `scripts/gen-commands.mjs`) — they are project-agnostic and reference the config in CLAUDE.md, no placeholder replacement needed
4. Run `/sync-commands` periodically to check for template updates

## Cycle Workflow Config (add to each project's CLAUDE.md)

This section is produced by `/setup-cycle` and consumed by all command files. Commands reference it by reading CLAUDE.md at the start of each session.

```
## Cycle Workflow Config

### Test Command
npm test

### Health Dimensions
Overall, Architecture & Code Quality, Security & Compliance, ...

### Horizontal (Axis B) Categories   ← optional; defaults to the standard 5 if omitted
Silent Degradation Posture | what it measures
Startup Ordering Guarantees | what it measures
Operator-Only State Gaps | what it measures
Parallel Source-of-Truth Drift | what it measures
Test Coverage Quality | what it measures
(4–6 categories; adapt names/measures for domain-specific bug shapes)

### Subsystems
Core Architecture & Pipeline:
  server/index.ts, server/routes.ts, server/middleware/
Storage Layer / Database:
  server/storage.ts, server/db/
(repeat for each subsystem)

### Invariant Library
INV-01 | Rule text here | Subsystem: Core Architecture | Verify: test name or code ref
INV-02 | Rule text here | Subsystem: Security
(repeat for each invariant; `Verify:` is optional — name a test after the
 invariant, e.g. `describe('INV-01', …)` or an assertion/code ref, so the
 Verification Pass can execute it instead of only reading code)

### Policy Configuration
Policy threshold: 4/10
Consecutive cycles: 2

### Regression Scenarios   ← optional; required when Test Command is `manual`
S1 | [short scenario name] | Subsystem: [name]
  Steps:
    - [step]
    - [step]
  Expected: [outcome]
(repeat for each scenario)

### Frozen Subsystems   ← optional
- [subsystem name] — [reason, one line, e.g. "being retired; do not audit unless code is being migrated out"]
(absent or empty = no frozen subsystems)

### Deploy Command   ← optional; per-subsystem mapping
[subsystem name]: [command + any context the operator needs, e.g. "clasp push -f, then Apps Script editor → Deploy → New version"]
[subsystem name]: [command + any context]
(absent = no deploy step printed in implementation summaries)
```

## Canonical Definitions

These definitions are used consistently across all commands:

**Production bug:** A behavior that would cause incorrect results, data loss, security exposure, or user-visible failure under current usage patterns OR reasonably anticipated growth. Scale-related findings should note the threshold at which they'd fire — the effort to fix should be proportionate to how soon that threshold is realistic.

**Regression:** Any behavior change where the post-cycle state is worse under any realistic load than the pre-cycle state, whether documented as a "tradeoff" or not.

**Test fallback:** If the test suite cannot run (missing DB, API keys, dependencies), note why and perform a manual regression check with extra thoroughness. Flag the test gap as a follow-on item. *For projects with no programmatic test runner at all, set `Test Command: manual` in the Cycle Workflow Config and define a `Regression Scenarios` block — manual scenario walks become the canonical verification path, not a fallback.*

---

## Cycle State & Memory

Claude Code has no memory between sessions. This system bridges that gap, but
not all memory should be carried forward the same way. Two distinct channels:

- **Substrate (carry forward — loading it is pure win):** the systems map,
  the invariant library, Common Gotchas, and the score history. Re-deriving
  these every session wastes context and produces *contradictory* conclusions.
  Always make them available to a new session.
- **Judgment (re-derive fresh — do NOT inherit as authoritative):** audit
  findings, severity calls, and the prior agent's rationalizations. A new
  audit must use fresh eyes. This is the same principle behind the §4v
  Independent Verification pass, which deliberately runs with zero
  implementation context so the implementer can't grade its own work.

**The hard rule:** `/cycle-resume` continues an *in-progress implementation
thread* — it carries substrate + objective facts (what changed, what's
pending, decisions made), never prior judgments. **Starting a new audit is
always fresh** and never inherits the previous scan's findings as conclusions.

**Cycle numbering (single source of truth):** the `Cycle:` field in
`.cycle/STATE.md` is authoritative. It increments by 1 when a NEW audit
cycle begins — a fresh `/broad-scan` or `/audit` started after the prior
cycle's `/reflect` (or its Health Synthesis) completed; the initial
`/setup-cycle` + first broad-scan is **Cycle 1**. Every phase within a
cycle (audit → plan → implement → regression → reflect) carries the SAME
number. `/reflect` stamps the `metrics.csv` `cycle` column from this field
(never invents one), and `/cycle-status` surfaces it.

### Optional `.cycle/` state directory (per project)

For projects that want lossless session-to-session continuity without manual
copy-paste, keep a `.cycle/` directory at the project root:

- `.cycle/STATE.md` — rolling "where I left off" (template below). Written by
  the implement commands' CHECKPOINT step, read by `/cycle-resume` and
  `/cycle-status`.
- `.cycle/metrics.csv` — per-cycle metrics appended by `/reflect` / synthesis.
  Header row (create on first write):
  `date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes`
  `/reflect` appends a `phase=reflect` row (net_score, prod_fixes,
  new_failure_modes); Health Synthesis appends a `phase=synthesis` row
  (category_d_ratio, axis_b_lowest). `/cycle-status` reads it for trend.
  net_score/prod_fixes/new_failure_modes are owned **only** by the
  `phase=reflect` row — the implement commands write STATE.md, not
  metrics, so never add a metrics row for an implement/plan/audit phase
  or the CSV totals will double-count.
- `.cycle/estimates.csv` — estimate-vs-actual calibration log, appended by
  `/reflect`. Header row (create on first write):
  `date,cycle,action,estimate,estimated_hours,actual_hours,calibration_note`
  Over time this surfaces personal calibration (e.g. "L items actually
  take ~5 days"); `/plan` and `/audit` can consult it to sharpen future
  effort estimates.
- `PROJECT_HEALTH.md` stays at the repo root (see §7 in the HTML tool).

Two optional helpers operate on this state (both fail-safe and additive):
- `scripts/cycle-context.mjs` — a **SessionStart** hook that auto-loads
  the substrate (STATE + current standing + invariant count) into every
  new session, retiring the "paste the systems map every session"
  friction. Enable it by copying the script and adding to
  `.claude/settings.json`:
  `{ "hooks": { "SessionStart": [ { "hooks": [ { "type": "command", "command": "node scripts/cycle-context.mjs" } ] } ] } }`
  With no `.cycle/` it prints nothing and never fails the session.
- `scripts/render-metrics.mjs` — renders `.cycle/metrics.csv` into a
  markdown trend report (per-row table + net-score / Category-D
  sparklines + cumulative summary). Run it anytime; `--out FILE` writes.

And one helper operates on the invariant library:
- `scripts/invariant-check.mjs` — the executable invariant runner. Reads
  the library (`.cycle/config.md` or CLAUDE.md), runs every invariant
  whose `Verify:` field is a command (`node …`, `npm …`, `./…`, …) and
  reports PASS/FAIL; prose/test-name `Verify:` fields are reported
  MANUAL. This is the automated half of the §4v invariant probe — write
  `Verify:` as a runnable command and the invariant becomes a test.
  `--list` shows the classification without running.

And one operates across projects:
- `scripts/portfolio.mjs` — aggregates several projects' `PROJECT_HEALTH.md`
  "Current Standing" sections into one portfolio board (lowest overall
  first = audit next), with the portfolio average. Pass the
  `PROJECT_HEALTH.md` paths; `--out FILE` writes.

This is **fully optional and additive**: if `.cycle/` does not exist, every
command behaves exactly as it always has (emit the handoff/summary block in
chat; copy-paste it into the next session). Deleting `.cycle/` returns you to
the pure copy-paste workflow with no loss.

`.cycle/STATE.md` template:

```
# Cycle State

## Current
Cycle: [N — single source of truth; increments only when a new audit cycle begins]
Phase: [audit | plan | implement | regression | verify | reflect | idle]
Scope: [subsystem(s) or "broad"]
Test Command: [from Cycle Workflow Config]
Updated: [date]

## In progress (facts to carry forward — NOT judgments)
- [what is partially done]
- [the next concrete step]

## Completed this cycle
- [action ID] | [file(s)] | [one line]

## Pending / not yet done
- [action ID or description]

## Open follow-on items
- [File: area] — [what to check and why]

## Decisions made (so the next session doesn't re-litigate)
- [decision] — [rationale]

## Where I left off
[1–3 sentences: exactly what to do first on resume]
```

---

## Setup

### /setup-cycle

```
Do not make any changes to any files during this session.

You are setting up the cycle workflow configuration for this project.
This is the foundation for all future audit, implementation, and
verification work — accuracy here compounds across every cycle.

Run the following five phases in order. Complete each fully before
starting the next.

═══════════════════════════════════════════
PHASE 1 — FOUNDATION READ
═══════════════════════════════════════════

Read these files carefully in this order:
1. CLAUDE.md (entire file — especially Common Gotchas, Key Design
   Decisions, Systems Map if present, Operator State Checklist if present)
   If CLAUDE.md does not exist yet (greenfield project), skip this step
   and note that Common Gotchas and invariants will be populated after
   the first audit cycle.
2. README
3. Package manifest (package.json, pyproject.toml, Cargo.toml, etc.)
4. All entry points (server/index.ts, client main, route registration)
5. Database schema files
6. Test configuration and existing test files (scan for patterns).
   If no programmatic test runner exists (no test command in the
   manifest, no test framework dependency, no test files), note this —
   OUTPUT 1 will use `Test Command: manual` and require a
   `Regression Scenarios` block.
7. Deployment mechanism (look for clasp config, terraform/ directory,
   .github/workflows/deploy.*, fly.toml, vercel.json, Dockerfile +
   deploy script, fastlane config, etc.). For each detected deployable,
   identify the command and the subsystem it deploys. If found, OUTPUT 1
   will include a `Deploy Command` section.

Produce a PROJECT PROFILE:
- Project type and domain: [what this application does, who uses it]
- Tech stack: [languages, frameworks, databases, external services]
- Approximate size: [file count, estimated lines]
- Maturity indicators: [test coverage breadth, CI config, documentation quality,
  error handling patterns, logging patterns]
- External dependencies: [APIs, databases, cloud services, SDKs]
- Multi-tenant: [yes/no — how is data isolated?]
- Key architectural patterns: [monolith/microservices, storage abstraction,
  auth model, job queue, real-time, etc.]

═══════════════════════════════════════════
PHASE 2 — MODULE & DEPENDENCY ANALYSIS
═══════════════════════════════════════════

For every directory that contains source code:
1. List all files with a one-line description of each file's responsibility
2. For the 10-15 most important files (entry points, high-fan-out modules,
   core business logic): trace their imports and identify which other
   files depend on them

Produce:
HIGH-FAN-OUT MODULES (most imported — changes here have widest blast radius):
[Module] | [Key exports] | [Consumer count] | [Notes]

NATURAL COUPLING CLUSTERS:
Identify groups of files that import heavily from each other but have
fewer connections to files outside the group. These are candidate
subsystem boundaries. For each cluster:
- [Cluster name] | [Files] | [Internal coupling evidence] | [External connections]

═══════════════════════════════════════════
PHASE 3 — SUBSYSTEM BOUNDARY PROPOSAL
═══════════════════════════════════════════

Using the coupling clusters from Phase 2, propose subsystem groupings.

For each proposed subsystem:
- Name: [clear, descriptive name]
- Files: [complete comma-separated file list]
- Responsibility: [one sentence — what this subsystem does]
- Session feasibility: [estimated file count and total lines — can this
  be deeply audited in one Claude Code session?]
- Key risk: [what's the worst thing that can go wrong in this subsystem?]

Quality checks — verify all of these before proceeding:
□ Every source file in the project is assigned to exactly one subsystem
□ No subsystem has so many files that it can't be audited in one session
  (rough guide: <20 files or <5000 lines for deep reading)
□ Files within each subsystem are more tightly coupled to each other
  than to files in other subsystems
□ The boundaries correspond to natural seams, not arbitrary directory splits
□ High-fan-out modules are in the subsystem that owns their primary concern

If any check fails, adjust the groupings and explain the tradeoff.

Flag SEAM FILES — files that sit at the boundary between subsystems
and could reasonably belong to either.

Flag FROZEN SUBSYSTEM CANDIDATES — subsystems that are explicitly
legacy / being retired / being migrated out (e.g., a deprecated
module kept only until a successor is fully built). For each
candidate, note: (a) why it's frozen, (b) what's replacing it,
(c) what conditions would unfreeze it. These appear in OUTPUT 1's
Frozen Subsystems section.

═══════════════════════════════════════════
PHASE 4 — HEALTH DIMENSIONS & POLICY
═══════════════════════════════════════════

Propose health dimensions for this project's scoring. These should:
- Reflect what actually matters for THIS project's domain and users
- Be scorable with evidence from code reads
- Cover both technical health and feature/product effectiveness
- Include domain-specific dimensions
- Be between 10-15 dimensions total

For each dimension:
- Name
- What it measures (one sentence)
- Which subsystem(s) primarily feed evidence into this score

Also recommend:
- Policy threshold: [score ≤ N triggers policy response]
- Consecutive cycles before trigger: [typically 2]

Also propose the project's HORIZONTAL (Axis B) bug-shape categories —
cross-cutting failure patterns that no single subsystem owns, scored in
Health Synthesis alongside the vertical dimensions. The default set fits
most server/SaaS projects: Silent Degradation Posture, Startup Ordering
Guarantees, Operator-Only State Gaps, Parallel Source-of-Truth Drift,
Test Coverage Quality. Keep these unless the domain calls for different
shapes (e.g. a data pipeline might add "Numerical / Precision Drift," a
mobile app "Offline / Sync Integrity," a library "Public API
Compatibility"). Aim for 4–6 categories, each with a name + one-sentence
"what it measures."

═══════════════════════════════════════════
PHASE 5 — INVARIANT EXTRACTION
═══════════════════════════════════════════

Extract initial invariants from the project's documentation and code.
Each invariant must be:
- Specific enough to be pass/fail (not "auth should be secure")
- Verifiable by code read or targeted test execution
- High-consequence if violated

Sources to mine (in priority order):
1. Common Gotchas section of CLAUDE.md
2. Key Design Decisions — each implies a contract
3. Operator State Checklist (if present)
4. Critical code patterns observed in Phase 2

For each invariant:
- ID: INV-XX
- Rule: [one clear sentence]
- Subsystem: [which subsystem]
- How to verify: [code read / specific test / assertion]
- Source: [which gotcha, decision, or pattern]

Aim for 15-25 invariants.

═══════════════════════════════════════════
OUTPUT — PROJECT CONFIGURATION
═══════════════════════════════════════════

Produce two outputs:

OUTPUT 1 — CYCLE WORKFLOW CONFIG (paste into the project's CLAUDE.md):

## Cycle Workflow Config

### Test Command
[test runner command, e.g. npm test — OR the literal word `manual`
 for projects with no programmatic test runner]

### Health Dimensions
[dim1], [dim2], [dim3], ...

### Horizontal (Axis B) Categories   ← optional; defaults to the standard 5 if omitted
[Category name] | [what it measures]
(repeat for each, 4–6 total)

### Subsystems
[Subsystem Name]:
  [comma-separated file list]
(repeat for each subsystem)

### Invariant Library
INV-XX | [rule text] | Subsystem: [name] | Verify: [test name or code ref — optional]
(repeat for each invariant; carry the Phase 5 "How to verify" detail into
 the optional Verify field when it names a concrete test or assertion)

### Policy Configuration
Policy threshold: [N]/10
Consecutive cycles: [N]

### Regression Scenarios   ← required iff Test Command is `manual`; otherwise optional
S1 | [short scenario name] | Subsystem: [name]
  Steps:
    - [step]
    - [step]
  Expected: [outcome]
(repeat for each scenario; aim for 5–15 covering golden paths and known regression hotspots)

### Frozen Subsystems   ← optional; omit if no subsystems are frozen
- [subsystem name] — [reason: why frozen, what's replacing it, what would unfreeze it]
(repeat for each frozen subsystem)

### Deploy Command   ← optional; per-subsystem mapping; omit if project has no deploy step
[subsystem name]: [command + any context, e.g. "clasp push -f then Apps Script editor → Deploy → New version"]
[subsystem name]: [command + any context]
(repeat for each subsystem with a deploy command)

OUTPUT 2 — CYCLE ROTATION PLAN (for operator reference):

Recommended first subsystem to audit: [name — why]
Recommended cycle order: [ordered list with rationale — exclude
  any subsystems marked frozen; note that they are skipped by
  default but can be explicitly named to override]
Seams audit frequency: every [N] subsystem cycles

CONFIDENCE ASSESSMENT:
For each subsystem, rate confidence that file list is complete
and boundary is correct: High / Medium / Low.
```

---

## Tier 1 Commands

### /broad-scan

```
Do not make any changes to any files during the audit phase.

Read CLAUDE.md (especially Common Gotchas and Key Design Decisions),
README, and the roadmap carefully before doing anything else.

This audit runs in three stages within this session. Complete each stage fully before starting the next.

═══════════════════════════════════════════
STAGE 1 — BROAD PASS
═══════════════════════════════════════════

Audit the codebase thoroughly. For each finding:
- State the issue, cite the file and function/line area
- Severity: Critical / High / Medium / Low
- Confidence: High / Medium / Low (flag if you only skimmed this area)
- Classify: is this a production bug, a structural/quality issue, or
  a feature/effectiveness gap? Be honest about which.

Flag:
- Bugs and logic errors in currently-reachable code paths
- Security and compliance gaps (auth, sensitive data handling, audit logging)
- Inconsistencies between CLAUDE.md/docs and actual implementation
- Dead code, unused exports, stale TODOs only if they create confusion
- Silent degradation paths: places where failure is swallowed and the
  app continues with wrong results rather than surfacing an error

For findings in any Frozen Subsystem (see CLAUDE.md Cycle Workflow Config):
- Prefix the finding with [FROZEN: subsystem-name]
- Consider whether the finding is worth fixing given retirement —
  Critical/High findings still warrant a fix; Medium/Low findings
  may be deferred or skipped depending on the retirement timeline

DO NOT flag code for "simplification" or "cleanup" unless the current
code is actively wrong or creates a maintenance trap. Working code
that could be written differently is not a finding.

After the broad pass, provide ratings out of 10 with reasoning for
each dimension listed in the "Health Dimensions" section of CLAUDE.md's
Cycle Workflow Config. One bullet per dimension.

For each rating include:
- Your confidence level (did you deeply read this area or infer from partial context?)
- The single finding most dragging the score down
- The single highest-leverage improvement and its estimated effort: S / M / L plus a rough wall-clock estimate (e.g. S ≈ <2h, M ≈ ½–2 days, L ≈ 3+ days; for one developer working with Claude Code)

End Stage 1 with:
- Top 5 findings by production impact (most likely to cause real breakage)
- Any findings that contradict or are missing from CLAUDE.md Common Gotchas
- CONFIDENCE GAP LIST: For every dimension you rated Medium or Low
  confidence, list the specific files and areas you did not read deeply.
  Format: [Dimension] — [files/areas not read] — [what you inferred
  vs. what you'd need to verify]

═══════════════════════════════════════════
STAGE 2 — DEEP DIVE ON LOW-CONFIDENCE AREAS
═══════════════════════════════════════════

Now go deeper on every area in your Confidence Gap List from Stage 1.
For each Low or Medium confidence dimension:

1. Read the specific files you listed as not deeply read
2. Look for findings you missed in Stage 1 — especially silent
   degradation, cross-module dependency issues, and security gaps
   that only appear on close reading
3. Update your findings list: add new findings, revise or remove
   any Stage 1 findings that were wrong on closer inspection
4. Revise your confidence level and score for each dimension you
   re-examined. For each revision, note what changed and why.

After completing the deep dives, produce a FINAL REPORT:

REVISED RATINGS (only dimensions that changed):
- [Dimension]: [old score] → [new score] | Confidence: [old] → [new]
  Reason: [what the deep dive revealed]

NEW FINDINGS (discovered in Stage 2):
[same format as Stage 1 findings]

RETRACTED FINDINGS (Stage 1 findings that were wrong on closer read):
[finding ID] — [why it was wrong]

FINAL TOP 5 by production impact (updated if Stage 2 changed the ranking)

One sentence: the single most important thing to fix before anything else.

═══════════════════════════════════════════
STAGE 3 — EFFECTIVENESS & STRATEGIC REVIEW
═══════════════════════════════════════════

Shift your lens from "what's broken" to "how well does this work."
Stages 1-2 assessed code quality. Stage 3 assesses the product.

For each major feature area (use the rating dimensions as a guide):
1. Does this feature actually accomplish what it's designed to do?
   Not "is it bug-free" but "does it produce good results for users?"
2. What's missing that a user or operator would reasonably expect?
   Completeness gaps, not bugs — things that aren't built yet vs.
   things that are built wrong.
3. Where is the UX friction? Workflows that are confusing, slow,
   or require unnecessary steps — separate from crashes or errors.

Then provide:
FEATURE EFFECTIVENESS (for each major feature area):
- [Feature area]: [Working well / Functional but limited / Needs work]
  [1-2 sentences on how effectively it serves users, not code quality]

COMPLETENESS GAPS (what's not built yet that should be):
- [Gap] — [impact on users] — [effort: S/M/L + rough time estimate]
(list the top 5 most impactful gaps)

STRATEGIC SUGGESTIONS (what would make this significantly more valuable):
- [Suggestion] — [why it matters] — [builds on what already exists]
(3-5 suggestions, grounded in what you observed, not generic advice)

PRODUCTION READINESS ASSESSMENT:
One paragraph: is this tool ready for production use? What's the gap
between current state and production-ready? Be specific about what
"production-ready" means for this type of application.

After I review the audit, I will tell you which findings to implement.
Do not implement anything until then.
```

### /broad-implement

```
If $ARGUMENTS is empty or missing, respond with exactly this and stop:

Usage: /broad-implement <finding IDs or description of fixes to implement>
Example: /broad-implement F03, F07, F12

Paste or reference the findings from a prior /broad-scan session.

---

You are implementing specific findings from a broad scan audit.

Scope: $ARGUMENTS

Read CLAUDE.md (especially Common Gotchas) before starting.

Rules:
- Implement ONLY the findings specified above — nothing else
- Do not fix, refactor, or improve anything outside this scope even if
  you notice other issues — note them at the end
- If a fix is more complex than expected, stop and describe what you
  found before continuing
- If a fix requires touching files that seem unrelated to the finding,
  explain why before proceeding
- After each fix, briefly note: what changed, files touched, anything
  unexpected
- Check Common Gotchas before each fix to avoid re-introducing known issues
- Before editing a module, scan for its test doubles — mocks/stubs/fixtures
  of that module, especially ones encoding the OLD behavior; update them as
  part of the fix, not reactively in RUN TESTS

After all fixes are complete, do the following in order:

1. RUN TESTS
Read the Test Command from CLAUDE.md's Cycle Workflow Config.

  - If Test Command is `manual`: skip programmatic test execution.
    Walk every Regression Scenario whose Subsystem overlaps a file
    you modified. Record per-scenario outcome (PASS / FAIL /
    NOT APPLICABLE — with reason for NOT APPLICABLE). A FAIL is
    classified the same as a test failure below.

  - Otherwise: run the test suite (use the Test Command, or
    `npm test` if not specified). If Regression Scenarios is also
    configured, walk them after tests pass.

Note the result. If tests fail (or any scenario FAILs), classify:
- Caused by this session's changes (fix now)
- Pre-existing (note but don't fix)
- Real production bug exposed by correct test/scenario (flag as
  follow-on, don't fix here)

2. REGRESSION CHECK
For each file you modified:
- Could this change break any caller or consumer of this function/export?
- Did you change any interface, return type, or default value that other
  modules depend on?
- Is there any scenario where the old behavior was actually correct and
  you've made it worse?

3. REFLECT
For each fix completed:
a) Would this bug have actually fired in production this month? YES/NO
b) Did this fix introduce a new failure mode, documented or not? YES/NO
Tally: [production fixes] − [new failure modes] = [net score]

4. INVARIANT CHECK
Check whether any changes could have violated invariants from the project's
invariant library (listed in CLAUDE.md Common Gotchas). Flag any at risk.

5. SUMMARY
Produce a BROAD SCAN IMPLEMENTATION SUMMARY:

---BROAD SCAN IMPLEMENTATION SUMMARY---
Findings implemented: [list finding IDs and one-line descriptions]
Files modified: [list all files touched]

CHANGES:
[Finding ID] | [File(s)] | [What changed]

TEST RESULTS: [passed/failed — details if failed]
REGRESSION RISKS: [any risks identified, or "None"]
INVARIANTS AT RISK: [any invariants potentially affected, or "None"]
NET SCORE: [production fixes] − [new failure modes] = [net]

OPERATOR ACTIONS / DEPLOY:
- [human-only step outside the PR — env var, IaC, console/dashboard, one-time migration] | BLOCKS DEPLOY: Y/N
(repeat per action, or "None")
Deploy: [if a Deploy Command is configured in CLAUDE.md for any modified
subsystem, the command(s) to run, one line per subsystem; else
"N/A — no Deploy Command configured"]

(Not complete in production until blocking operator actions are done AND
the deploy step is confirmed.)

FOLLOW-ON ITEMS:
- [anything noticed but not fixed, out of scope]
(or "None")

DOCUMENTATION UPDATES NEEDED:
- [any CLAUDE.md, README, or inline doc changes needed]
(or "None")
---END BROAD SCAN IMPLEMENTATION SUMMARY---

6. CHECKPOINT (optional — only if the project uses .cycle/ state)
If a .cycle/ directory exists at the project root, create or update
.cycle/STATE.md to reflect this session: completed findings, any
selected findings not finished, open follow-on items, decisions made,
and a "Where I left off" line. This lets /cycle-resume continue cleanly
in a fresh session if context runs out. If .cycle/ does not exist, skip
this step — the summary block above is the record, as usual.

After the summary, suggest running /test-sync if any test failures remain,
and /sync-docs if any documentation updates are needed.
```

---

## Tier 2 Commands

### /targeted-audit

```
If $ARGUMENTS is empty or missing, respond with exactly this and stop:

Usage: /targeted-audit <subsystem-name>

Available subsystems: See the "Subsystems" section in CLAUDE.md's
Cycle Workflow Config for the full list.

Example: /targeted-audit Security & Compliance

---

Read CLAUDE.md (especially Common Gotchas, Key Design Decisions, and
the Cycle Workflow Config) before starting. Do not make any changes
to any files during this session.

This session's scope: $ARGUMENTS
Use the Subsystems section of CLAUDE.md's Cycle Workflow Config to
identify the relevant files for this subsystem.

If $ARGUMENTS names a subsystem listed in `Frozen Subsystems`:
print this banner at the top of your output before continuing, then
proceed with the audit as normal:

  ╔══════════════════════════════════════════════════════════════╗
  ║ FROZEN SUBSYSTEM — proceeding because explicitly named.      ║
  ║ Reason: [reason from Frozen Subsystems config]               ║
  ╚══════════════════════════════════════════════════════════════╝

[OPTIONAL: PASTE ANY FOLLOW-ON ITEMS FROM A PRIOR SESSION]

[IF TRIGGERED: PASTE ANY POLICY RESPONSE BLOCKS FROM THE LAST HEALTH
SYNTHESIS — these are MANDATORY scope additions for this cycle]

Audit this subsystem thoroughly. For each finding:
- State the issue, cite file and function/line
- Severity: Critical / High / Medium / Low
- Confidence: High / Medium / Low
- Would this bug actually fire in production this month? YES/NO
- Effort to fix: S (< 2 hours) / M (half-day to 2 days) / L (3+ days)

Focus on:
- Bugs and logic errors in currently-reachable code paths
- Security concerns specific to this module
- Inconsistencies between CLAUDE.md and actual implementation
- Cross-module dependencies — what would break in OTHER modules
- Silent degradation paths

DO NOT flag style preferences, speculative improvements, or "could be
cleaner" refactoring unless the current code is actively wrong.

After the audit, produce an implementation plan:
- Action ID (A1, A2, A3...)
- What specifically to do (concrete)
- Which finding(s) it addresses
- Effort: S / M / L
- Cross-module risk: Low / High
- Prerequisites

Organize into:
1. Fix now — production bugs, security issues, blocking problems
2. Fix this session — high-value, well-scoped, low cross-module risk
3. Defer — needs more context, high risk, or dependencies outside scope

End with a TIER 2 HANDOFF BLOCK:

---TIER 2 HANDOFF BLOCK---
Scope: [subsystem]
Findings: [count] total — [critical/high/medium/low breakdown]
Production bugs (would fire this month): [count]

ACTIONS (implement in this order):
[ID] | [File: area] | [Effort] | [Risk] | [Description]

CROSS-MODULE RISKS:
- [what could break outside this scope and where to verify]
(or "None identified")

OPERATOR ACTIONS SURFACED (manual / out-of-PR steps — env vars, IaC, console/dashboard, migrations):
- [action] | BLOCKS DEPLOY: Y/N
(or "None")

DO NOT TOUCH:
- [high-risk files/functions — explain why]
---END TIER 2 HANDOFF BLOCK---
```

### /targeted-implement

```
If $ARGUMENTS is empty or missing AND no TIER 2 HANDOFF BLOCK exists
earlier in this session, respond with exactly this and stop:

Usage (same session): /targeted-implement — run after /targeted-audit
Usage (new session): Paste the TIER 2 HANDOFF BLOCK first, then run

---

Read CLAUDE.md (especially Common Gotchas) before starting.

You are implementing the actions from the TIER 2 HANDOFF BLOCK above.

Rules:
- Implement ONLY the actions in the handoff block, in order
- Do not fix anything outside scope — note for follow-on
- Stop on unexpected complexity and describe before continuing
- Stop if touching DO NOT TOUCH files or out-of-scope files
- Check Common Gotchas before each action
- Before editing a module, scan for its test doubles — mocks/stubs/fixtures
  of that module, especially ones encoding the OLD behavior; update them as
  part of the action, not reactively in the test step

After all actions complete:

1. RUN TESTS — read Test Command from CLAUDE.md. If `manual`, walk
   Regression Scenarios for the touched subsystem(s) instead. Classify
   failures (this session / pre-existing / real bug). See
   `/broad-implement` Step 1 for the full branching detail.
2. REGRESSION CHECK — review each modified file for breakage risk,
   cross-reference CROSS-MODULE RISKS from handoff block
3. REFLECT — for each action: production bug? (YES/NO) New failure
   mode? (YES/NO). Tally net score.
4. INVARIANT CHECK — cross-reference against project invariant library
5. INVARIANT CANDIDATES — new rules from this session's changes
6. SUMMARY — produce TARGETED IMPLEMENTATION SUMMARY:

---TARGETED IMPLEMENTATION SUMMARY---
Scope: [subsystem]
Actions completed: [list IDs]
Actions not completed: [list with reason, or "All completed"]
Files modified: [list]

CHANGES:
[Action ID] | [File(s)] | [What changed] | [Findings addressed]

TEST RESULTS: [passed/failed]
REGRESSION RISKS: [risks or "None"]
INVARIANTS AT RISK: [any or "None"]
NET SCORE: [production fixes] − [new failure modes] = [net]
INVARIANT CANDIDATES: [new rules or "None"]

OPERATOR ACTIONS / DEPLOY:
- [human-only step outside the PR — env var, IaC, console/dashboard, one-time migration] | BLOCKS DEPLOY: Y/N
(repeat per action, or "None")
Deploy: [Deploy Command for the touched subsystem if configured, else
"N/A — no Deploy Command configured"]

(Not complete in production until blocking operator actions are done AND
the deploy step is confirmed.)

FOLLOW-ON ITEMS:
- [File: area] — [what to check and why]
(or "None")

DOCUMENTATION UPDATES NEEDED:
- [updates or "None"]
---END TARGETED IMPLEMENTATION SUMMARY---

7. CHECKPOINT (optional — only if the project uses .cycle/ state)
If a .cycle/ directory exists at the project root, create or update
.cycle/STATE.md to reflect this session: completed actions, any actions
not finished, open follow-on items, decisions made, and a "Where I left
off" line. This lets /cycle-resume continue cleanly in a fresh session
if context runs out. If .cycle/ does not exist, skip this step.

Suggest /test-sync and /sync-docs if applicable.
```

---

## Tier 3 Commands

### /audit

```
If $ARGUMENTS is empty or missing, respond with exactly this and stop:

Usage: /audit <subsystem-name>
Available subsystems: see the Subsystems section in CLAUDE.md's Cycle
Workflow Config.

---

Read CLAUDE.md (especially Common Gotchas, Key Design Decisions, and the
Cycle Workflow Config) before starting. Do not make any changes to any
files during this session.

This session's scope: $ARGUMENTS

[PASTE SYSTEMS MAP SUMMARY HERE — 3–5 bullets]
[OPTIONAL: PASTE FOLLOW-ON ITEMS FROM A PRIOR SESSION]
[IF TRIGGERED: PASTE POLICY RESPONSE BLOCKS FROM THE LAST HEALTH
 SYNTHESIS — these are MANDATORY scope additions for this cycle]
[OPTIONAL: SEAMS AUDIT FOCUS — a seam this cycle should emphasize]

If this scope is listed under Frozen Subsystems in the Cycle Workflow
Config, print the FROZEN SUBSYSTEM banner (see /targeted-audit) before
continuing, then proceed.

Audit this subsystem across these focus areas:
1. Bugs and logic errors in currently-reachable code paths
2. Dead code / unused exports (only if they create confusion)
3. Test gaps (missing coverage on load-bearing paths)
4. Stale artifacts (TODOs, comments, docs that mislead)
5. Hardcoded values that should be config/env
6. Security and compliance gaps
7. Docs drift (CLAUDE.md vs implementation)
8. Code quality that is actively wrong (not style preference)
9. Parallel source-of-truth (values/types defined in multiple places)
10. Startup ordering / initialization assumptions
11. Silent degradation paths (failure swallowed, wrong results continue)
12. Operator-only state (manual steps with no automated validation)

For each finding:
- State the issue, cite file and function/line
- Severity: Critical / High / Medium / Low
- Confidence: High / Medium / Low
- Would this fire in production this month? YES (trigger) / NO (why not)
- Effort: S (<2h) / M (½–2 days) / L (3+ days) + rough time estimate

DO NOT flag style preferences or speculative "could be cleaner"
refactoring unless the current code is actively wrong.

Finding IDs in the handoff block are SESSION-LOCAL labels (F1, F2, …) —
not invariant-library IDs. INV-N IDs are assigned only when a rule is
promoted to the Invariant Library (see /reflect), so parallel audit
sessions can reuse F1/F2 without colliding.

Do NOT produce an implementation plan — that is /plan. Produce a
SESSION HANDOFF BLOCK:

---SESSION HANDOFF BLOCK---
Scope: [subsystem group name]
Files covered: [comma-separated list]
Audit confidence: [High / Medium / Low]

FINDINGS:
[ID] | [File: function/line] | [Severity] | [Confidence] | [Effort] | [Description]

CROSS-MODULE DEPENDENCIES SURFACED:
- [dependency description]

OPERATOR ACTIONS SURFACED (manual / out-of-PR steps this scope depends on — env vars, IaC, console/dashboard, one-time migrations):
- [action] | BLOCKS DEPLOY: Y/N
(or "None")

TOP PRIORITIES:
Impact: [finding IDs]
High-leverage: [finding IDs]

RECOMMENDED PLANNING STARTING POINT: [one sentence]
---END HANDOFF BLOCK---
```

### /plan

```
If $ARGUMENTS is empty AND no SESSION HANDOFF BLOCK exists earlier in
this session, respond with exactly this and stop:

Usage (same session): /plan — run after /audit
Usage (new session): paste the SESSION HANDOFF BLOCK first, then run

---

Read CLAUDE.md (Common Gotchas, Cycle Workflow Config) before starting.
Do not make any changes to any files during this session.

[PASTE SESSION HANDOFF BLOCK HERE IF FRESH SESSION]
[PASTE SYSTEMS MAP SUMMARY HERE]

Produce a prioritized action plan for the scope in the handoff block.

For each action:
- Action ID (A1, A2…)
- Concrete description (not "improve error handling")
- Finding ID(s) it addresses
- Effort: S / M / L + rough time estimate
- Cross-module risk: Low / High / Very High
- Prerequisites

Organize into:
1. Do immediately — critical, quick wins, or blockers
2. Do this week — high-value, well-scoped
3. Defer but schedule — important, not urgent, or has dependencies

If more than ~15 findings, split actions into Batch 1 (P0/Critical +
highest-compliance-risk) and Batch 2 (rest), and emit a complete,
SEPARATE IMPLEMENTATION HANDOFF BLOCK for EACH batch (set the Batch field
accordingly). Batch 2's block must stand alone — a fresh session must be
able to run it from its block alone, so do not leave Batch 2 as prose.

Then:
- Findings to escalate to the roadmap (too large/structural)
- Architectural decisions needed before implementation — each with the
  question, options + tradeoffs, a recommendation, and whether
  implementation is blocked or a safe default can proceed now
- Actions that are good automation/scripting candidates

Produce a DOCUMENTATION UPDATE CHECKLIST (CLAUDE.md / README / roadmap /
inline comments / other — omit files needing no change).

Then produce an IMPLEMENTATION HANDOFF BLOCK:

---IMPLEMENTATION HANDOFF BLOCK---
Scope: [subsystem group name]
Systems map reference: [available? Y/N]
Batch: [1 of 1 / 1 of 2 / 2 of 2 — omit if no split]

ACTIONS TO IMPLEMENT:
[ID] | [File: function/area] | [Effort] | [Cross-module risk] | [One-line description] | [Prereq IDs]

HIGH/VERY HIGH RISK ACTIONS (require dependency check before implementation):
[action IDs + the exports/interfaces they touch]

POLICY RESPONSE ACTIONS (mandatory if triggered — from last Health Synthesis):
[list or "None triggered"]

OPERATOR ACTIONS (carry forward to implement; mark deploy blockers — env vars, IaC, console/dashboard, migrations):
[action | BLOCKS DEPLOY: Y/N, or "None"]

IMPLEMENT IN THIS ORDER: [ordered action IDs]
ORDERING RATIONALE: [1–2 sentences]
---END IMPLEMENTATION HANDOFF BLOCK---
```

### /implement

```
If $ARGUMENTS is empty AND no IMPLEMENTATION HANDOFF BLOCK exists earlier
in this session, respond with exactly this and stop:

Usage (same session): /implement — run after /plan
Usage (new session): paste the IMPLEMENTATION HANDOFF BLOCK first, then run

---

Read CLAUDE.md (especially Common Gotchas) before starting.

[PASTE SYSTEMS MAP SUMMARY HERE]
[PASTE IMPLEMENTATION HANDOFF BLOCK HERE IF FRESH SESSION]

Before starting: for every action listed as High/Very High risk, run the
Pre-Implementation Dependency Check (identify every out-of-scope file
that imports/calls the changed functions/exports; describe what would
break) and confirm understanding before implementing those actions.
Low-risk actions may proceed. Also confirm the path your change affects is
the one that runs in production — not just an in-memory / fallback / mock
path; where a real (e.g. DB-backed) path exists alongside a fallback,
implement and test BOTH.

Rules:
- Implement ONLY the actions in the handoff block, in order
- Do not fix anything outside scope — note it for follow-on
- Stop on unexpected complexity and describe before continuing
- Stop if an action requires touching out-of-scope files
- Check Common Gotchas before each action
- Before editing a module, scan for its test doubles — mocks/stubs/fixtures
  of that module, especially ones encoding the OLD behavior (a factory mock
  that throws on a newly-added export, a non-date-scoped mock, a fixture
  asserting the prior output). Update them as part of the change, not
  reactively in RUN TESTS.
- After each action, note: what changed, files touched, anything unexpected

After all actions complete, in order:

1. RUN TESTS — read Test Command from CLAUDE.md. If `manual`, walk the
   Regression Scenarios for the touched subsystem(s) instead (PASS / FAIL
   / NOT APPLICABLE; a FAIL = a test failure). Otherwise run the suite,
   then walk any configured scenarios. Classify failures: this session /
   pre-existing / real bug exposed by a correct test.
2. Produce an IMPLEMENTATION SUMMARY BLOCK:

---IMPLEMENTATION SUMMARY BLOCK---
Session scope: [subsystem group]
Actions completed: [IDs]
Actions not completed (if any): [list with reason]

CHANGES MADE:
[Action ID] | [File(s)] | [What changed]

TEST RESULTS: [passed/failed — details, or scenario outcomes if manual]

UNEXPECTED FINDINGS DURING IMPLEMENTATION:
- [discovered while implementing, not in the audit] (or "None")

OPERATOR ACTIONS / DEPLOY:
- [human-only step outside the PR — env var, IaC, console/dashboard, one-time migration] | BLOCKS DEPLOY: Y/N
(or "None")
Deploy: [Deploy Command for any touched subsystem if configured, else "N/A — no Deploy Command configured"]
(Not complete in production until blocking operator actions are done AND the deploy step is confirmed.)

FOLLOW-ON ITEMS:
- [out-of-scope items to add to the backlog] (or "None")

DOCUMENTATION UPDATES NEEDED:
- [CLAUDE.md / README / inline] (or "None")
---END IMPLEMENTATION SUMMARY BLOCK---

3. CHECKPOINT (optional — only if .cycle/ exists): create/update
   .cycle/STATE.md (completed/pending actions, follow-ons, decisions,
   "Where I left off") so /cycle-resume can continue. Skip if no .cycle/.

Suggest /regression, /reflect, /test-sync, /sync-docs as applicable.
```

### /regression

```
Read CLAUDE.md before starting. Do not make any changes to any files
during this session.

[PASTE SYSTEMS MAP SUMMARY HERE, INCLUDING THE INTER-MODULE DEPENDENCY MAP]
[PASTE IMPLEMENTATION SUMMARY BLOCK FROM THE IMPLEMENTATION SESSION]

Based on the systems map and the changes made:
1. Identify which modules OUTSIDE the changed scope could be affected
2. For each, describe what could break and where to verify (file:area)
3. For each risk, explicitly confirm whether it materialized or was
   negated (cascade configs, zero callers, idempotent ops, existing
   indexes, defaults) — validate, don't just list
4. Confirm the path the tests exercise IS the path that runs in
   production — flag any change that passes via an in-memory / fallback /
   mock path but is broken or untested on the real (e.g. DB-backed)
   production path (Parallel Source-of-Truth Drift)
5. Cross-reference the changes against the invariant library (Cycle
   Workflow Config); flag any invariant at risk, and run its Verify test
   if one is defined
6. If a Deploy Command is configured for a touched subsystem, note which
   risks are git-verified vs. only verifiable after deploy
7. Note any docs (CLAUDE.md / README / roadmap) needing updates

Prioritize the verification list by likelihood of breakage. Then:

---FOLLOW-ON AUDIT ITEMS---
- [File: function/area] — [what to check, why flagged, which change surfaced it]
(repeat for each item, or "None")
---END FOLLOW-ON AUDIT ITEMS---
```

### /reflect

```
Read CLAUDE.md before starting. Do not make any changes to any files
during this session (other than the optional metrics append below).

[PASTE IMPLEMENTATION SUMMARY BLOCK — and REGRESSION results if available]

For each action completed this cycle, answer two binary questions:
1. Would this bug have actually fired in production this month?
   YES (real, currently-reachable, realistic load) / NO (speculative,
   defensive, dead code, zero-caller). Be specific about the trigger.
2. Did this action introduce a new failure mode, documented or not?
   YES (describe it; better or worse than what it replaced; when it
   fires) / NO. If the post-cycle state is worse under any realistic
   scenario, that is a regression — count it, don't bury it as a
   "tradeoff".

Tally (three-way classification):
- Production fixes (YES to Q1): [count] — severity breakdown
- New capabilities / features: [count]
- Defensive/structural (NO to Q1, not a feature): [count]
- New failure modes (YES to Q2): [count] — severity breakdown
- Net score: [production fixes] − [new failure modes] = [net]
  (a net-positive score with a Critical new failure mode is still a problem)

Honest impact summary:
- What changed for a user right now?
- What changed for the next developer in this subsystem?
- What became safer under scale / concurrent load?
- Was effort spent on dead code / zero-caller paths / future-proofing?

Invariant growth: list rules this cycle establishes that the next
Verification Pass should probe. Assign each a NEW invariant ID by reading
the current maximum INV-N in the library and incrementing (INV-(max+1),
INV-(max+2), …) — do not invent or reuse a number, so parallel sessions
don't collide:
[INV-N] | [rule] | [subsystem/seam] | [Verify: test/assertion].

End with: the single most structurally significant change; the finding
that should have been deferred.

Produce a CYCLE SUMMARY BLOCK:

---CYCLE SUMMARY BLOCK---
Scope: [subsystem] | Cycle: [N/date]
Production fixes: [count] — severity: [breakdown]
New capabilities/features: [count]
Defensive/structural: [count]
New failure modes: [count] — severity: [breakdown]
Net score: [fixes] − [new failure modes] = [net]
Invariant candidates: [list or "None"]
Most structurally significant change: [one line]
Should-have-been-deferred: [one line]
---END CYCLE SUMMARY BLOCK---

METRICS (optional — only if .cycle/ exists): /reflect is the SOLE writer
of net_score/prod_fixes/new_failure_modes — append exactly ONE phase=reflect
row per cycle's reflection to .cycle/metrics.csv (header:
date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes)
with net_score, prod_fixes, new_failure_modes; take the `cycle` value from
.cycle/STATE.md's Cycle field (the single source of truth — don't invent
one); leave the synthesis-only columns blank. Do NOT also record these on
an implement-phase row (the implement commands write STATE.md, not
metrics). Skip if no .cycle/.

ESTIMATE CALIBRATION (optional — only if .cycle/ exists): for each action
that carried an effort estimate, append a row to .cycle/estimates.csv
(header: date,cycle,action,estimate,estimated_hours,actual_hours,calibration_note)
recording the original S/M/L + estimated hours against the actual time
spent. End with one line on your calibration trend (e.g. "L items are
running ~2x the estimate"). Skip if no .cycle/.
```

### /health-pulse

```
Read CLAUDE.md (Cycle Workflow Config) before starting. Do not make any
changes to any files during this session.

[PASTE SYSTEMS MAP SUMMARY HERE]
[OPTIONAL: PRIOR SYNTHESIS SCORE OR KEY FINDINGS FOR REFERENCE]

Provide a Health Pulse — a directional snapshot on both axes. This is
lower-precision than a synthesis; never compare pulse scores to synthesis
scores.

AXIS A — VERTICAL (subsystem health): for each Health Dimension in the
Cycle Workflow Config, give a score /10 (or "Not assessed"), confidence
(High / Med / Low), one sentence of reasoning, and flag any
Low-confidence dimension whose audit is overdue.

AXIS B — HORIZONTAL (bug-shape posture): for each Axis B category in the
Cycle Workflow Config (default: Silent Degradation, Startup Ordering,
Operator-Only Gaps, Parallel Drift, Test Coverage Quality), give a quick
1–10 directional score and one sentence of evidence from CLAUDE.md,
recent commits, and code structure. Flag these as lower-confidence.

Close with:
- Anything materially worse since the last assessment?
- Which dimension/category should move up the audit queue?
- The one thing most likely to cause a problem before the next full cycle
- Which Axis B category you'd investigate first with one hour
```

### /systems-map

```
Read CLAUDE.md and README before starting. Do not make any changes to any
files during this session. Do not run audits or recommendations — this
session only maps architecture.

Produce a systems map in five phases:
1. ENTRY POINTS & STRUCTURE — server/client entry points, route
   registration, build/deploy entry, top-level directory roles
2. MODULE IDENTIFICATION — each module's responsibility and its startup
   assumptions (env vars, init order, singletons)
3. DATA FLOW — trace 3 critical paths end to end (e.g. a request, a job,
   an auth flow); note where data is transformed and persisted
4. DEPENDENCY MAP — high-fan-out modules and what depends on them;
   inter-module dependencies (this is the input to the §4 dependency check)
5. CROSS-REFERENCE VALIDATION — reconcile the map against the Subsystems
   section of CLAUDE.md's Cycle Workflow Config; flag mismatches

End with a 3–5 bullet SYSTEMS MAP SUMMARY suitable for pasting into
audit/plan/implement sessions, plus the inter-module dependency map.
```

### /roadmap

```
Read CLAUDE.md and README before starting. Do not make any changes to any
files during this session.

[PASTE SYSTEMS MAP SUMMARY HERE]
[OPTIONAL: SUMMARY OF RECENT AUDIT FINDINGS]

Produce a roadmap in four tiers. Ground Tiers 1–3 in specific findings,
gaps, or architectural realities — no ungrounded wishlist items. Tier 4
is explicitly exploratory.

Tier 1 — Short-term (days–weeks): concrete fixes / tech-debt from audits,
quick wins, anything blocking other work.
Tier 2 — Medium-term (weeks–months): structural improvements, feature
completions, integrations with clear scope.
Tier 3 — Long-term (months+): systemic changes, scaling, major new
capability areas grounded in the project's direction.
Tier 4 — Future possibilities (exploratory): directional ideas not
constrained by current architecture.

For Tiers 1–3: 3–5 items each with a one-line rationale and an effort
estimate (S/M/L + rough time). For Tier 4: 3 distinct directions, a short
paragraph each. End with the one strategic bet you'd prioritize if
resources were limited, and why.
```

### /test-sync

```
Read CLAUDE.md before starting.

[PASTE THE IMPLEMENTATION SUMMARY from the cycle, if available]

Post-implementation test quality assessment AND failure resolution. Lead
with coverage/quality, not just fixing reds.

Step 1 — Run tests (Test Command from CLAUDE.md; if `manual`, walk the
Regression Scenarios) and classify each failure:
- A: outdated assertion (fix)
- B: test redefines a production value locally (rewrite to import it)
- C: pre-existing failure (fix if in scope)
- D: real production bug caught by a correct test (flag only, defer)
- E: infrastructure issue (fix)

Step 2 — Fix A, B, C, E in priority order. Do NOT "fix" a D by weakening
the test.

Step 3 — Coverage gap analysis (runs even if all tests pass): for every
change in the implementation summary, does a test exist that would FAIL
if the change regressed? For each gap, describe what's untested, classify
simple (<30 min) or complex, implement the simple ones now. Report the
Category D ratio (fixes with no regression test / total fixes). Where an
invariant defines a Verify test, confirm it exists and runs.

Step 4 — Test quality: flag tests that pass both before and after a fix
(no regression value), tests asserting on mock/stub behavior rather than
production behavior, and assertions so broad they'd pass regardless of
the code under test. Mark each salvageable (tighten) or rewrite.

Step 5 — CI config check (typecheck, lint, build wired and green).

Report: fixes made, remaining failures by category, coverage gaps and the
Category D ratio, and quality issues found.
```

### /sync-docs

```
Read CLAUDE.md and README before starting.

[PASTE THE IMPLEMENTATION SUMMARY / recent changes, if available]

Detect (and, with approval, fix) documentation drift via four checks:
1. CLAUDE.md currency — are listed Known Issues / Common Gotchas still
   true? Remove or update resolved ones; add new gotchas this cycle
   surfaced.
2. Subsystem file-reference currency — do the file lists in the Cycle
   Workflow Config Subsystems section still match the tree? Flag moved /
   renamed / deleted paths.
3. Operator state inventory — any new manual setup (env vars, one-time
   migrations, deploy steps) that isn't documented? Add it.
4. Implementation drift — do recent changes match what the docs / README
   describe? Reconcile.

Produce a list of proposed doc edits (file → what changes and why), then
ask for approval before writing any files.
```

---

## Tier 3 — Additional Cycle Types

### Verification Pass (Section 4v in HTML tool)

Independent verification in a fresh session with no implementation context. Produces a VERIFICATION BLOCK with:
- Invariant probe results (re-probes cycle-touched + 5 random from library; for invariants whose `Verify:` is a runnable command, `scripts/invariant-check.mjs` probes them automatically)
- Regression count (hard definition: worse under realistic load = regression)
- Cycle execution quality (3 yes/no facts with evidence)
- Coverage gap report (Category D candidates — fixes without regression tests)

### Seams & Invariants Audit (Section 1s in HTML tool)

Runs every 3-4 subsystem cycles. No implementation phase. Produces:
- Seam inventory (boundaries between subsystems, explicit vs implicit contracts)
- Invariant validation (PASS/FAIL/STALE/UNVERIFIABLE for each library entry)
- Invariant discovery (new rules from seam analysis; assign INV-N = library max + 1, never reuse a number)
- Horizontal bug-shape observations (evidence for Axis B scoring)

### Health Synthesis (Section 6a in HTML tool)

Full benchmarkable assessment after a complete cycle. Takes 3 inputs per subsystem (Session Handoff + Cycle Summary + Verification Block). Produces:
- Two-axis grid (Axis A vertical + Axis B horizontal)
- Weighted average (secondary signal)
- Delta summary vs prior cycle
- Policy response triggers (Axis B category at threshold for consecutive cycles)

---

### /sync-commands

```
If $ARGUMENTS is empty or missing, respond with exactly this and stop:

Usage: /sync-commands <path-or-url-to-workflow-tools-repo>
Example: /sync-commands ../claude-workflow-tools
Example: /sync-commands ~/projects/claude-workflow-tools
Example: /sync-commands https://github.com/user/claude-workflow-tools

Accepts either a local filesystem path or a GitHub repository URL.

This command syncs your project's .claude/commands/ files with the
latest templates from the workflow tools repo.

---

Do not make any changes to any files until the comparison is complete.

You are syncing this project's command files with the latest templates.

Step 0: Read the template repo's VERSION file and the top entry of its
CHANGELOG.md (local path or raw URL). Report the template version and the
most recent changelog entry up front, so the operator knows what they are
syncing to and what changed. If a VERSION/CHANGELOG is not found, note
that and continue.
Step 1: Read the template CLAUDE.md.
If $ARGUMENTS is a local path: read $ARGUMENTS/CLAUDE.md directly.
If $ARGUMENTS is a URL: fetch the raw CLAUDE.md from the repository
  (e.g. https://raw.githubusercontent.com/.../main/CLAUDE.md).
If neither works, stop and report the error.
Step 2: Read all command files in this project's .claude/commands/
Step 3: For each command file, compare against the corresponding
template in the workflow tools CLAUDE.md.

For each command, report:
- CURRENT: matches template (no action needed)
- OUTDATED: template has structural changes not in this version
  [list specific differences — new steps, changed instructions,
  added output sections, modified classification categories]
- MISSING: template exists but this project has no command file for it

Step 4: Verify this project's CLAUDE.md has a "Cycle Workflow Config"
section with: Test Command, Health Dimensions, Subsystems, Invariant
Library, and Policy Configuration. Flag any missing sections.

Additionally:
- If Test Command is `manual`, verify a `Regression Scenarios`
  section exists and is non-empty. Flag as a config error if missing.
- If Test Command is a real command (e.g., `npm test`), `Regression
  Scenarios` is optional. If present, note that it augments
  programmatic test runs — commands walk scenarios after tests pass.
- If a `Frozen Subsystems` section exists, verify each listed name
  matches a subsystem in the `Subsystems` section. Flag any mismatches
  as warnings (the reference is broken).
- If a `Deploy Command` section exists, verify each subsystem name
  on the left side of the mapping matches a subsystem in the
  `Subsystems` section. Flag any mismatches as warnings.

Step 5: For each OUTDATED command, produce the updated file content.
The commands are project-agnostic (they reference CLAUDE.md config,
not inline project-specific content), so the update is a direct copy
from the template — no merging needed.

After the comparison, ask for approval before writing any files.
```

---

## Cycle Navigation Commands

These read the optional `.cycle/` state directory (see "Cycle State &
Memory" above). They are additive: with no `.cycle/` directory, `/cycle-status`
still reports from CLAUDE.md + PROJECT_HEALTH.md, and `/cycle-resume` simply
tells you there is nothing to resume.

### /cycle-status

```
Do not make any changes to any files during this session. This is a
read-only status check — do not start any audit or implementation.

Read the project's current cycle state, in this order (skip any that
don't exist):
1. CLAUDE.md Cycle Workflow Config (subsystems, invariants, policy config)
2. PROJECT_HEALTH.md (score history / current standing)
3. .cycle/STATE.md (in-progress work)
4. .cycle/metrics.csv (per-cycle trend)

Produce a CYCLE STATUS report:
- Current standing: [latest synthesis scores / one-line health, or
  "no synthesis recorded yet"]
- Active cycle & phase: [from STATE.md's Cycle field — the single source of
  truth; flag if any metrics.csv row's cycle disagrees with it]
- In-progress work: [what's partially done + the next concrete step,
  or "none"]
- Open follow-on items: [list, or "none"]
- Trend: [direction from metrics.csv if present, or "n/a"]
- RECOMMENDED NEXT ACTION — choose explicitly:
  → RESUME — there is unfinished implementation work in STATE.md →
    run /cycle-resume
  → FRESH AUDIT — the last cycle is complete (or none is in progress) →
    start /broad-scan or /targeted-audit <subsystem>
  State which and why in one sentence. A fresh audit must use fresh
  eyes — it does NOT inherit prior findings as conclusions.
```

### /cycle-resume

```
You are RESUMING an in-progress implementation thread — you are NOT
starting a new audit.

Read .cycle/STATE.md. If it does not exist or shows no in-progress /
pending work, STOP and respond exactly:
"Nothing to resume. Start a fresh audit with /broad-scan or
/targeted-audit <subsystem>."

Also read this substrate (safe to carry forward): CLAUDE.md (Cycle
Workflow Config, Common Gotchas, systems map if present) and the
invariant library.

TWO MEMORY CHANNELS — observe the boundary:
- Carry forward FACTS + SUBSTRATE: what was changed, what is pending,
  decisions already made, the systems map, invariants, gotchas.
- Do NOT treat the prior session's findings or severity judgments as
  authoritative. You are continuing agreed work, not re-auditing. If
  you notice something that looks like a new finding outside the
  pending work, record it as a follow-on item — do not expand scope.

Continue the pending actions listed in STATE.md, in order, under the
same scope discipline as /implement:
- Implement only the pending actions. Stop on unexpected complexity and
  describe before continuing. Check Common Gotchas before each action.
- After each action, update .cycle/STATE.md (move the item from Pending
  to Completed, refresh "Where I left off").

When pending work is complete (or you must stop), update
.cycle/STATE.md, run the test step per CLAUDE.md's Test Command (or walk
the Regression Scenarios if `manual`), then emit the same
implementation summary block the original implement command would have.
Suggest /regression, /reflect, /test-sync, and /sync-docs as applicable.
```

### /cycle-init

```
Scaffold the optional .cycle/ state directory for this project so the
file-backed workflow (the implement commands' CHECKPOINT, /cycle-status,
/cycle-resume, and per-cycle metrics) works. Create only what is
missing — NEVER overwrite or modify a file that already exists.

1. If .cycle/ does not exist, create it.
2. If .cycle/STATE.md does not exist, create it from the template in
   CLAUDE.md's "Cycle State & Memory" section, with Phase: idle and a
   "Where I left off" line pointing at the first audit.
3. If .cycle/metrics.csv does not exist, create it with just the header:
   date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes
4. If .cycle/estimates.csv does not exist, create it with just the header:
   date,cycle,action,estimate,estimated_hours,actual_hours,calibration_note
5. If PROJECT_HEALTH.md does not exist at the repo root, create it from
   the §7 template (Current Standing + an empty Score History).

Report which files were created and which already existed. If the
project has no Cycle Workflow Config yet, suggest running /setup-cycle
first. Remember: deleting .cycle/ at any time reverts to the pure
copy-paste workflow with no loss.
```

---

## Optional: Dynamic Workflows Acceleration (Opus 4.8+)

An **optional accelerator, not a dependency.** Every command above runs
unchanged on a single session per phase; if Dynamic Workflows isn't
available or the project doesn't fit, ignore this section.

Dynamic Workflows (research preview) lets one orchestrator plan a task
and fan out parallel subagents (≤16 concurrent, 1,000 total), verifying
their output against the test suite. It is the automated form of the
audit → plan → implement → verify chain these commands drive by hand.

Use it ONLY when all hold:
- The project has a real test suite (`Test Command` ≠ `manual`) — it is
  the verification bar; with no programmatic bar, don't use it to implement.
- The work is genuinely parallel (broad scan across many independent
  subsystems, or a codebase-scale migration), not judgment-bound.
- Throughput is the goal and a wrong autonomous change is bounded by
  tests + review.

Do NOT use it when `Test Command: manual`, the project is small, the
cycle's value is the human judgment gates, or subsystem boundaries /
invariants are still being calibrated.

Mapping: per-subsystem audit subagents fan out `/broad-scan` or `/audit`
(`/setup-cycle` already lists them); a verifier subagent with no
implementation context IS the §4v Independent Verification (refute →
converge); handoff blocks become the orchestrator's state instead of
copy-paste between sessions.

Non-negotiable human gates that stay manual even when orchestrated:
(1) operator approves which findings to implement, (2) the
pre-implementation dependency check runs before High/Very High risk
changes, (3) triggered policy responses are mandatory next-cycle scope.

Treat Dynamic Workflows as a delivery mechanism for these prompts, not a
replacement for them. Research preview — expect semantics to shift.

---

## Handoff Block Formats

### SESSION HANDOFF BLOCK
```
---SESSION HANDOFF BLOCK---
Scope: [subsystem group name]
Files covered: [comma-separated list]
Audit confidence: [High / Medium / Low]

FINDINGS:
[ID] | [File: function/line] | [Severity] | [Confidence] | [Effort] | [Description]

CROSS-MODULE DEPENDENCIES SURFACED:
- [dependency description]

OPERATOR ACTIONS SURFACED (manual / out-of-PR steps this scope depends on — env vars, IaC, console/dashboard, one-time migrations):
- [action] | BLOCKS DEPLOY: Y/N
(or "None")

TOP PRIORITIES:
Impact: [finding IDs]
High-leverage: [finding IDs]

RECOMMENDED PLANNING STARTING POINT: [one sentence]
---END HANDOFF BLOCK---
```

### TIER 2 HANDOFF BLOCK
```
---TIER 2 HANDOFF BLOCK---
Scope: [subsystem]
Findings: [count] — [severity breakdown]
Production bugs: [count]

ACTIONS (implement in this order):
[ID] | [File: area] | [Effort] | [Risk] | [Description]

CROSS-MODULE RISKS:
- [risks or "None"]

OPERATOR ACTIONS SURFACED (manual / out-of-PR steps; mark deploy blockers):
- [action] | BLOCKS DEPLOY: Y/N
(or "None")

DO NOT TOUCH:
- [high-risk items or "None"]
---END TIER 2 HANDOFF BLOCK---
```

### VERIFICATION BLOCK
```
---VERIFICATION BLOCK---
Verified scope: [subsystem]
Verification date: [date]

INVARIANT PROBE RESULTS:
INV-XX | [description] | PASS/FAIL/UNVERIFIED | [evidence]
Probed: [N] | Passed: [N] | Failed: [N] | Unverified: [N]

REGRESSION COUNT:
Regressions found: [N]
Net score: [fixed] − [regressions] = [net]

CYCLE EXECUTION QUALITY:
Tests run to completion: YES/NO
Common Gotchas cross-checked: YES/NO
New Common Gotchas added: YES/NO

COVERAGE GAP REPORT:
Fixes with regression tests: [N of M]
Category D ratio: [X%]
---END VERIFICATION BLOCK---
```
