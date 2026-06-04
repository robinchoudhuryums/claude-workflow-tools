# Cycle State

## Current
Cycle: 2 — test-coverage priority (implement + reflect done; full synthesis deferred)
Phase: idle — pivoting to ROADMAP items next
Scope: Tooling & Sync Infrastructure + Interactive Console (HTML)
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node tests/guard.test.mjs
Updated: 2026-06-04

## In progress (facts to carry forward — NOT judgments)
- First broad-scan complete (8 findings F01–F08). F01–F03 implemented this session.

## Completed — Cycle 2 (test-coverage priority)
- tests/guard.test.mjs | regression test for the F03 guard logic — black-box: runs the real guard against a temp copy and asserts it fails closed on 4 kinds of injected drift. (INV-22)
- scripts/check-html.mjs | added a storageWarn assertion (F06): a thrown setItem must surface via console.warn. (INV-21)
- .cycle/config.md, .github/workflows/sync-check.yml | both new tests wired into the Test Command and CI.
- Result: Category D for the Cycle-1 fixes ~17% (under the 25% gate); remaining gap is §1-audit content-parity → ROADMAP R3.

## Completed — Cycle 1
- F01 | claude-code-guide-v2.html | HTML reflect prompt now emits a ---CYCLE SUMMARY BLOCK--- (the input §6a synthesis consumes).
- F02 | claude-code-guide-v2.html | HTML regression prompt gained invariant Verify-test + deploy-verified notes; §1 audit prompt converged to /audit's 12 focus areas + "fire this month?" + effort/time.
- F03 | scripts/check-template-sync.mjs, .cycle/config.md | guard pins HTML prompt-behavior parity + 7 workflow blocks; added INV-19.
- F04 | scripts/check-html.mjs, .cycle/config.md, .github/workflows/sync-check.yml | new automated HTML-JS coverage (syntax + builders + behavior), wired into Test Command and CI; INV-04/05/09 now executable via it.
- F05 | claude-code-guide-v2.html, .cycle/config.md | added esc() and escaped all stored/pasted content in innerHTML (archive, invariants, project/subsystem tables, form rows); fixed the broken archive Copy-content onclick (JSON.stringify in a double-quoted attribute); added INV-20.

## Pending / not yet done
- All 8 findings (F01–F08) from the first broad-scan are addressed. Cycle 1 complete and scored.
- Carry to Cycle 2 (priority from synthesis): raise Test Coverage Quality — write regression tests for the guard logic (F03) and storageWarn (F06); drive Category D below 25%.

## Open follow-on items
- RESOLVED: §1 audit reconciliation — HTML §1 (p1) now uses /audit's 12 focus areas + "fire this month?" + effort/time. (F02 complete.) Note: p1 focus-area parity is content-aligned but NOT independently guarded (recurs only under R3 convergence).
- The durable fix for the HTML-as-fourth-copy problem is ROADMAP R3 (generate the HTML prompts from CLAUDE.md). The F03 guard markers are a bounded mitigation, not the full solution.
- F07/F08 docs: F07 fixed via /sync-docs; F08 (HTML §-section prose non-exhaustive) left as optional polish.
- Tight guard markers add maintenance cost: intentionally rewording a guarded prompt requires updating both artifacts together (this is the guard working as designed, but worth knowing).

## Decisions made (so the next session doesn't re-litigate)
- Did NOT rewrite the §1 Layered Audit (p1) — flagged as a design decision rather than a mechanical sync (per /broad-implement "stop if more complex than expected").
- F03 implemented as marker + structural-block parity checks (bounded), not full HTML/CLAUDE.md generation convergence (that is R3).

## Roadmap progress (now at VERSION 1.1.0)
- DONE R4 — /cycle-init scaffolding command.
- DONE R5 — VERSION + CHANGELOG.md; /sync-commands version report; guard checks both (INV-23).
- DONE R10 — .cycle/estimates.csv + /reflect estimate-vs-actual step.
- DONE R6 — SessionStart context hook (scripts/cycle-context.mjs) + .claude/settings.json; tests/cycle-context.test.mjs (INV-24).
- DONE R2 — metrics report renderer (scripts/render-metrics.mjs); tests/render-metrics.test.mjs (INV-25).
- DONE R14 — added to ROADMAP (generate HTML prompts from CLAUDE.md; distinct from R3).
- STOPPED R3 — FSA state-store convergence: browser-only, unverifiable headless, Tier-3 (M–L). Needs its own plan + manual browser verification.

## Remaining roadmap (impact order, with effort)
R9 invariants-as-tests library (M–L) · R3 FSA state convergence (M–L, browser) · R14 generate HTML prompts from CLAUDE.md (M–L) · R7 PR-review counterpart (M) · R8 portfolio dashboard (M) · R13 prompt-output harness (M) · R11 DW orchestrator (L, gated) · R12 multi-operator (L).

## Where I left off
R6, R2, R14 shipped at v1.1.0; full Test Command green (gen --check +
check-html + sync guard + guard.test + render-metrics.test +
cycle-context.test). The SessionStart hook is dogfooded via
.claude/settings.json in this repo. Next: pick a remaining roadmap item
(R9 is the highest-impact testable-here one; R3 needs a browser). A full
§6a re-synthesis of Cycles 1–2 + roadmap work can run anytime.
