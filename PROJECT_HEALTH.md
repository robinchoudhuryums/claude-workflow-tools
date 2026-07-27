# Project Health

## Current Standing
Last synthesis: 2026-06-16 (Cycle 4) — **scores below are NOT current; Cycle 5 shipped three releases and has not been synthesized**
Overall (weighted avg): 8.8/10 — as of Cycle 4; §6a has not run since
Unsynthesized since: Cycle 5 (v1.19.0 → v1.20.0), net +5 across three implement batches, 0 new failure modes, 0 regressions. Both Cycle-4 priorities below are CLOSED. Run §4v (fresh session) then §6a to re-score.
One-line summary: Cycle 5 ran a fresh-eyes /broad-scan (F01–F20), then shipped the R18 interface/visual audit lens, a security batch (a GitHub PAT was being serialized into state backups and into `.cycle/console-state.json`; six unescaped render sinks; silent clipboard failure), and a parity batch that put `/pr-review` and a Tier-1 implement prompt into the console and retired the last builder exemption — all nine dynamic builders are now locked with no report-only tier.
Top vertical priority: HTML Console Correctness — the Cycle-4 concern (browser-only render/FSA paths untested) is CLOSED, but Cycle 5 found the replacement: the test doubles are more permissive than reality. `check-html`'s element stub auto-creates any id, so a render writing to a mistyped element passes CI and renders empty in the browser (proven by mutation).
Top horizontal priority: Guard / Test Coverage Quality — an invariant with a runnable `Verify:` that exercises a helper rather than the rule reports a false PASS (INV-20 did, and was caught by hand, not by tooling). 31 runnable invariants have not been audited for the same defect.
Note: Cross-Artifact Drift's Cycle-4 concern ("dynamic builders marker-pinned, not generated; R16-full open") is CLOSED — R16-full shipped in v1.18.0 and the last exemption went in v1.20.0.

## Score History

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
