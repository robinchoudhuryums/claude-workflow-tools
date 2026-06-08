# Cycle State

## Current
Cycle: 3 — downstream field proposals (HIPAA RAG dogfooding) → template improvements
Phase: implement (P1/P5/P8/P9 @1.6.0; P7 @1.7.0; P2/P3 @1.8.0; P11 @1.9.0; P4 @1.9.1)
Scope: Canonical Templates & Docs (command bodies)
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/gen-html-prompts.test.mjs
Updated: 2026-06-04

## Downstream field proposals (from a HIPAA RAG dogfooding session)
- DONE (v1.6.0) P1 — metrics.csv net_score ownership pinned to phase=reflect.
- DONE (v1.6.0) P5 — /plan emits a separate IMPLEMENTATION HANDOFF BLOCK per batch.
- DONE (v1.6.0) P8 — test-vs-prod-path probe in /regression (step 4) + /implement dep check.
- DONE (v1.6.0) P9 — implement family scans test doubles before editing.
- DONE (v1.7.0) P7 — OPERATOR ACTIONS field across SESSION/TIER-2/IMPLEMENTATION handoff + the three SUMMARY blocks (subsumes DEPLOY STEP → OPERATOR ACTIONS / DEPLOY, keeping the Deploy command line). BLOCK-SCHEMA change → downstream re-pull (backward-tolerant). Handoff Block Formats ref + guard marker updated; console p1/p2/p3 regenerated.
- DONE (v1.8.0) P2 — finding IDs declared session-local in /audit; /reflect + Seams assign INV-N from library max.
- DONE (v1.8.0) P3 — cycle-number single source of truth (STATE.md Cycle) + increment rule; /reflect stamps metrics cycle from it; /cycle-status surfaces/flags it.
- DONE (v1.9.0) P11 — defensive_count secondary metric in metrics.csv (appended last, backward-compat); /reflect writes it, render-metrics surfaces it (def column + cumulative "secondary" line); net_score stays strict. Test covers new + old-file schemas.
- DONE (v1.9.1) P4 — command-pair parity GUARD in check-template-sync.mjs (implement family + audit family share-behavior markers) + guard.test 6th case. Maintainer-only (no command bodies changed; no downstream re-pull). Chosen over factoring (commands stay self-contained).
- CONCURRED, PENDING: P10 (seam cadence wired — M–L).
- DISAGREE: P6 (skip — rationale moot; template has no baseline test run).

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

## Roadmap progress (now at VERSION 1.5.0)
- DONE (headless) R14 (option a) — the console static §-prompts (p0,p1,p2,p3,p4post,p4reflect,p5) are now GENERATED from CLAUDE.md (gen-html-prompts.mjs --write) and LOCKED by --assert in the Test Command + CI (INV-29). Reconciliation needed no preambles: the canonical command bodies are self-contained; PH_RE confirmed Fill-fields tokens are neutral; <pre> tag balance unchanged (24/24); no <pre>/</pre> leakage. The drift class is retired for these prompts. REMAINING: a 5-minute BROWSER render spot-check (the only step that needs a browser) — open the file, confirm §0–§5 render cleanly, Fill fields detects placeholders, Copy works.
- DONE (headless) R3 — added IndexedDB persistence for the connected dir handle (survives reloads), explicit read/write permission checks (ensureRepoPermission), and auto-reconnect on load (restoreRepoFolder, no-op without FSA). Headless fallback regression test in check-html.mjs (INV-30). REMAINING (browser only): verify the real picker/Save→repo/Load←repo flow in a Chromium browser served over http://localhost (FSA is blocked on file://).
- DONE R8 — cross-project portfolio dashboard (scripts/portfolio.mjs); tests/portfolio.test.mjs (INV-27).
- DONE R4 — /cycle-init scaffolding command.
- DONE R5 — VERSION + CHANGELOG.md; /sync-commands version report; guard checks both (INV-23).
- DONE R10 — .cycle/estimates.csv + /reflect estimate-vs-actual step.
- DONE R6 — SessionStart context hook (scripts/cycle-context.mjs) + .claude/settings.json; tests/cycle-context.test.mjs (INV-24).
- DONE R2 — metrics report renderer (scripts/render-metrics.mjs); tests/render-metrics.test.mjs (INV-25).
- DONE R9 — executable invariant runner (scripts/invariant-check.mjs): runs command-style Verify fields, reports PASS/FAIL/MANUAL; tests/invariant-check.test.mjs (INV-26). On this repo: 12/12 runnable invariants PASS, 13 manual.
- DONE R14 — added to ROADMAP (generate HTML prompts from CLAUDE.md; distinct from R3).
- STOPPED R3 — FSA state-store convergence: browser-only (File System Access API needs a secure context + user gesture), unverifiable headless, Tier-3 (M–L).
  PLAN: in a browser session — add a "Connect repo folder" button (showDirectoryPicker), read/write .cycle/STATE.md + metrics.csv + PROJECT_HEALTH.md via FileSystemDirectoryHandle, fall back to localStorage when no handle/permission. Verify manually in a browser (FSA can't run headless). Keep export/import as the no-permission fallback.
- STOPPED R14 — generate the HTML console prompts from CLAUDE.md: per its own roadmap note this is "a templating job, not a copy". The console prompts use [PASTE …] placeholders + the Layered-Audit structure + Fill-field tokens; a mechanical transform from the slash-command bodies would DEGRADE them (regression risk), so a naive pass violates "don't make it worse".
  PLAN/DECISION NEEDED: choose the canonical direction first — either (a) author a real CLAUDE.md→console templating transform (handles placeholder/idiom differences) with a generated-vs-committed guard like gen-commands, or (b) decide the console prompts are their own canonical surface and instead strengthen the parity guard (current marker approach) rather than generate. This is a design decision, not a mechanical implement.

## Remaining roadmap (impact order, with effort)
R14 finish (browser: --write rewrite + reconcile + guard) · R3 finish (browser: verify FSA flow) · R7 PR-review counterpart (M, testable here) · R13 prompt-output harness (M) · R11 DW orchestrator (L, gated) · R12 multi-operator (L).

## Where I left off
v1.5.0; full Test Command green (10 stages incl. the R14 --assert lock).
R14 is functionally complete headless — console §-prompts generated from
CLAUDE.md + guarded; only a 5-min browser render spot-check remains. R3
is hardened (IndexedDB + permissions + fallback test); only the real FSA
flow needs a browser (serve over http://localhost). 30 invariants; the
runner now auto-probes ~14 (INV-29/30 are command-style Verify). Roadmap:
R1,R2,R4,R5,R6,R8,R9,R10,R14 done; R3 done-pending-browser. Open & testable
here: R7 (PR-review counterpart), the cheap runnable-Verify follow-on, or a
fresh §6a re-synthesis.
