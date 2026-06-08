# Cycle State

## Current
Cycle: 3 — downstream field proposals (HIPAA RAG dogfooding) → template improvements — COMPLETE (synthesized)
Phase: idle (Cycle 3 synthesized 2026-06-08 — overall 8.7/10; next work starts Cycle 4)
Scope: Canonical Templates & Docs + Tooling & Sync Infrastructure
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs
Subsystem cycles since last Seams audit: 0 (this repo runs broad-scan + roadmap/proposal batches, not strict subsystem rotation)
Updated: 2026-06-08

## Downstream field proposals (Cycle 3 — HIPAA RAG dogfooding) — COMPLETE
- DONE P1 (1.6.0) — metrics.csv net_score ownership pinned to phase=reflect.
- DONE P5 (1.6.0) — /plan emits a separate IMPLEMENTATION HANDOFF BLOCK per batch.
- DONE P8 (1.6.0) — test-vs-prod-path probe in /regression + /implement dep check.
- DONE P9 (1.6.0) — implement family scans test doubles before editing.
- DONE P7 (1.7.0) — OPERATOR ACTIONS field across handoff/summary blocks (subsumes DEPLOY STEP). Block-schema change.
- DONE P2 (1.8.0) — finding IDs session-local; INV-N from library max.
- DONE P3 (1.8.0) — cycle-number single source of truth (STATE.md Cycle) + increment rule.
- DONE P11 (1.9.0) — defensive_count secondary metric (backward-compat; net_score stays strict).
- DONE P4 (1.9.1) — command-pair parity guard (maintainer-only; no re-pull).
- DONE P10 (1.10.0) — seams-audit cadence wired (config field + STATE counter + /audit & /cycle-status reminders).
- DISAGREE P6 — declined (template has no baseline test run; rationale moot).

## Roadmap (1.x) — status
- DONE: R1 (dogfood), R2 (render-metrics), R3 (FSA repo sync — browser-verified), R4 (/cycle-init),
  R5 (VERSION/CHANGELOG), R6 (SessionStart hook), R7 (/pr-review — v1.11.0), R8 (portfolio),
  R9 (invariant runner), R10 (estimates),
  R14 (console prompts generated from CLAUDE.md + --assert lock — browser-verified).
- R3 + R14 browser checks PASSED (render of §0–§5 clean; FSA Connect/Save/Load/reconnect/fallback all work).
  "Experimental/unverified" labels dropped.
- R7 (v1.11.0): /pr-review applies cycle rubrics to a single PR diff → PR REVIEW BLOCK; read-only,
  runs by hand or off a subscribe_pr_activity webhook event. New command → downstream re-pull (additive).
- R13 (v1.12.0): prompt-output regression harness — scripts/check-output-blocks.mjs validates block shape
  (balanced delimiters, required fields, producer emission, inline-vs-reference field drift) across all 10 workflow
  blocks; tests/check-output-blocks.test.mjs proves fail-closed. Wired into Test Command + CI (now 12 stages).
  INV-31/INV-32 added. Maintainer-only tooling → no downstream re-pull.
- Remaining roadmap: R11 (DW orchestrator — ⏸️ HELD, BLOCKED ON DW GA, decision 2026-06-08; advisory planner
  subset offered + declined, waiting for DW to leave research preview), R12 (multi-operator state — only open item).

## Decisions made (don't re-litigate)
- HTML console §-prompts are GENERATED from CLAUDE.md (gen-html-prompts) and locked by --assert; every command-body
  edit must run gen-commands + gen-html-prompts --write or CI goes red.
- Near-duplicate command pairs are kept honest by a parity GUARD (P4), not by factoring (commands stay self-contained).
- net_score stays a strict gate; hardening visibility comes from the separate defensive_count secondary signal (P11).
- R11 (DW orchestrator) is HELD until Dynamic Workflows leaves research preview — a live integration can't meet the
  verification bar in this environment and DW semantics will shift. Don't build it (even the planner subset) until DW GA.

## Open follow-on items
- Optional future: severity-weighted defensive signal (P11 shipped a count); expand parity markers (e.g. CHECKPOINT).
- Full §6a Health re-synthesis of Cycle 3 can run anytime (would show net + a non-zero defensive_count).
- Downstream HIPAA-RAG project: re-pull 1.6.0→1.10.x in one /sync-commands (P7 is the only block-schema change,
  backward-tolerant; P11 optionally wants `,defensive_count` appended to that project's metrics.csv header).

## Where I left off
v1.12.0; full Test Command green (12 stages). Cycle 3 SYNTHESIZED 2026-06-08 — overall 7.9→8.7/10 (+0.8); both
Cycle-1 priorities resolved (Guard & Tooling 7.5→9, Guard/Test Coverage Quality 6.5→8.5); 0 regressions; no policy
triggers. PROJECT_HEALTH.md Current Standing + Cycle-3 entry updated; metrics.csv synthesis row appended (Category D
0%). Roadmap essentially cleared: R7 done, R11 held (DW GA), R13 done; only R12 (multi-operator, exploratory) open.
Next work = Cycle 4 (a fresh audit with fresh eyes) or R12. Optional: downstream re-pull 1.6.0→1.12.0.
