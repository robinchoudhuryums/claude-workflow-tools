# Cycle State

## Current
Cycle: 5 — fresh /broad-scan run 2026-07-27 (F01–F20 raised, NOT yet implemented); R18 shipped from a separate operator question.
Phase: reflect COMPLETE — ALL 21 Cycle-5 findings closed (v1.19.0 → v1.22.0) and ALL batches reflected. Cycle-5 net +10 across 5 reflect rows. ONLY §4v (FRESH session) then §6a remain.
Scope: Canonical Templates & Docs + Interactive Console (§T1 builder) + Tooling & Sync Infrastructure
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs
Subsystem cycles since last Seams audit: 2 (this repo runs broad-scan + roadmap/proposal batches, not strict subsystem rotation; cadence 3 — not due)
Updated: 2026-07-27

## Cycle 5 — R18 interface/visual audit lens — ✅ COMPLETE (v1.19.0)
Shipped in 5 phases on branch claude/broad-scan-dyw3lo. Origin: operator observed the visual layer was not
explicitly in /broad-scan. Confirmed — across all 20 templates the entire UI/UX surface was ONE line, and that
line asks about *workflow* friction. Root causes: the verification bar (no proof surface for appearance — the
same discipline that HELD R11), origin domain (server-heavy built-ins; all 5 default Axis B categories are
backend shapes), and no scoring slot (interface defects answered NO to /reflect Q1 → defensive/structural →
excluded from net_score).
- P0 ROADMAP R18 recorded, incl. the deferral of the same lens for /audit + /pr-review.
- P1 (D1) /broad-scan Stage 3 INTERFACE & VISUAL LAYER: gated on a user-facing surface; (a) STRUCTURAL findings
  vs (b) PERCEPTUAL routed to OPERATOR VISUAL CHECKS in Regression-Scenario format; new INTERFACE FINDINGS +
  OPERATOR VISUAL CHECKS outputs; Q3 reworded UX→workflow friction. §T1 buildTier1Text mirrored, still
  --assert-locked at 100% coverage.
- P2 (D2) schema notes in all THREE copies (template block, /setup-cycle OUTPUT 1, console setup <pre>) —
  interface Health Dimension, optional "Visual / Interaction Regression Posture" Axis B, visual checks homed
  in Regression Scenarios. INV-16 parity held.
- P3 (D3) /setup-cycle Phase 1 profiles user-facing surfaces; Phase 4 proposes the interface dimension.
- P4 (D4) /reflect Q1 counts a user-visible interface defect as YES. p4reflect regenerated via --write.
- P5 guard: 2 R18 markers (lens heading AND the perceptual routing target — the (a)/(b) split is the
  load-bearing part) across CLAUDE.md/console/README; 2 fail-closed guard.test cases (now 11); INV-39 (39
  total); README "Interface & Visual Layer" section; VERSION 1.18.0→1.19.0 + CHANGELOG.
- Deliberate: D4 creates a net_score trend discontinuity at the 1.18.0 boundary — documented in CHANGELOG,
  nothing rewritten retroactively.
- The 3 unversioned post-1.18.0 console commits (tabbed nav, colour tokens, style classes) are noted as
  carried in the 1.19.0 entry rather than silently swept in.

## R16-full + HTML Console Correctness — ✅ COMPLETE (v1.18.0)
Closed both 8.5 synthesis priorities. Shipped in 6 phases (one commit each) on branch claude/stoic-hypatia-gf4y5u.
- W2 phase 1: check-html captures innerHTML per id → asserts render OUTPUT (subsys/invariant/cycle/dashboard), not just no-throw. Mutation-proven fail-closed.
- W2 phase 2: factored duplicated state-import logic (importStateFile + loadStateFromRepo) into shared stateBackupKeys/applyStateKeys; headless round-trip test (serialize→wipe→restore, ccg:*-scoped both sides). Mutation-proven.
- W1 phases 3-5: full textual lock of §4v, §1s, §6a. New sectionBody() extracts canonical body from a fenced block under a non-slash ### heading (no /command minted). Each carries its full canonical body in CLAUDE.md; 6/7 dynamic builders now --assert-locked at 100% coverage (only §T2b report-only). §6a lock pins the P1 metrics-ownership rule (the Cycle-4 F1 class) — mutation-proven fail-closed.
- Registered SEAMS & INVARIANTS AUDIT BLOCK + POLICY RESPONSE in check-output-blocks + homed in Handoff Block Formats (shape-guarded).
- Phase 6: sectionBody unit tests; check-template-sync markers kept as documented secondary layer; INV-36 updated (6 locked) + INV-38 added (blocks); roadmap reconciled (R4/R6/R8 DONE, R16-full DONE); VERSION 1.17.0→1.18.0.
- Engine generalization: DYNAMIC_MANIFEST entries resolve body via section OR command (dynBody/dynLabel).
- Follow-ons: none required. The marker pins could be fully retired later, but are cheap defense-in-depth.

## R17 (hosted-console UX) — ✅ COMPLETE (v1.17.0)
- Console now hosted on GitHub Pages (public repo → free); index.html redirect merged.
- DONE Dashboard — new landing section; live per-project status from GitHub (PROJECT_HEALTH.md + .cycle/STATE.md),
  fallback chain live→cached→self-reported→none; optional local-only PAT for private repos; per-card ⚙ repo/manual
  editor. Network deferred via setTimeout so headless check-html / --assert stubs never call fetch. Verified
  end-to-end against THIS repo's real files (parsed 8.8 + phase). Parsers locked by check-html (INV-37).
- DONE light/dark theme (chrome-only [data-theme] flip; persists ccg:theme; respects prefers-color-scheme).
- DONE mobile nav drawer (replaced nav{display:none} dead-end with hamburger + slide-in + backdrop).
- New localStorage keys: ccg:theme, ccg:dashRepos, ccg:dashCache, ccg:dashManual, ccg:ghToken.
- Follow-ons (not done): scroll-spy active-state on deep links; a11y keyboard pass on custom controls;
  Dashboard worst-first sort. Light mode needs an eyeball for contrast nits (no headless way to verify layout).

## R16 (dynamic-builder lock) — ✅ COMPLETE (v1.14.0–1.16.0)
- DONE engine — gen-html-prompts.mjs: renderDynamicPrompt (headless DOM-stub render) + canonicalCoverage
  (100%-canonical-line-presence) + DYNAMIC_MANIFEST (locked vs report-only); --assert gates locked builders;
  drift report shows per-builder coverage. 6 new test cases.
- DONE §T1 — buildTier1Text reconciled to 100% of /broad-scan (restored the canonical ratings sentence +
  frozen-subsystem line; injected dim list now follows the canonical sentence) and LOCKED (INV-36).
- DONE §T2a (v1.15.0) — buildTier2AuditText synced to 100% of /targeted-audit and LOCKED. It was a paraphrased,
  OLDER copy: had dropped the OPERATOR ACTIONS SURFACED block (P7) + the [IF TRIGGERED: policy-response] trigger,
  and reworded the rest. Both restored; manifest gained a `replace` map ($ARGUMENTS → [SUBSYSTEM GROUP NAME]) so
  the placeholder-substituting builder compares clean. 2 of 4 dynamic builders now locked.
- DONE §6b (v1.16.0) — buildP6bText synced to 100% of /health-pulse and LOCKED. Canonical /health-pulse is
  standalone (no delegation), so this was the §T1 pattern: mirror canonical prose, keep the console's injected
  concrete data (project dimensions + Axis B categories) as extras. 3 of 4 builders now locked.
- RESOLVED §T2b (v1.16.0, option (b)) — buildTier2ImplText stays report-only BY DESIGN. Canonical
  /targeted-implement delegates to /broad-implement Step 1; the console must be standalone, so the divergence is
  intentional. Locking would duplicate Step-1 detail into canonical (contradicts the "parity-guard, not factoring"
  decision). Guarded by R16-S parity markers instead of the textual lock.
- CORRECTION captured: §6b was a FALSE "blocked" — only §T2b genuinely delegates. The 0%/4% measurements
  conflated wording-drift (§6b, lockable) with intentional delegation (§T2b). Measurement found canonical /targeted-implement &
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

## Cycle 5 — broad-implement F01/F04/F05/F08 — ✅ COMPLETE (v1.19.1)
- F01 (Critical) — SECRET_KEYS/isSecretKey(): ccg:ghToken + any ccg:secret:* excluded from collectState() AND
  stateBackupKeys(), so a backup can neither exfiltrate a credential nor install one. Deny-by-default prefix so a
  future secret can't silently rejoin the wildcard. UI note corrected; .gitignore added for
  .cycle/console-state.json. OPERATOR: rotate any token that was exported/committed before this release.
- F04 (High) — six sinks escaped (renderCycle label + 2 handler args, renderSubsysTable, renderT2SubsysTable,
  renderProjectSelector, renderCustomInvariantsList, dashboardCard href + 2 handler args). The dashboardCard case
  was NOT in the audit: it already called esc() but inside '...' in an onclick, and esc() emits &#39; which the
  browser decodes back to ' before parsing — it looked escaped and wasn't. Audit under-counted 5 sinks → 6.
- F05 (Medium) — one copyToClipboard() with execCommand fallback + visible "Copy failed" button state.
- F08 (Medium) — real panel/nav fixtures in check-html; showPanel/handleHash now actually asserted (isolation,
  aria-current sync, unknown-id fallback, hash routing). The old [] stub made them vacuous.
- 9 new check-html assertions, ALL mutation-proven fail-closed. Escaping check is two-layered: substring scan for
  text + entity-decode-then-EXECUTE with a tripwire for inline handlers (a substring scan structurally cannot see
  the &#39; case). This retires INV-20's false green.
- INV-09 reworded; INV-40/41/42 added → 42 invariants, 29 runnable PASS.

## Cycle 5 — broad-implement Batch 1 (F03/F21) + Batch 2 (F02/F17) — ✅ COMPLETE (v1.20.0)
Ordering was load-bearing and is worth remembering: F17 turns three previously-unguarded blocks red, so the
console gaps had to close FIRST or the batch merges a red CI. Sequence run: F03 → F21 → F02 → F17.
- F03 — PR Review console section + buildPrReviewText (invariant library injected). Was absent for 4 releases.
- F21 — Tier 1 broad-implement prompt + buildTier1ImplText. The section promised an approval gate and shipped
  only the audit half, so console Tier 1 could never emit a BROAD SCAN IMPLEMENTATION SUMMARY.
- F02 — §T2b exemption RETIRED. It was hiding a pre-P7 prompt (no OPERATOR ACTIONS, still said "6. DEPLOY STEP",
  no test-doubles scan, never emitted TARGETED IMPLEMENTATION SUMMARY). Dissolved by two facts: F21 gave the
  delegation a real in-console target, and canonicalCoverage ignores EXTRA lines so a builder can be standalone
  AND locked — the tradeoff the original decision assumed was never forced. ALL NINE builders now locked; no
  report-only tier remains.
- F17 — WORKFLOW_BLOCKS derived from check-output-blocks' BLOCKS (7 → 12). The five omitted blocks were exactly
  the ones hiding F02/F03/F21. guard.test +2 (13 total); setup() now copies check-output-blocks.mjs.
- check-html panel fixture derived from markup (the hardcoded list had already gone stale); new assertion that
  every nav href resolves to a panel (showPanel silently falls back to Dashboard otherwise).
- INV-36 rewritten; INV-43/44 added → 44 invariants, 31 runnable PASS. New guards mutation-proven.

## Cycle 5 — Batch 3 (console correctness) + Batch 4 (make green mean green) — ✅ COMPLETE (v1.21.0)
- F06 Axis B round-trip dropped `pulse` (serializer 3 fields, parser re-read pulse from measures) → 4-field
  format, legacy 3-field still parsed. Fired on the COMMON path: the form pre-fills from DEFAULT_AXIS_B.
- F07 non-Latin name → deriveId '' → falsy id → project listed but unselectable → generated fallback id.
- F16 getFilledText string-replacement honored $&/$`/$'/$1 → function replacement.
- F20 backup envelope (app/kind/version) never read → foreign app + newer version rejected visibly; absent
  envelope still accepted (older backups).
- F11 MUTATION-AUDITED all 17 script-verified invariants (violate rule → run its own Verify → must fail).
  16 honest, 1 FALSE GREEN: INV-23 claimed "bumped when semantics change" but only tested non-emptiness.
- F09 closed it (VERSION must equal the newest ## <semver> CHANGELOG heading) → re-audit 17/17, 0 false greens.
- jsArg() helper (14 call sites) + STATIC guard: no on*= handler may build a JS arg with esc(). The
  hostile-fixture check only proves sinks the fixture reaches; this covers every handler in the file.
- F15 CI permissions: contents: read. F14 was already closed in the docs sync.
- INV-23 rewritten; INV-45..48 added → 48 invariants, 36 runnable PASS.
- WORTH REMEMBERING: my first F07 assertion was itself a false green — it tested deriveId/fallbackProjectId
  and still passed when the fix was removed from saveProjectForm. Unit-testing the helper does not prove the
  wiring. Rewritten to drive the form end to end. Same defect class F11 exists to find.

## Cycle 5 — F12 + auto-vivify gap + Batch 6 (R18 dogfood) — ✅ COMPLETE (v1.22.0)
- F12 render-metrics reported a field blank BY RULE ("net ,"). Now reports what a synthesis row owns + sums that
  cycle's net from its reflect rows. Its existing test asserted the old string against a fixture whose synthesis
  row had net_score=3 — data P1 forbids — so a P1-compliant case was added beside it.
- AUTO-VIVIFY GAP CLOSED: check-html's getElementById stub returned a live element for ANY id, so a render
  writing to a mistyped id passed CI and rendered empty in the browser (this really happened: pr-prompt vs pr in
  v1.20.0). Writes are recorded; every element written during init must exist in the markup. Reads of unknown
  ids stay allowed (browser returns null; code guards).
- BATCH 6 = the first R18 lens run on its own host, and the lens GATED CORRECTLY: the light theme deliberately
  flips "chrome only" (documented in CSS), so un-flipped semantic colors were NOT reported as a finding — that
  is perceptual, and went to an operator check instead of being guessed at.
  - (a)1 keyboard: 9 controls on div/span/tr were mouse-only (6 variant toggles, archive headers, cycle-tracker
    items, phase dots). kbdActivate() + role/tabindex added; subsystem-table action moved onto the native
    "Use ↗" button. Guard DERIVES the control set from markup.
  - (a)2: two renders blanked their container when empty → real empty states.
  - Added "Console UI/UX & Accessibility" health dimension (NEW → §6a must mark it "First measurement").
  - Promoted S5 (light mode), S6 (mobile drawer + tabbed nav), S7 (keyboard-only) into Regression Scenarios.
- INV-49/50/51 added → 51 invariants, 39 runnable PASS.
- F09 PROVED ITSELF: bumping VERSION without a CHANGELOG entry turned 8 invariants red mid-session.

## DECISION INPUT for the R18 deferral (/audit + /pr-review)
Batch 6 was the experiment that was supposed to decide this. Result: the lens found ONE real structural class
(keyboard access) and correctly refused to guess at the perceptual half. That is a good signal, but it is ONE
run on a small single-file console — not enough to justify widening to /audit and /pr-review yet. Recommend
running the lens on a genuinely UI-heavy consuming project (Observatory's Frontend subsystem) before deciding.
Keep the deferral.

## Where I left off
v1.22.0; full Test Command green (13 stages); 51 invariants; invariant-check 39/39 runnable PASS. Cycle 5 is
FEATURE-COMPLETE: R18 (v1.19.0), F01/F04/F05/F08 (v1.19.1), F03/F21/F02/F17 (v1.20.0), a docs sync, Batch 3+4
(v1.21.0), and F12 + the auto-vivify gap + Batch 6 (v1.22.0). All 21 findings closed; all 17 script-verified
invariants mutation-proven fail-closed.
/regression + /reflect are now COMPLETE for all five batches. Cycle-5 totals: 10 production fixes, 2 new
capabilities, 14 defensive/structural, 0 new failure modes, net +10 across 5 reflect rows. Cumulative net 19.
Two more self-report corrections were made in reflect (F20 is defensive, not a fix; F08/F17/F03 corrected
earlier) — the batch summaries have over-reported production fixes EVERY time, always by counting capabilities
or test/guard work as fixes. That is the single most repeated error of this cycle.
The regression pass NEGATED the one feared new failure mode: making 9 controls focusable could have made them
focusable-but-invisible, but all 17 outline:none rules are on form inputs, so the default focus ring survives.
INV-52 (visible focus indicator) is a MANUAL candidate — perceptual, only S7 can answer it.
ALL 21 Cycle-5 findings are now CLOSED (F01-F21). Remaining work is strategic / non-finding:
- Walk S5/S6/S7 in a browser — the three new visual scenarios have never been performed. S7 (keyboard-only)
  matters most: the code path is guarded but whether the FOCUS RING is visible is unknowable from code.
- The F11 mutation audit lives in scratchpad, not CI. It found a real false green; a permanent version would
  keep the library honest as it grows (~17 node spawns, so likely outside the 13-stage gate).
- The 12 MANUAL invariants have never been audited for correctness at all — F11 covered only runnable ones.
- legacyCopy()'s SUCCESS path is still unexercised (stub execCommand returns false).
- Strategic: CSP (needs event delegation, L), no LICENSE file, R9, R12, R17 follow-ons.
CYCLE HYGIENE — /regression, /reflect and /sync-docs are DONE for Cycle 5. metrics.csv now carries 3 phase=reflect
rows (net +5; the batch summaries had over-reported 8 — F08/F17 are defensive, F03 is a capability), estimates.csv
carries 3 calibration rows, and the seam counter is 2/3 (not due). portfolio-status now reads Net Δ = ↑ (it had
been reporting ↓ off stale Cycle-3/4 data). /sync-docs created this repo's Common Gotchas + Key Design Decisions +
Operator State Checklist (partially closing F18), completed the Subsystems file lists, added a Deploy Command
(F19), fixed INV-11's stale count (F14), rewrote the README defining-risk gotcha (F13) and de-staled
PROJECT_HEALTH (F10).
STILL PENDING for Cycle 5: §4v Independent Verification — MUST be a FRESH session with no implementation context
(three batches were written by the same agent that would otherwise verify them) — then §6a Health Synthesis to
re-score. Do NOT let the implementer grade its own work.

## (prior) v1.18.0 left-off
v1.18.0; full Test Command green (13 stages); 38 invariants (INV-36 now covers 6 locked builders, INV-38 = registered
output blocks). R16-full + HTML Console Correctness COMPLETE: both 8.5 synthesis priorities closed — 6/7 dynamic
builders textually locked (sectionBody lets §4v/§1s/§6a lock without minting commands; §6a pins the Cycle-4 F1
metrics-ownership rule), and the browser-only render + FSA/state-round-trip paths are now headless-tested in check-html
(all mutation-proven fail-closed). Shipped in 6 commits on branch claude/stoic-hypatia-gf4y5u, on top of the v1.17.0
hosted-console UX work (Dashboard + light mode + mobile nav). NOTE: light mode + mobile layout are still browser-
verified only — worth an eyeball before merge. Next: merge the branch. The Cycle-4 audit work is fully drained; a
fresh /broad-scan (Cycle 5) would re-baseline with fresh eyes.

## (prior) R16 left-off
v1.16.0; full Test Command green (13 stages); invariant-check 23/23 runnable PASS (36 total). R16 is COMPLETE:
the dynamic-builder lock engine + 3 of 4 builders LOCKED to 100% canonical coverage by --assert (INV-36) — §T1
(/broad-scan), §T2a (/targeted-audit), §6b (/health-pulse) — and §T2b (/targeted-implement) RESOLVED report-only
by design (canonical delegates to /broad-implement Step 1; console stays standalone, R16-S-marker-guarded). This
closes the gap R14 left (it locked only the static <pre> §-prompts). Branch claude/stoic-hypatia-gf4y5u is 9
commits ahead, no PR yet. Next: open a PR for the branch if wanted, or start Cycle 5 (fresh audit).
