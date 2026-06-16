# Cycle State

## Current
Cycle: 4 — SYNTHESIZED (overall 8.8/10). Post-synthesis roadmap work in progress: R16 (dynamic-builder lock).
Phase: implement (R16 first increment shipped — §T1 locked + engine; §T2a/§T2b/§6b paused on a decision)
Scope: Interactive Console (HTML builders) + Tooling & Sync Infrastructure
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs
Subsystem cycles since last Seams audit: 1 (this repo runs broad-scan + roadmap/proposal batches, not strict subsystem rotation)
Updated: 2026-06-16

## R16 (dynamic-builder lock) — IN PROGRESS (v1.14.0)
- DONE engine — gen-html-prompts.mjs: renderDynamicPrompt (headless DOM-stub render) + canonicalCoverage
  (100%-canonical-line-presence) + DYNAMIC_MANIFEST (locked vs report-only); --assert gates locked builders;
  drift report shows per-builder coverage. 6 new test cases.
- DONE §T1 — buildTier1Text reconciled to 100% of /broad-scan (restored the canonical ratings sentence +
  frozen-subsystem line; injected dim list now follows the canonical sentence) and LOCKED (INV-36).
- PAUSED §T2a (56%) / §T2b (4%) / §6b (0%) — DECISION NEEDED. Measurement found canonical /targeted-implement &
  /health-pulse DELEGATE to sibling commands ("see /broad-implement Step 1"), so locking them as-is regresses the
  console's standalone prompts. Options: (a) expand those canonical bodies to standalone (changes slash-command
  text for ALL consumers + downstream re-pull) then lock; (b) keep richer console prompts, R16-S-marker-guarded only.
  §T2a (both standalone, just reworded) is lockable without that decision whenever wanted. Tracked report-only.
- Decision this session: locked only self-contained §T1; paused the rest rather than regress them (user chose
  "§T1 + engine now, pause rest"). Engine is reusable for the remaining builders once the (a)/(b) decision lands.

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

## Cycle 4 (broad-implement F1–F5) — COMPLETE (v1.12.1)
- DONE F1 — HTML §6a synthesis metrics step no longer writes net_score on the phase=synthesis row
  (owned only by phase=reflect, P1); writes only category_d_ratio + axis_b_lowest.
- DONE F2 — HTML §6a metrics header now the 11-col P11 schema (adds defensive_count).
- DONE F3 — .cycle/metrics.csv:4 Cycle-1 synthesis row blanked (was net_score=2,prod_fixes=2 double-count);
  render-metrics cumulative net 10→8 (9 fixes − 1).
- DONE F4 — check-template-sync.mjs structural check 6 (metrics ownership + defensive_count parity);
  guard.test.mjs +2 fail-closed cases.
- DONE F5 — README "What's in this repo" now lists all 9 scripts.
- VERSION 1.12.0→1.12.1; CHANGELOG entry added. Full 12-stage Test Command green.
- DONE R16 (S half, v1.12.2) — per-builder parity guard: check-template-sync structural check 7 pins the 6
  dynamic console builders (§6a/§6b/§1s/§4v/Tier1/Tier2) to load-bearing contract markers co-present in
  CLAUDE.md + HTML; guard.test 9th fail-closed case. Closes the residual F1 exposed. Maintainer-only → no re-pull.
  Promoted INV-33 (metrics ownership, check 6) + INV-34 (builder parity, check 7) into .cycle/config.md (now 34).
- DONE R15 (v1.13.0) — scripts/portfolio-status.mjs: cross-project development-status board joining
  PROJECT_HEALTH health with .cycle/ STATE (phase/in-progress/seams K/N+DUE) + metrics (net trend);
  ranks lowest-overall first, flags resume/seams-DUE, degrades to "—" with no .cycle/. tests/portfolio-status.test.mjs
  (INV-35, 16 assertions) wired into Test Command (now 13 stages) + CI. README/CLAUDE helper docs updated. Additive helper.

## Decisions made (don't re-litigate)
- The metrics-ownership rule (P1: net_score/prod_fixes/new_failure_modes owned ONLY by phase=reflect) is now
  guard-enforced, not just prose — closes the half-fixed footgun (command bodies were fixed in v1.6.0; the
  non-R14-generated HTML §6a builder was not, and had already corrupted this repo's own trend).

## Where I left off
v1.14.0; full Test Command green (13 stages); invariant-check 23/23 runnable PASS (36 total). R16 first increment
shipped: the dynamic-builder lock ENGINE (renderDynamicPrompt + canonicalCoverage in gen-html-prompts) + §T1
reconciled to 100% of /broad-scan and LOCKED by --assert (INV-36). §T2a/§T2b/§6b PAUSED on a real decision —
canonical /targeted-implement & /health-pulse delegate to sibling commands, so locking them as-is regresses the
console's standalone prompts (see the R16 section above + ROADMAP). Next options: settle the (a) expand-canonical /
(b) keep-console decision for §T2b/§6b; or lock §T2a now (standalone, just a reword); or open a PR for the branch.
