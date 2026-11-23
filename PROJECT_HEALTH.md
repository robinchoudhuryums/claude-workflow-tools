# Project Health

## Current Standing
Last synthesis: 2026-11-20 (Cycle 8)
Overall (weighted avg): 8.9/10
One-line summary: The cycle that fixed what Cycle 7 broke and finished the cycle's own machinery — the hosted console's Fill fields buttons had been dead and its Copy button clipped on phones for five releases, now fixed; Phase, cycle roll, candidate numbering and close-out each have an owner; /verify, /seams-audit, /health-synthesis and /cycle-close run the whole loop from chat, which let the console be frozen. The mutation audit was made to prove only through output a mutation ADDED (37 of 104 signals had matched a passing run) and four guards that stayed green over their own rule were closed. Independent verification: 42/42 invariants PASS, 3 Low regressions (one uncounted by the cycle: the SessionStart hook command is POSIX-only and fails under PowerShell), and Category D 16% → 40% — F4, F5, F6 and the conditional-idle fix are caught only by the frozen console's --assert lock, which fails on drift between copies, not on the loss of a rule.
Top vertical priority: Guard & Tooling Coverage (8.0, ↓ from 8.5) — the lowest non-frozen dimension. The guards are better than ever at what they check; what they do not check is the content of the cycle's own command-text fixes. Console UI/UX & Accessibility (7.5) is lower but frozen and out of the audit queue unless unfrozen.
Top horizontal priority: Guard / Test Coverage Quality (7.5, ↓ from 8.0) — POLICY RESPONSE TRIGGERED (persistent laggard: lowest Axis B category in Cycles 5, 6 and 8, and fell). Silent Prompt Degradation also triggered (decline: 9.0 → 8.5 → 8.0).
Open live defect: on the frozen console only, none High — the Dashboard can show another repo's cached score (F22–F24), keyboard focus is lost after eight console actions (F32), and the console's own guards have false greens (F40, F47). Elsewhere: none failing. Closed in v1.53.0 (2026-11-23, on branch, after this synthesis): INV-73 (the §1s body now reads each project's Axis B categories), §4v independence vs the SessionStart hook (the hook carries facts only), both policy responses' guard halves (content checks INV-86–88), and the console lock (retired by decision — the console's prompts may now be out of date, and the page says so). The rest of the Silent Prompt Degradation response (FO-8-28) closed in v1.54.0: /verify and /health-synthesis stop with no reflect block, and the verification block has a fixed name. Operator decision (2026-11-20): Cycle 8 counts 10 production fixes under /reflect's own interface rule — net 10 − 3 = 7; 08-a-reflect.md's reading (6, net 6 − 2 = 4) is on record in its block and metrics row but not adopted. Cycle 7 still owes §4v and §6a. This block is LIVE STATUS read by the Dashboard, portfolio scripts and the SessionStart hook — update it whenever remediation closes what a synthesis reported (Cycle-6 F07).

## Score History

### Cycle 8 — 2026-11-20 — Synthesis
Scope this cycle: /broad-scan (48 findings) → fix Batches 1, 2, 3, 8, 9 + two follow-on rounds + expansion E2 (v1.44.0 → v1.51.0) → console frozen (Batches 4–7 and console-only items dropped) → /sync-docs → /reflect → §4v → §6a. Ten blocks in .cycle/blocks/. Delta is against Cycle 6: Cycle 7 was reflected but never verified or synthesized.

AXIS A — VERTICAL (Subsystem Health):
Overall: 8.5/10 (↓ from 9.0 — a High defect live on the public console for five releases; the cycle's own fixes are the least-guarded of any cycle) | Prompt Quality & Efficacy: 9.0/10 (held — the cycle runs from chat; /verify's first run worked but proceeded without a Cycle Summary Block) | Cross-Artifact Consistency: 9.5/10 (held)
HTML Console Correctness: 8.0/10 (↓ from 9.0 — F16/F18 High, live v1.39.0–v1.43.0, fixed; dropped findings F22–F24, F40, F47 still live; frozen)
Console UI/UX & Accessibility: 7.5/10 (↓ from 8.5 — F18 fixed but unguarded; F32 focus loss open; S5–S17 never walked; frozen)
Command Completeness & Coverage: 9.5/10 (held — four new commands; the scan report is still not persisted, R24) | Documentation Accuracy: 9.5/10 (held — two cycles of roadmap and live-status drift found and now guarded) | Config-Schema Robustness: 9.5/10 (held)
Guard & Tooling Coverage: 8.0/10 (↓ from 8.5 — mutation audit rebuilt, four guard false greens closed, 104 → 158 cases; Category D 16% → 40%)
Adaptability / Project-Agnosticism: 9.0/10 (held — INV-73 closed for the command path only; hook now POSIX-only)
Onboarding & Adoption Friction: 9.0/10 (↓ from 9.5 — picker descriptions gained; PowerShell hook breakage and a two-pass re-pull for v1.50.0)
Backward Compatibility: 9.0/10 (↓ from 9.5 — R1 unlabelled Verify note now fails; R3 hook under PowerShell) | State & Memory Integrity: 9.5/10 (held — lifecycle closed; candidate numbering worked on first live use; a parallel /reflect and /verify collided on a block letter)

AXIS B — HORIZONTAL (Bug-Shape Posture):
Cross-Artifact Drift: 9.5/10 (Stable — README ↔ Command Index locked; the console lock still mirrors every command change)
Silent Prompt Degradation: 8.0/10 (Degrading — fired five times: F16 dead fill forms, F19 flattened pastes, F3 pack corruption, a pack cut at 64 KB through a pipe, F2 a truncated Verify reporting PASS; all closed; INV-73 body still live)
Generated-Artifact Staleness: 9.0/10 (Stable — frontmatter and include expansion guarded; invariant TEXT staleness still unguarded: three widened hosts no longer describe the rules they carry, per /reflect's INV-83..85)
Backward-Compatibility Breakage: 8.5/10 (Degrading — R1 and R3, both Low, both documented)
Guard / Test Coverage Quality: 7.5/10 (Degrading, ↓ from 8.0 — guards much stronger; coverage of the cycle's own fixes much weaker)

Overall (weighted avg): 8.9/10 (equal weights across the 12 non-Overall dimensions, unchanged).
Verification: independent §4v (08-b-verification.md) — 42 invariants probed, 42 PASS, every Verify command executed, 78/78 mutation-proven across 158 mutations, plus 12 of the verifier's own injected defects, all caught; full 16-stage Test Command re-run green; 3 Low regressions; Category D 40%.
Net score: 10 − 3 = 7 (operator decision, 2026-11-20: the four console fixes F16 F18 F19 F21 count as production fixes under /reflect's interface rule). Not adopted: 08-a-reflect.md's 6 − 2 = 4, which demoted them because the console is rarely used and was frozen. Batch self-report was 10 − 2; the third regression (R3) was found by §4v.
Category D ratio: 40%
Key finding: three of the cycle's command-text fixes (F4, F5, F6) and one in-cycle correction are guarded only by the frozen console's mirror lock — delete the rule from every copy and every other check stays green.
Priority for next cycle: add content checks for the CYCLE OPEN rules, the conditional idle and the candidate-numbering source (INV-86..88), with mutations that remove the rule from all copies at once.
Delta from prior: Axis A down on six dimensions (both console dimensions, Guard & Tooling, Onboarding, Backward Compatibility, Overall), held on six; Axis B down on three (Silent Prompt Degradation, Backward-Compatibility Breakage, Guard/Test Coverage), held on two. Most of the decline is Cycle 7's work surfacing in Cycle 8.
Policy responses triggered: Guard / Test Coverage Quality (persistent laggard); Silent Prompt Degradation (decline)

### Cycle 6 — 2026-09-04 — Synthesis
Scope this cycle: /broad-scan (17 findings) → six implement batches (v1.26.0 → v1.29.0) → /regression → /reflect → post-reflect remediation (v1.30.0, v1.30.1) → §4v in a fresh session → the project's FIRST Seams & Invariants audit → remediation Batches 1-5 (v1.31.0, v1.32.0) → /sync-docs. Ten blocks in .cycle/blocks/, including the §4v and Seams blocks.

AXIS A — VERTICAL (Subsystem Health):
Overall: 9.0/10 (held) | Prompt Quality & Efficacy: 9.0/10 (↓ from 9.5 — INV-73 is a live prompt defect that demonstrably degraded this cycle's own Seams audit) | Cross-Artifact Consistency: 9.5/10 (held)
HTML Console Correctness: 9.0/10 (↑ from 8.5 — seven real defects closed incl. a High XSS and a panel dead for many releases; 188 ids, 0 duplicates, all 25 prompts render, browser-verified)
Console UI/UX & Accessibility: 8.5/10 (↑ from 7.0 — structural half strong and verified; perceptual half still never walked)
Command Completeness & Coverage: 9.5/10 (held) | Documentation Accuracy: 9.5/10 (held) | Config-Schema Robustness: 9.5/10 (held)
Guard & Tooling Coverage: 8.5/10 (↑ from 8.0 — library 58→72, 81 mutations, four unstated-property classes closed; not higher because the class fired four times in one cycle)
Adaptability / Project-Agnosticism: 9.0/10 (↓ from 9.5 — INV-73: a canonical body that cannot adapt to a project's configured categories)
Onboarding & Adoption Friction: 9.5/10 (↑ from 9.0 — F16: the console's Setup prompt was a pre-R18 copy; a new project got a config that could never score its interface layer)
Backward Compatibility: 9.5/10 (held) | State & Memory Integrity: 9.5/10 (↑ from 9.0 — STATE.md restored to template shape and guarded; blocks cycle-scoped and now required per release)

AXIS B — HORIZONTAL (Bug-Shape Posture):
Cross-Artifact Drift: 9.5/10 (Stable — every static prompt and dynamic builder locked, manifest coverage DERIVED, CI/Test-Command parity and the health-label contract now asserted)
Silent Prompt Degradation: 8.5/10 (Degrading — three instances closed (F11, F14, F16) but ONE remains live and known: INV-73)
Generated-Artifact Staleness: 9.0/10 (Stable — generators proven idempotent; invariant TEXT staleness remains unguarded, three stale rules found by audit rather than by a check)
Backward-Compatibility Breakage: 9.0/10 (Stable — dead-CSS removal verified against real class attributes, not raw text; readBlocks, metrics columns and legacy Axis B lines all still parse)
Guard / Test Coverage Quality: 8.0/10 (Improving, ↑ from 7.0 — third consecutive cycle the class fired, first cycle in which the project's own machinery caught every instance)

Overall (weighted avg): 9.2/10 (equal weights across the 12 non-Overall dimensions, unchanged).
Verification: independent §4v in a fresh session — 67 invariants executed and mutation-proven (75 mutations at the time), 66 PASS / 1 FAIL (INV-52, disclosed seed did not reproduce its own probes); 0 regressions from eleven candidates examined and rejected on evidence; all 16 stages re-run by the verifier at two commits; Category D 16%.
Cycle total: 16 − 0 (13 in the metrics row, which /reflect stamped before v1.30.0; +2 v1.30.0, +1 v1.31.0). ~15 defensive/structural — the batch-level counts and /reflect's re-tally overlap, which is itself the argument for R22.
Self-report accuracy: ONE correction (/reflect demoted F15 from production to defensive, 14 → 13) — down from four corrections in Cycle 5, and in the same conservative direction.
Policy: none triggered (lowest Axis B 8.0 vs threshold 4/10). SECOND cycle flagging the same rubric weakness — a fixed threshold of 4 cannot fire on a project whose scores sit between 7 and 9.5, so the "2 consecutive cycles" mechanism has never once engaged.

### Cycle 5 — 2026-07-27 — Synthesis
Scope this cycle: Tier-1 dogfood — /broad-scan (F01–F21) → five implement batches (v1.19.0 → v1.22.0) → /regression → /reflect ×2 → /sync-docs → R19 (v1.23.0) → §4v in a genuinely fresh session. No Session Handoff Block (Tier 1, not Tier 3); the finding set served that role.

AXIS A — VERTICAL (Subsystem Health):
Overall: 9.0/10 (↑ from 8.8) | Prompt Quality & Efficacy: 9.5/10 | Cross-Artifact Consistency: 9.5/10 (↑ from 9)
HTML Console Correctness: 8.5/10 (held — Cycle-4 concern closed, replaced by a live defect of the class the cycle claimed fixed)
Console UI/UX & Accessibility: 7.0/10 (NEW — First measurement)
Command Completeness & Coverage: 9.5/10 (↑) | Documentation Accuracy: 9.5/10 (↑) | Config-Schema Robustness: 9.5/10 (↑)
Guard & Tooling Coverage: 8.0/10 (↓ from 9.5) | Adaptability / Project-Agnosticism: 9.5/10 (↑)
Onboarding & Adoption Friction: 9.0/10 | Backward Compatibility: 9.5/10 (↑) | State & Memory Integrity: 9.0/10

AXIS B — HORIZONTAL (Bug-Shape Posture):
Cross-Artifact Drift: 9.5/10 (↑ from 8.5 — four real drift instances closed AND coverage derived rather than enumerated)
Silent Prompt Degradation: 9.0/10 (↑ from 8.5 — §T2b's pre-P7 prompt and F06's Axis B pulse loss both fixed + locked)
Generated-Artifact Staleness: 9.0/10 (stable) | Backward-Compatibility Breakage: 9.0/10 (stable)
Guard / Test Coverage Quality: 7.0/10 (↓ from 9.0 — declared closed, found open by verification, second cycle running)

Overall (weighted avg): 9.0/10 (equal weights across the 12 non-Overall dimensions, unchanged).
NOTE: the average rose while the cycle's most important dimension fell. Read the grid, not the average.
Verification: independent §4v in a fresh session — 24 invariants probed BY MUTATION (not by reading test names),
23 PASS / 1 FAIL (INV-20, false green at field level); 0 regressions, with the one feared regression
independently re-derived and rejected; all 13 stages re-run by the verifier; Category D 20%.
Self-report accuracy: the implementer over-reported production fixes in EVERY batch summary (four corrections
across the cycle — three caught by /reflect, one by §4v). Always in the same direction, always by counting
capabilities or guard work as fixes.
Policy: none triggered (lowest Axis B 7.0 vs threshold 4/10). Flagged as a rubric weakness — a category
over-scored twice running is invisible to a fixed threshold.

### Cycle 4 — 2026-06-16 — Synthesis
Scope this cycle: a fresh-eyes /broad-scan (Interactive Console §6a + Tooling & Sync Infra + Canonical Docs) → /broad-implement F1–F5 → /reflect, plus R16(S) and R15. Tier-1 dogfood flow (no separate §4v fresh-session verification; the implementer scored the qualitative axes, so Axis B confidence is Medium — the executable checks are objective).

AXIS A — VERTICAL (Subsystem Health):
Overall: 8.8/10 (↑ from 8.7) | Prompt Quality & Efficacy: 9.5/10 | Cross-Artifact Consistency: 9/10 (held, now guard-earned)
HTML Console Correctness: 8.5/10 | Command Completeness & Coverage: 9/10
Documentation Accuracy: 9/10 (↑ from 8.5) | Config-Schema Robustness: 9/10 (↑ from 8.5)
Guard & Tooling Coverage: 9.5/10 (↑ from 9) | Adaptability / Project-Agnosticism: 9/10
Onboarding & Adoption Friction: 9/10 (↑ from 8.5 — R15 status board) | Backward Compatibility: 9/10 (↑ from 8.5)
State & Memory Integrity: 9/10 (↑ from 8.5 — metrics double-count fixed + INV-33 guard)

AXIS B — HORIZONTAL (Bug-Shape Posture):
Cross-Artifact Drift: 8.5/10 (re-baselined from an over-confident 9 — a real drift, F1, existed in a non-generated builder; fix + guard 7 added, R16-full open)
Silent Prompt Degradation: 8.5/10 (the §6a silent double-count fixed + guarded; residual class = dynamic builders only marker-pinned)
Generated-Artifact Staleness: 9/10 | Backward-Compatibility Breakage: 9/10 (↑ from 8.5 — defensive_count schema parity guarded)
Guard / Test Coverage Quality: 9/10 (↑ from 8.5 — Category D 0%; +3 guard checks/tests this cycle)

Overall (weighted avg): 8.8/10 (weights unchanged).
Verification: 13-stage Test Command green; invariant-check 22/22 runnable PASS, 0 FAIL (13 MANUAL by design; 35 total, +INV-33/34/35). Regressions: 0. Net score across the span +1 (1 production fix F1 − 0 new failure modes; 3 defensive/structural; 1 new capability R15).
Category D ratio: 0% — every fix + new tool shipped with a fail-closed test (guard.test cases 7/8/9; portfolio-status.test/INV-35).
Key finding: dogfooding's intended payoff — a fresh-eyes audit caught a defect the prior two cycles' scoring missed. The §6a synthesis prompt instructed writing net_score on synthesis rows, violating the P1 ownership rule (v1.6.0) and silently double-counting the trend; it had already corrupted this repo's own metrics (cum net 10 vs true 8). Fixed, data corrected, and guard-enforced (checks 6+7) so it and the broader dynamic-builder drift class can't recur silently.
Priority for next cycle: HTML Console Correctness stays the lowest-confidence vertical (browser-only paths operator-verified). The structural frontier is R16-full — generate the dynamic console builders (§6a/§6b/§1s/§4v/Tier1/Tier2) from CLAUDE.md so they're equivalence-locked, not just marker-pinned. No policy action required.
Delta from prior: Overall +0.1 (8.7 → 8.8); six verticals +0.5 (State & Memory, Guard & Tooling, Config-Schema, Backward Compat, Documentation, Onboarding); Axis B Cross-Artifact Drift re-baselined 9 → 8.5 (honest correction, not a degradation).
Policy responses triggered: None (lowest Axis B = 8.5, far above the 4/10 threshold).

### Cycle 3 — 2026-06-08 — Synthesis
Scope this cycle: everything since the Cycle-1 synthesis (no Cycle-2 synthesis was recorded — only reflects + a pulse). Cycle-2 roadmap items R2/R4/R5/R6/R8/R9/R10/R14/R3 + Cycle-3 field proposals P1–P11 + R7 (/pr-review) and R13 (output-block harness); R11 considered and HELD (blocked on Dynamic Workflows GA).

AXIS A — VERTICAL (Subsystem Health):
Overall: 8.7/10 (↑ from 7.9) | Prompt Quality & Efficacy: 9.5/10 (↑ from 9) | Cross-Artifact Consistency: 9/10 (↑ from 7.5)
HTML Console Correctness: 8.5/10 (↑ from 8) | Command Completeness & Coverage: 9/10 (↑ from 8.5)
Documentation Accuracy: 8.5/10 (↑ from 8) | Config-Schema Robustness: 8.5/10
Guard & Tooling Coverage: 9/10 (↑ from 7.5 — top C1 priority, resolved) | Adaptability / Project-Agnosticism: 9/10
Onboarding & Adoption Friction: 8.5/10 (↑ from 8) | Backward Compatibility: 8.5/10
State & Memory Integrity: 8.5/10 (↑ from 8)

AXIS B — HORIZONTAL (Bug-Shape Posture):
Cross-Artifact Drift: 9/10 (↑ from 7) | Silent Prompt Degradation: 8.5/10 (↑ from 7.5)
Generated-Artifact Staleness: 9/10 (↑ from 8.5) | Backward-Compatibility Breakage: 8.5/10
Guard / Test Coverage Quality: 8.5/10 (↑ from 6.5 — top C1 priority, resolved)

Overall (weighted avg): 8.7/10 (weights unchanged — Cross-Artifact Consistency, Prompt Quality, HTML Console Correctness weighted highest).
Verification: 19/19 runnable invariants PASS, 0 FAIL (13 MANUAL by design); full 12-stage Test Command green. Regressions: 0. Net score across the span positive (R7, R13, and the P-fixes) with 0 new failure modes.
Category D ratio: ~0% this cycle (R13 shipped with a 7-case fail-closed test; R7's /pr-review is covered by the output-block harness asserting it emits its block). Cumulative trend: C1 33% → C2 ~17% → C3 ~0%, well under the 25% gate.
Key finding: both Cycle-1 priorities are resolved. R14 retired the HTML console's fourth-copy drift class (generated from CLAUDE.md + locked by --assert); R13 added output-block shape guarding (the structure→behavior extension of the sync guard); the Guard & Tooling subsystem went from least-covered to most-instrumented (7 regression-test files, an executable invariant runner, 12-stage Test Command).
Priority for next cycle: HTML Console Correctness is the lowest-confidence dimension because its browser-only paths (FSA, render) are operator-verified rather than headless-tested — that's the natural next coverage frontier. No policy action required.
Delta from prior: Overall +0.8 (7.9 → 8.7); largest movers Cross-Artifact Drift +2.0, Guard/Test Coverage Quality +2.0, Cross-Artifact Consistency +1.5, Guard & Tooling Coverage +1.5.
Policy responses triggered: None (lowest Axis B = 8.5, far above the 4/10 threshold).

### Cycle 1 — 2026-06-04 — Synthesis
Scope this cycle: Interactive Console (HTML) + Tooling & Sync Infrastructure (+ Canonical Templates via /sync-docs). Findings F01–F08 from the first dogfood /broad-scan.

AXIS A — VERTICAL (Subsystem Health):
Overall: 7.9/10 | Prompt Quality & Efficacy: 9/10 | Cross-Artifact Consistency: 7.5/10 (↑ from 6)
HTML Console Correctness: 8/10 (↑ from 7) | Command Completeness & Coverage: 8.5/10
Documentation Accuracy: 8/10 (↑ from 6.5) | Config-Schema Robustness: 8.5/10
Guard & Tooling Coverage: 7.5/10 (↑ from 6) | Adaptability / Project-Agnosticism: 9/10
Onboarding & Adoption Friction: 8/10 | Backward Compatibility: 8.5/10
State & Memory Integrity: 8/10 (↑ from 7.5)

AXIS B — HORIZONTAL (Bug-Shape Posture):
Cross-Artifact Drift: 7/10 [first measurement] | Silent Prompt Degradation: 7.5/10 [first]
Generated-Artifact Staleness: 8.5/10 [first] | Backward-Compatibility Breakage: 8.5/10 [first]
Guard / Test Coverage Quality: 6.5/10 [first]

Overall (weighted avg): 7.9/10 (weights: Cross-Artifact Consistency, Prompt Quality, and HTML Console Correctness weighted highest as the core value/risk; domain-stable dimensions nominal)
Verification: executable invariants probed green via the Test Command (INV-01,02,03,04,05,06,09,16,17,19,20 PASS); regressions found: 0. Net score: 2 production fixes (F01, F05) − 0 regressions = +2. NOTE: independent §4v not run in a fresh session — the implementer scored the qualitative axes, so Axis B confidence is Medium; the *executable* checks are objective.
Category D ratio: ~33% (F03 guard logic and F06 storageWarn lack dedicated regression tests; §1-audit focus-area parity is content-aligned but unguarded)
Key finding: dogfooding immediately surfaced a High-severity blind spot the outside-in review missed — the HTML console was a fourth, unguarded copy of the command prompts that had silently drifted (F02/F03), plus a genuinely broken archive Copy-content handler (F05).
Priority for next cycle: raise Test Coverage Quality — write regression tests for the guard logic and storageWarn, and converge the HTML prompts toward generation from CLAUDE.md (ROADMAP R3) so full prompt equivalence is guaranteed, not just marker-pinned. Then drive Category D below 25%.
Delta from prior: n/a (first synthesis).
Policy responses triggered: None (first measurement; no category at or below the 4/10 threshold).

## Pulse Check Log (directional only — do not compare to synthesis scores)
2026-06-04 — Cycle 2 (test-coverage priority): added a guard regression test (tests/guard.test.mjs) covering the F03 logic and a storageWarn assertion (F06), both wired into the Test Command + CI. Category D for the Cycle-1 fixes is now ~17% (under the 25% gate); the remaining gap is §1-audit content-parity, which is ROADMAP R3's domain. Directional read: Guard/Test Coverage Quality moved up (~6.5 → ~7.5); confirm at the next full synthesis.
