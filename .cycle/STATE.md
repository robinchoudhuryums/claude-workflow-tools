# Cycle State

## Current
Cycle: 3 — downstream field proposals (HIPAA RAG dogfooding) → template improvements
Phase: implement (P1/P5/P8/P9 @1.6.0; P7 @1.7.0; P2/P3 @1.8.0; P11 @1.9.0; P4 @1.9.1; P10 @1.10.0)
Scope: Canonical Templates & Docs + Tooling & Sync Infrastructure
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/gen-html-prompts.test.mjs
Subsystem cycles since last Seams audit: 0 (this repo runs broad-scan + roadmap/proposal batches, not strict subsystem rotation)
Updated: 2026-06-04

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
- DONE: R1 (dogfood), R2 (render-metrics), R4 (/cycle-init), R5 (VERSION/CHANGELOG), R6 (SessionStart hook),
  R8 (portfolio), R9 (invariant runner), R10 (estimates), R14 (console prompts generated from CLAUDE.md + --assert lock).
- DONE-PENDING-BROWSER:
  - R14 render — 5-min browser spot-check of §0–§5 (rendering, Fill fields, Copy).
  - R3 File System Access — verify the Connect/Save→repo/Load←repo flow in Chromium over http://localhost
    (headless parts done: IndexedDB persistence, permissions, fallback test).

## Decisions made (don't re-litigate)
- HTML console §-prompts are GENERATED from CLAUDE.md (gen-html-prompts) and locked by --assert; every command-body
  edit must run gen-commands + gen-html-prompts --write or CI goes red.
- Near-duplicate command pairs are kept honest by a parity GUARD (P4), not by factoring (commands stay self-contained).
- net_score stays a strict gate; hardening visibility comes from the separate defensive_count secondary signal (P11).

## Open follow-on items
- The two browser-verified steps above (R14 render, R3 FSA flow).
- Optional future: severity-weighted defensive signal (P11 shipped a count); expand parity markers (e.g. CHECKPOINT).
- Full §6a Health re-synthesis of Cycle 3 can run anytime (would show net + a non-zero defensive_count).

## Where I left off
v1.10.0; full Test Command green (10 stages). Cycle 3 (downstream field review) is fully implemented — P1–P11 done,
P6 declined. Remaining work is the two browser-only verifications (R14 render, R3 FSA) and an optional re-synthesis.
Downstream HIPAA-RAG project should re-pull 1.6.0→1.10.0 in one /sync-commands (P7 is the only block-schema change,
backward-tolerant; P11 optionally wants `,defensive_count` appended to that project's metrics.csv header).
