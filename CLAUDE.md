# Claude Workflow Tools — Prompt Templates

Project-agnostic template versions of all slash command prompts. Copy and adapt for new projects by replacing `[PLACEHOLDER]` values with project-specific subsystems, dimensions, and file lists.

## Adaptation Checklist

When setting up a new project, replace these placeholders throughout:

- `[PROJECT_SUBSYSTEMS]` — your subsystem names and file lists
- `[HEALTH_DIMENSIONS]` — your project's scoring dimensions (typically 10-15)
- `[TEST_COMMAND]` — your test runner (e.g., `npm test`, `pytest`, `cargo test`)

---

## Tier 1 Commands

### /broad-scan

```
Do not make any changes to any files during the audit phase.

Read CLAUDE.md (especially Common Gotchas and Key Design Decisions),
README, and the roadmap carefully before doing anything else.

This audit runs in two stages within this session. Complete Stage 1 fully before starting Stage 2.

═══════════════════════════════════════════
STAGE 1 — BROAD PASS
═══════════════════════════════════════════

Audit the codebase thoroughly. For each finding:
- State the issue, cite the file and function/line area
- Severity: Critical / High / Medium / Low
- Confidence: High / Medium / Low (flag if you only skimmed this area)
- Is this a bug that would actually fire in production this month,
  or a defensive/structural improvement? Be honest about which.

Focus on:
- Bugs and logic errors in currently-reachable code paths
- Security and compliance gaps (auth, sensitive data handling, audit logging)
- Inconsistencies between CLAUDE.md/docs and actual implementation
- Dead code, unused exports, stale TODOs only if they create confusion
- Silent degradation paths: places where failure is swallowed and the
  app continues with wrong results rather than surfacing an error

DO NOT flag code for "simplification" or "cleanup" unless the current
code is actively wrong or creates a maintenance trap. Working code
that could be written differently is not a finding.

After the broad pass, provide ratings out of 10 with reasoning:
[HEALTH_DIMENSIONS — one bullet per dimension]

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
Run the test suite ([TEST_COMMAND]). Note the result. If tests fail, classify:
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

Available subsystems:
[PROJECT_SUBSYSTEMS — list names only]

Example: /targeted-audit Security & Compliance

---

Read CLAUDE.md (especially Common Gotchas and Key Design Decisions)
before starting. Do not make any changes to any files during this session.

SUBSYSTEM FILE REFERENCE:
[PROJECT_SUBSYSTEMS — each name followed by its file list]

This session's scope: $ARGUMENTS
Use the file reference above to identify relevant files.

[OPTIONAL: PASTE ANY FOLLOW-ON ITEMS FROM A PRIOR SESSION]

[OPTIONAL: PASTE ANY POLICY RESPONSE TRIGGERED BLOCKS — if triggered,
these are MANDATORY scope additions]

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
- Net score tally
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

Post-implementation test failure resolution:
- Category A: outdated assertions (fix)
- Category B: tests with local redefinitions (rewrite)
- Category C: pre-existing failures (fix if scoped)
- Category D: real production bugs (flag only, defer)
- Category E: infrastructure issues (fix)
- Coverage gap analysis for recent changes

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
