# Cycle History — claude-workflow-tools

The narrative record of completed cycles, moved out of `.cycle/STATE.md` in
Cycle 6 (finding F15). STATE.md is a ROLLING file whose shape is fixed by the
template in CLAUDE.md's "Cycle State & Memory" section — it answers "where am I
now". Over five cycles it had instead accumulated 24 sections and 347 lines,
including two `Decisions made` and two `Where I left off`, so the substrate a
new session loads was buried in history. Anything durable that belongs to the
workflow itself (gotchas, design decisions, invariants) lives in
`.cycle/config.md`, not here; this file is append-only prose for reference.

Entries are newest-first.

## Cycle 8 — follow-on items closed in the v1.52.0 one-time pass (2026-11-20)

v1.52.0 gave every follow-on item an ID and a disposition. STATE.md's 22
free-text items became FO-8-1 … FO-8-22; seven stay open there (FO-8-1, 5, 8,
11, 13, 20, 22). These fifteen were closed, and the reason is the record:

- FO-8-2 | won't do — S5–S17 (visual scenarios) never walked by a person: not owed while the console is frozen; S1–S4 are still walked by automation when the HTML changes. Revive on unfreeze.
- FO-8-3 | won't do — no guard for an end-of-life Node line (Cycle-8 F15): nothing mechanical can tell one without a date.
- FO-8-4 | won't do — invariant-check passes a Verify to the shell as written (`\|` is not a pipe; toCommand ends a command at " (", " + ", " then "): documented behaviour, INV-26.
- FO-8-6 | won't do — guard.test's F7 case reads this repo's STATE.md and CHANGELOG.md: deliberate; the floor it tests needs the real release history.
- FO-8-7 | won't do — check-html, check-template-sync and the mutation audit still call process.exit() after printing: their output is far below a pipe's 64 KiB buffer (re-measured by 08-b-verification); the class is in Common Gotchas.
- FO-8-9 | won't do — without verification-pack.mjs, /verify derives its probes from the cycle number and library size: a stated tradeoff, documented in the command.
- FO-8-10 | done — "Batch 3 missed a second failure mode; /reflect should record it": 08-a-reflect.md recorded it in its block and metrics notes.
- FO-8-12 | won't do — the mutation audit's parallel cases could make a timing-dependent Verify an intermittent false green: one instance found and fixed in v1.49.0, none known since; the risk is in Common Gotchas.
- FO-8-14 | won't do — check 10's sentence scan and check 16's floor scan can flag a legitimate sentence: loud by design, and the failure line quotes the sentence.
- FO-8-15 | won't do — a project that never synthesizes rests at Phase: reflect: /cycle-close (v1.48.0) returns it to idle.
- FO-8-16 | won't do — the 7-day same-round window can split a slow round: a documented tradeoff, counted as regression R2 by 08-b-verification.
- FO-8-17 | won't do — .cycle/HISTORY.md is read by nothing: reference prose by design (.cycle/config.md, Subsystems).
- FO-8-18 | won't do — the roadmap guard (check 21) reads two mechanical things only: its scope is a recorded design decision; /sync-docs covers the rest.
- FO-8-19 | won't do — check 21 is written for this repo's ROADMAP.md shape: consuming projects do not run this repo's guard.
- FO-8-22 | won't do — no LICENSE file: the operator decided on 2026-11-23 that the repo is for their own use.
- FO-8-21 | won't do — a project on a /sync-commands older than v1.50.0 needs two runs: documented in the Operator State Checklist.

## Cycle 7 — /broad-scan (50 findings) → 8 fix batches + follow-ons, v1.35.0 → v1.43.0 — REFLECTED, NOT VERIFIED

Moved out of STATE.md when Cycle 8's first implement checkpoint rolled it
(2026-11-19). Cycle 7 was reflected on 2026-10-13 (`07-a-reflect.md`: 21 − 0,
corrected from the self-reported 25) and merged (PRs #26, #27). **Its §4v and
§6a never ran** — Cycle 8 opened on top of it — so the 21 production fixes are
self-reported, and one of the batches below (v1.39.0) shipped the regression
that Cycle 8 found as F16: all 22 Fill fields / variant-toggle handlers dead.
What follows is STATE.md's Cycle-7 record, verbatim.

### In progress (as recorded)
- All 8 fix batches are complete (v1.35.0–v1.42.0; 1–4 merged in PR #26). The expansion plan is not started.
- Correction carried forward: the v1.41.0 block says INV-26's rule text was widened; it was not until v1.42.0.
- The actionable follow-on items from Batches 1–8 shipped as v1.43.0; what remains under Open follow-on items is
  deliberate, perceptual, strategic or conditional.
- The scan's full output (50 findings, ratings, batch + expansion plans) exists only in the session chat — the
  scan writes no file. Batch definitions below are the record of what each batch contains.
- Cycle was set to 7 BY HAND in this checkpoint: the scan ran on v1.34.0, before CYCLE OPEN existed (F01).
  From v1.35.0 on, the opening audit writes it.

### Completed this cycle (as recorded)
- v1.35.0 | Batch 1 | F01 CYCLE OPEN step in /broad-scan, /audit, /targeted-audit owns the Cycle increment;
  implement CHECKPOINTs + /cycle-resume set Phase: implement, /reflect sets Phase: reflect, /cycle-init starts
  Cycle at 0; INV-12 gating check covers the new step. F02 §1s body ends with a gated SEAM COUNTER reset and
  reads the configured cadence. F03 §6a opener permits its step-8 metrics append. F04 /reflect exemption covers
  BLOCKS; <letter> defined. F06 /broad-implement points at the Invariant Library.
- v1.36.0 | Batch 2 | F12 editing the active project re-renders every prompt; F13 §6a block placeholders are
  per subsystem; F14 malformed repo spec is a visible failure, fetch timeout, STATE.md reason kept, bad spec
  refused at save; F15 stale active id resolved at load; F16 loaders tolerate wrong-shape values, Axis B repaired,
  import refuses wrong-shape keys whole; F17 closed fill forms discarded on switch. Six check-html cases, each
  proven to fail with its fix reverted.
- v1.37.0 | Batch 3 | F33 symlinked scripts run (real-path main check, 4 scripts); F34 verification-pack works in
  a consumer (cwd root, --template/--project); F32 synthesis net excluded from totals (test had asserted the bug);
  F35 CRLF/indent-tolerant invariant parsing in all three readers; F36 cadence read from its line; F39 shared CSV
  parser + numeric cycle match; F40 line-bounded fields, escaped pipes, HEALTH_SECTION; F41 maxBuffer, --timeout,
  capped reason, exitCode. INV-68 mutation case re-targeted (went false green once both parsers agreed).
- v1.38.0 | Batch 4 | F24 kbdActivate stops propagation; F25 tracker dots and archive delete are native sibling
  buttons (named, aria-pressed); F26 closed drawer visibility:hidden, open drawer traps focus and focuses its first
  link after the slide-in; F22 invariant tables' own column rules; F23 main min-width:0. Browser-verified with the
  scan's probes. Also: INV-49 delegation guard tightened (false green exposed by this batch); v1.36.0's false
  "repaired" warning for a blank Axis B fixed.
- v1.39.0 | Batch 5 | F30 fill tokens never used as text (37 → --on-*), --text-muted ≥4.5:1, custom invariant rows on
  --surface2, contrast guard extended; F27 tracker restores focus, forms focus in and back, deletes focus a neighbour;
  F29 live regions, copy announced, errors role=alert + aria-invalid/describedby, aria-expanded on every disclosure;
  F28 empty required fields explained and focused. Also: INV-45 regex false red on aria-controls fixed.
- v1.40.0 | Batch 6 | F31 CI workflow parsed (comments stripped, bare run: stages only, if:/continue-on-error and
  trigger filters fail; permissions block bounded); F45 hostile fixture seeds dashCache/dashManual from derived field
  lists, concat sinks scanned, reach floor; F18 placeholder cap lifted in console + check (§6a SEAMS field offered);
  F48 one attribute-order-agnostic <pre> scanner; F49 every CSV header exact + per-file floor; F20 builders render the
  passed project's invariants and seed. Each guard proven a false green before the fix.
- v1.41.0 | Batch 7 | F47 canonicalCoverage ordered (LCS), multiset, case-sensitive — one real reorder in Tier 1
  realigned; F46 norm exempts only single-token lines; F50 every block copy carries the same full field-label set,
  Formats VERIFICATION/TIER 2 copies aligned (live drift); F37 hook Standing + Pending asserted; F38 dedupe counted by
  executions; F44 no false red on a later "write" (bound shipped in v1.40.0).
- v1.42.0 | Batch 8 | F10 security add-on regime-agnostic; F07 finding IDs + interface ID slot, Batch-name scope,
  New capabilities (G/ST) field; F11 commands stand alone (+ check 17); F42 invariant-check shell model documented,
  runs in the project root; F19 dead files plumbing removed, bank on every systems-map field; F21 grid width,
  gitignore note, --selector console; F08/F09/F05 docs. Re-pull: 5 commands (and v1.33.0's /setup-cycle).
- v1.43.0 | follow-ons | project delete purges its keys; invariant pipes escaped; manual Refresh feedback + 404
  hint; INV-12 step set derived (+§1s/§6a); re-pull list guard (check 18); cycleTotals by header; ordered drift
  report; legacyCopy success test; cycle-qualified F20 labels; two gotchas + README lock text restated.

## Cycle 6 — full release list v1.26.0 → v1.34.0 — ✅ CLOSED (§6a 2026-09-04: 9.0 → 9.2)
Rolled out of STATE.md's "Completed this cycle" when Cycle 7 opened (2026-10-12). v1.33.0 and v1.34.0
landed after §6a and before the Cycle-7 scan, so they are filed under Cycle 6 (blocks 06-1.33.0, 06-1.34.0).
- v1.26.0 | CLAUDE.md, console §T1 | /broad-scan gained the closing IMPLEMENTATION BATCH PLAN section.
- v1.27.0 | Batches 1+2 | F01 fill-form XSS sink, F09 derived hostile-sink set, F17 mobile layout,
  F04 malformed-project recovery, F02 cycle-scoped verification pack, F03 one CSV parser, F10
  /cycle-init PROJECT_HEALTH skeleton, F07 PROJECT_HEALTH standing corrected, F08 config.md drift.
- v1.28.0 | Batches 3+4 | F05 invariant-id stability, F06 dashboard failure reason, F13 theme-safe
  colour tokens + computed contrast guard, F12 form labels + drawer keyboard dismissal.
- v1.29.0 | Batches 5+6 | F11 fill-field classification, F14 seeded §4v probes, F15 this file,
  F16 every static console prompt locked (nine, not the eight the scan counted).
- v1.30.0 | post-reflect | the two duplicate-id collisions /regression found: <section id="t1"> shadowed
  <pre id="t1"> and renderTier1() destroyed the whole Tier 1 panel on every load; doCopy('setup') copied
  the section. Pre ids renamed t1→t1a, setup→psetup (sections untouched — nav depends on them). INV-67
  added: every markup id is unique.
- v1.30.1 | 26 dead CSS rules (17 classes) removed — the residue of an older archive rendering, the
  superseded cycle-tracker checkbox, and .prose. Verified SAFE from real class attributes, not raw text
  (a raw search called fl/fr/fs/ft/lt "used" — they appear inside "flex", "from", "restoring", &lt;).
  ROADMAP R21 queues the /broad-scan dead-artifact lens for Cycle 7 with its exact replacement text.
- v1.31.0 | Cycle-6 remediation Batches 1+2 | A1 INV-68 the invariant-library PARSE FLOOR (two parsers
  disagreed; a rule with one leading space left the proven set silently while both tools reported
  "67/67 … fails closed ✓" against a 68-rule file). A2 library text repairs: INV-50 rescoped to what it
  proves, INV-66's self-contradiction fixed, INV-29 RETIRED as subsumed by INV-66 with its drift
  mutation moved there. B1 INV-69: a covering :focus-visible rule must APPLY, not merely exist —
  scoping the file's one rule to .nav-item left 19 controls uncovered and the old check called them
  covered. B2 INV-70: the §4v pack's disclosed seed now reproduces its own printed probes; buildPack
  derives them from the seed it prints and takes no override.
- v1.32.0 | Cycle-6 remediation Batches 3-5 | C1 INV-71 the PROJECT_HEALTH "Current Standing" label
  contract gets ONE definition (scripts/health-fields.mjs, keyed not positional); doc copies checked
  inside the span that writes them, the console checked by BEHAVIOUR because parseHealth matches a loose
  pattern rather than spelling the labels. C2 INV-74 CI runs every Test Command stage in order.
  D1 three blocks backfilled: 06-1.30.1 (marked a reconstruction, claims re-verified), 06-b-verification
  and 06-c-seams. D2 INV-72 every release of the current cycle has a block. E2 seams counter reset.
- Invariant library 58 → 72 (one retired, six added), all runnable and mutation-proven (81 mutations).
- v1.33.0 | post-synthesis | §6a policy trigger made RELATIVE (decline / sharp drop / persistent
  laggard / absolute floor); INV-75.
- v1.34.0 | post-synthesis | X1 /broad-scan numbers completeness gaps G1–G5 and strategic suggestions
  ST1–ST5 (suggestions now carry effort) and closes with a separate EXPANSION PLAN (E-batches, rows
  tagged GAP:/STRATEGIC:, every G/ST placed once or under Not batched); /broad-implement accepts G/ST
  IDs and REFLECT counts them as capabilities. X2 ROADMAP R21 applied verbatim (Stage 1
  dead/superseded-artifact lens with SAFE/PROPOSE, plus the DO-NOT addendum).

## Cycle 6 — broad-scan → /broad-implement Batches 1 + 2 — ✅ COMPLETE (v1.27.0)
Scan (v1.26.0 added the IMPLEMENTATION BATCH PLAN closing section to /broad-scan; first output to carry it):
17 findings; Overall 8.0 (from 9.0 — fresh eyes, not a regression: one High security sink + one High
interface break that no headless check could see, and three consumer-facing tooling defects the tests
were shaped not to exercise). Headless Chromium was used for Stage 2 (a driver in the session scratchpad,
NOT in the repo): screenshots mid-animation were an artifact; geometry/DOM assertions were the evidence.
- DONE F01 (High) fill-form sink: subsystem names + saved values raw in innerHTML; executed in Chromium
  with ccg:ghToken readable. esc()/jsArg() everywhere in buildFillForm.
- DONE F09 hostile-fixture sinks DERIVED from render writes; fill forms + project editor driven; two
  fail-closed floors. FIRST ATTEMPT WAS WRONG: marker after switchProject dropped the init sinks and three
  existing INV-20 cases went green — the mutation audit caught it. Worth remembering: a derivation can
  narrow itself the moment it is introduced; the floor (init innerHTML sinks ⊆ scanned sinks) guards it.
- DONE F17 (High) body flex ROW below 768px → top bar as a side column + horizontal overflow; column now.
  Static CSS check only — real-DOM geometry needs a browser stage (open gap).
- DONE F04 malformed stored project bricked init with no in-app recovery → repair/drop + backup shape
  refusal ('bad-projects') + fresh-context boot test.
- DONE F02 verification pack scoped to `<cycle>-` blocks; excluded ones named.
- DONE F03 scripts/csv.mjs = the one CSV parser (three readers); /reflect says quote comma fields.
- DONE F10 /cycle-init carries a project-agnostic PROJECT_HEALTH skeleton (§7 pointer was a dead end).
- DONE F07 PROJECT_HEALTH Current Standing corrected (it is LIVE status the hook loads every session).
- DONE F08 config.md drift. Net 6 − 0 (F07 borderline; F04/F09/F08 defensive) — /reflect to confirm.
- Block persisted: .cycle/blocks/06-1.27.0-broad-implement.md. Command bodies changed → consumers re-pull.

## Cycle 6 — Batches 3 + 4 — ✅ COMPLETE (v1.28.0)
Console + tooling only; no command body or schema change, so no consumer re-pull.
- DONE F05 invariant ids now round-trip through the pf-invs textarea as an optional `INV-NN |` prefix
  and are allocated above the max of BOTH stores; deleting a line no longer renumbers the rest, and the
  form can no longer re-issue a number the §4v form already used.
- DONE F06 the Dashboard records the failure reason on EVERY failure (it was dropped when a cache entry
  already existed) and renders it with the fix (token / rate limit / file:// blocks fetch).
- DONE F13 all 16 literal hex text colours replaced by --on-* tokens that flip; check-html computes 48
  token/surface pairs at 4.5:1 and rejects any new literal. The four dead `.fill-select` rules are live.
- DONE F12 69 form controls labelled (markup + render-only forms); drawer gets aria-expanded, Escape,
  and focus return guarded on it having been open.
- INV-59..62 added → 62 total, 62 runnable, 70 mutations. TWO OF MY OWN GUARDS WERE WRONG FIRST TIME and
  the mutation audit caught both: the backdrop a11y exemption was pinned to the literal `closeNav()` and
  stopped matching when the call gained an argument (now CONDITIONAL on the Escape path existing), and
  the label check's `\bfor=` also matched `data-for=` so a broken association read as valid. Same lesson
  as Batch 1's marker: a new guard can be born narrower than it looks.
- Element double upgraded: tracking classList/attributes/focus + recorded document listeners, which is
  what lets the drawer be DRIVEN rather than read.
- Block persisted: .cycle/blocks/06-1.28.0-broad-implement.md.

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

## R19 — verification-pack assembly — ✅ COMPLETE (v1.23.0)
Origin: assembling the Cycle-5 §4v prompt by hand. The finding underneath it is structural — THE HANDOFF BLOCKS
LIVE NOWHERE. 5 implementation summaries + 2 cycle summaries existed only in chat scrollback; STATE.md carries
prose ABOUT them, not the blocks. The handoff design assumes they survive sessions and nothing persisted them.
- .cycle/blocks/ convention: the 3 implement commands + /reflect write their block VERBATIM at CHECKPOINT.
  /audit deliberately does NOT — "Do not make any changes to any files" is its first line, so §6a still takes
  the Session Handoff Block by paste. Seeded with Cycle 5's 7 blocks.
- scripts/verification-pack.mjs: body via sectionBody() (no fourth copy), live invariant library (PERMISSIVE
  parse — the strict one drops INV-08/INV-46, whose rule text contains a pipe), rotation probes SEEDED FROM THE
  COMMIT SHA (the prompt's "do NOT substitute your own picks" has no force if the implementer picks them), and
  cycle totals + an AUTOMATIC warning when a reflect row recorded a correction.
- tests/verification-pack.test.mjs (14 assertions) → Test Command and CI are now 14 STAGES. INV-52 added (52
  total, 40 runnable). 4 mutations proven fail-closed.
- Command bodies changed → downstream /sync-commands re-pull needed (additive; no .cycle/ = unchanged behavior).
- NOTE: built BEFORE §4v has ever run. The block format is deliberately loose; expect the first real
  verification pass to reshape it.

## §4v + §6a — Cycle 5 CLOSED (overall 8.8 → 9.0)
§4v ran in a genuinely fresh session and probed 24 invariants BY MUTATION: 23 PASS, 1 FAIL, 0 regressions.
It independently re-derived and rejected the one feared regression (focusable-but-invisible controls).
- **INV-20 is a FALSE GREEN at field level.** The hostile fixture poisons only SOME fields per record
  (text:'imported', subsystem:'s'), so dropping esc() from ${esc(inv.text)} or ${esc(inv.subsystem)} passes all
  14 stages. Reproduced locally by mutation. F11's "17/17, 0 false greens" was scoped to COMMAND-level mutation
  and does not hold one level down. The rule still holds in code — this is a coverage gap, not a live hole.
- **LIVE DEFECT: archive "Copy content" (claude-code-guide-v2.html:2888)** calls navigator.clipboard.writeText()
  inline, bypassing copyToClipboard(). F05's exact bug, still present in one sink → F05 was a PARTIAL fix.
- Console static <pre> block displays have NO shape check (check-output-blocks never reads the console).
- 17 outline:none, 3 :focus, ZERO :focus-visible — INV-56 is right that Batch 6 routed focus visibility wholly
  to the perceptual bucket when half is structurally checkable.
- Common Gotchas did not exist for the first three releases (created at 18ba010, after v1.20.0), so batches 1–3
  ran under commands telling them to check a section that wasn't there.
§6a scored it: Guard & Tooling 9.5→8.0 and Guard/Test Coverage Quality 9→7.0 (SECOND cycle declared closed and
found open). Console UI/UX & Accessibility 7.0 First measurement. Seven dimensions rose. Overall 9.0 — but the
average rose while the most important dimension fell; read the grid.
No policy triggers (lowest 7.0 vs threshold 4/10) — flagged as a rubric weakness: a category over-scored twice
running is invisible to a fixed threshold.

## Post-synthesis §4v remediation — ✅ COMPLETE (v1.24.0)
Every finding from the Cycle-5 verification pass is closed.
- LIVE DEFECT archive "Copy content" bypassed copyToClipboard() → routed through it. Root cause worth keeping:
  copyFeedback() hardcoded the prompt-copy icon as the reset label, so the helper could not be reused for a
  button with its own label — that is HOW the sink kept its inline call. INV-54 static scan added.
- INV-53 — the payload set is now DERIVED from the sinks' ${obj.field} interpolations. MY FIRST ATTEMPT WAS
  WRONG THE SAME WAY: an unqualified `.field` structural test excluded inv.text because getFile().text() exists
  elsewhere. Alias-scoped now, plus an assertion that fails if inv.text/inv.subsystem ever leave the set.
- INV-55 — console block shapes checked, 12/12. TOOK THREE PASSES: the first run's five "failures" were all
  checker artifacts (delimiter lines carry container punctuation: ---END X---`; / ---END X---</pre> /
  <pre id=…>---X---). The console was correct. Worth remembering before reporting a new check's first output.
- INV-56 — global :focus-visible using box-shadow (the only property inline outline:none cannot suppress).
- F15 — CI permissions asserted; guard.test setup() now copies .github/ (test double updated with the fix).
- INV-20 scope note retired; INV-53..57 added → 57 invariants, 45/45 runnable PASS. 15 guard cases.
- F09 caught a missing CHANGELOG entry for the SECOND time — the guard is earning its place.

## Where I left off (superseded — see below)
v1.27.0 pushed on claude/broad-scan-8a6drq; full Test Command green (16 stages); 58/58 invariants
fail-closed across 64 mutations. Cycle 6 Batches 1+2 done; next is Batch 3 (F05, F06) via
/broad-implement, or /reflect if the operator wants to close the cycle here. Findings and the
batch plan are in the Cycle-6 scan output (chat) — the scan itself writes no file (audit rule).
