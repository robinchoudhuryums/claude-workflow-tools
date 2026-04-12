# Claude Workflow Tools — Prompt Templates

Project-agnostic template versions of all slash command prompts. Copy and adapt for new projects by replacing `[PLACEHOLDER]` values with project-specific subsystems, dimensions, and file lists.

## Adaptation Checklist

When setting up a new project:

1. Run `/setup-cycle` to generate the Cycle Workflow Config
2. Add the config to your project's CLAUDE.md (see format below)
3. Copy the command files from this repo's CLAUDE.md into `.claude/commands/` — they are project-agnostic and reference the config in CLAUDE.md, no placeholder replacement needed
4. Run `/sync-commands` periodically to check for template updates

## Cycle Workflow Config (add to each project's CLAUDE.md)

This section is produced by `/setup-cycle` and consumed by all command files. Commands reference it by reading CLAUDE.md at the start of each session.

```
## Cycle Workflow Config

### Test Command
npm test

### Health Dimensions
Overall, Architecture & Code Quality, Security & Compliance, ...

### Subsystems
Core Architecture & Pipeline:
  server/index.ts, server/routes.ts, server/middleware/
Storage Layer / Database:
  server/storage.ts, server/db/
(repeat for each subsystem)

### Invariant Library
INV-01 | Rule text here | Subsystem: Core Architecture
INV-02 | Rule text here | Subsystem: Security
(repeat for each invariant)

### Policy Configuration
Policy threshold: 4/10
Consecutive cycles: 2
```

## Canonical Definitions

These definitions are used consistently across all commands:

**Production bug:** A behavior that would cause incorrect results, data loss, security exposure, or user-visible failure under current usage patterns OR reasonably anticipated growth. Scale-related findings should note the threshold at which they'd fire — the effort to fix should be proportionate to how soon that threshold is realistic.

**Regression:** Any behavior change where the post-cycle state is worse under any realistic load than the pre-cycle state, whether documented as a "tradeoff" or not.

**Test fallback:** If the test suite cannot run (missing DB, API keys, dependencies), note why and perform a manual regression check with extra thoroughness. Flag the test gap as a follow-on item.

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
6. Test configuration and existing test files (scan for patterns)

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
[test runner command, e.g. npm test]

### Health Dimensions
[dim1], [dim2], [dim3], ...

### Subsystems
[Subsystem Name]:
  [comma-separated file list]
(repeat for each subsystem)

### Invariant Library
INV-XX | [rule text] | Subsystem: [name]
(repeat for each invariant)

### Policy Configuration
Policy threshold: [N]/10
Consecutive cycles: [N]

OUTPUT 2 — CYCLE ROTATION PLAN (for operator reference):

Recommended first subsystem to audit: [name — why]
Recommended cycle order: [ordered list with rationale]
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

DO NOT flag code for "simplification" or "cleanup" unless the current
code is actively wrong or creates a maintenance trap. Working code
that could be written differently is not a finding.

After the broad pass, provide ratings out of 10 with reasoning for
each dimension listed in the "Health Dimensions" section of CLAUDE.md's
Cycle Workflow Config. One bullet per dimension.

For each rating include:
- Your confidence level (did you deeply read this area or infer from partial context?)
- The single finding most dragging the score down
- The single highest-leverage improvement and its estimated effort (S/M/L)

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
- [Gap] — [impact on users] — [effort: S/M/L]
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

After all fixes are complete, do the following in order:

1. RUN TESTS
Run the test suite (use the test command from CLAUDE.md's Cycle Workflow
Config, or `npm test` if not specified). Note the result. If tests fail, classify:
- Caused by this session's changes (fix now)
- Pre-existing (note but don't fix)
- Real production bug exposed by correct test (flag as follow-on, don't fix here)

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

FOLLOW-ON ITEMS:
- [anything noticed but not fixed, out of scope]
(or "None")

DOCUMENTATION UPDATES NEEDED:
- [any CLAUDE.md, README, or inline doc changes needed]
(or "None")
---END BROAD SCAN IMPLEMENTATION SUMMARY---

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

After all actions complete:

1. RUN TESTS — classify failures (this session / pre-existing / real bug)
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

FOLLOW-ON ITEMS:
- [File: area] — [what to check and why]
(or "None")

DOCUMENTATION UPDATES NEEDED:
- [updates or "None"]
---END TARGETED IMPLEMENTATION SUMMARY---

Suggest /test-sync and /sync-docs if applicable.
```

---

## Tier 3 Commands

### /audit

See the HTML tool (Section 1 — Layered Audit) for the full prompt. The key differences from `/targeted-audit`:
- Produces a SESSION HANDOFF BLOCK (not a Tier 2 Handoff Block)
- Does NOT include an implementation plan (that's `/plan`)
- Includes optional inputs for policy response triggers and seams audit focus
- Includes 12 audit focus areas (bugs, dead code, test gaps, stale artifacts, hardcoded values, security, docs drift, code quality, parallel truth sources, startup assumptions, silent degradation, operator-only state)

### /plan

Takes a SESSION HANDOFF BLOCK and produces an IMPLEMENTATION HANDOFF BLOCK with:
- Prioritized actions (do immediately / do this week / defer)
- Batch splitting for >15 findings
- Architectural decisions with options and tradeoffs
- Documentation update checklist
- Implementation ordering with rationale

### /implement

Takes an IMPLEMENTATION HANDOFF BLOCK and executes it with:
- Pre-implementation dependency check for High/Very High risk actions
- Scope discipline (only listed actions)
- Test suite check (Category A/B/C failures)
- IMPLEMENTATION SUMMARY BLOCK output

### /regression

Takes an IMPLEMENTATION SUMMARY BLOCK and:
- Identifies affected modules outside the changed scope
- Validates each risk (materialized or negated)
- Cross-references against invariant library
- Produces FOLLOW-ON AUDIT ITEMS block

### /reflect

Post-cycle assessment with:
- Two binary questions per action (production bug? new failure mode?)
- Three-way classification: production fix / new capability or feature / defensive improvement
- Net score tally with severity breakdown
- Invariant growth (new rules for the library)
- Honest impact summary
- CYCLE SUMMARY BLOCK output (consumed by Health Synthesis)

### /health-pulse

Quick directional snapshot on both axes:
- Axis A: vertical subsystem health scores with confidence
- Axis B: lightweight bug-shape posture scan (5 categories)
- Closing questions focused on risk and investigation priority

### /systems-map

Five-phase read-only architectural analysis:
1. Entry points and project structure
2. Module identification with startup assumptions
3. Data flow tracing (3 critical paths)
4. Dependency map construction
5. Cross-reference validation

### /roadmap

Four-tier strategic planning:
- Tier 1 (days-weeks): grounded in audit findings
- Tier 2 (weeks-months): structural improvements
- Tier 3 (months+): capability expansions
- Tier 4 (exploratory): not constrained by current architecture

### /test-sync

Post-implementation test quality assessment and failure resolution. Leads with coverage and quality analysis, not just failure fixing:

**Step 1: Run tests and classify failures** into 5 categories:
- Category A: outdated assertions (fix)
- Category B: tests with local redefinitions (rewrite to import production values)
- Category C: pre-existing failures (fix if scoped)
- Category D: real production bugs caught by correct tests (flag only, defer)
- Category E: infrastructure issues (fix)

**Step 2: Fix categories A, B, C, E** in priority order

**Step 3: Coverage gap analysis** (primary value — runs even if all tests pass):
- For every change in the implementation summary: does a test exist that would fail if the change regressed?
- For each gap: describe what's untested, classify as simple (<30 min) or complex, implement simple ones immediately
- Category D ratio: what percentage of fixes have no regression test?

**Step 4: Test quality check** (new):
- Flag tests that pass both before and after a fix — they don't guard against regression
- Flag tests that assert on mock/stub behavior rather than production behavior
- Flag tests with assertions so broad they'd pass regardless of the code under test
- For each quality issue: is the test salvageable (tighten assertion) or should it be rewritten?

**Step 5: CI configuration check** (TypeScript, ESLint, build)

### /sync-docs

Four-check documentation drift detection:
1. CLAUDE.md currency (known issues still present?)
2. Subsystem file reference currency (paths correct?)
3. Operator state inventory (undocumented manual setup?)
4. Implementation drift (recent changes match docs?)

---

## Tier 3 — Additional Cycle Types

### Verification Pass (Section 4v in HTML tool)

Independent verification in a fresh session with no implementation context. Produces a VERIFICATION BLOCK with:
- Invariant probe results (re-probes cycle-touched + 5 random from library)
- Regression count (hard definition: worse under realistic load = regression)
- Cycle execution quality (3 yes/no facts with evidence)
- Coverage gap report (Category D candidates — fixes without regression tests)

### Seams & Invariants Audit (Section 1s in HTML tool)

Runs every 3-4 subsystem cycles. No implementation phase. Produces:
- Seam inventory (boundaries between subsystems, explicit vs implicit contracts)
- Invariant validation (PASS/FAIL/STALE/UNVERIFIABLE for each library entry)
- Invariant discovery (new rules from seam analysis)
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

Usage: /sync-commands <path-to-workflow-tools-repo>
Example: /sync-commands ../claude-workflow-tools
Example: /sync-commands ~/projects/claude-workflow-tools

This command syncs your project's .claude/commands/ files with the
latest templates from the workflow tools repo.

---

Do not make any changes to any files until the comparison is complete.

You are syncing this project's command files with the latest templates.

Step 1: Read the template CLAUDE.md from: $ARGUMENTS/CLAUDE.md
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

Step 5: For each OUTDATED command, produce the updated file content.
The commands are project-agnostic (they reference CLAUDE.md config,
not inline project-specific content), so the update is a direct copy
from the template — no merging needed.

After the comparison, ask for approval before writing any files.
```

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
