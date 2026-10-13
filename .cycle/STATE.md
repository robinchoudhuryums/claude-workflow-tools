# Cycle State

## Current
Cycle: 7
Phase: reflect
Scope: broad (Cycle-7 /broad-scan, 2026-10-12 — 50 findings F01–F50, 8 fix batches, expansion plan E1–E4)
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs && node tests/verification-pack.test.mjs && node tests/mutation-audit.test.mjs && node tests/mutation-audit.mjs
Subsystem cycles since last Seams audit: 1 (cadence 3 — /reflect increments it, a Seams audit resets it)
Updated: 2026-10-13

## In progress (facts to carry forward — NOT judgments)
- All 8 fix batches are complete (v1.35.0–v1.42.0; 1–4 merged in PR #26). The expansion plan is not started.
- Correction carried forward: the v1.41.0 block says INV-26's rule text was widened; it was not until v1.42.0.
- The actionable follow-on items from Batches 1–8 shipped as v1.43.0; what remains under Open follow-on items is
  deliberate, perceptual, strategic or conditional.
- The scan's full output (50 findings, ratings, batch + expansion plans) exists only in the session chat — the
  scan writes no file. Batch definitions below are the record of what each batch contains.
- Cycle was set to 7 BY HAND in this checkpoint: the scan ran on v1.34.0, before CYCLE OPEN existed (F01).
  From v1.35.0 on, the opening audit writes it.

## Completed this cycle
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

## Pending / not yet done
- §4v for Cycle 7 in a FRESH session (node scripts/verification-pack.mjs --out pack.md), then §6a synthesis.
- Deferred: F43 (hook framing/size cap) — tied to the §4v-vs-SessionStart-hook decision.
- Expansion (optional): E1 ST4+G5, E2 ST1+G1, E3 G2, E4 ST3+G4. Not batched: ST2 (packaging decision), G3.
- OPEN DECISIONS (operator, not work): INV-73 (§1s hardcodes the five default Axis B categories); §4v
  independence vs the SessionStart hook; R21's /audit vs /targeted-audit dead-code asymmetry.
- Phase "verify" is still written by nothing — §4v is read-only. The §4v-vs-hook decision depends on it.

## Open follow-on items
- --accent is 3.4:1 on the light surface; left alone deliberately as the identity colour.
- The `#fff` phase-dot label on a semantic fill is 2.3:1 — perceptual, for S8.
- Strategic: CSP (needs event delegation, L), no LICENSE file (the licence is the owner's choice).
- The Axis B project-form field splits on `|` like the invariant field used to; measures/playbook text with a
  literal pipe would mis-parse (not seen yet — the invariant fix in v1.43.0 is the pattern to copy).
- Conditional consolidations, not work yet: a 4th hand-rolled parser (YAML/CSV/invariant readers exist) or a
  5th script main-module check would justify a shared module.

## Decisions made (so the next session doesn't re-litigate)
- The console's prompts are GENERATED/LOCKED from CLAUDE.md. As of v1.29.0 this covers EVERY static
  <pre> as well as all nine dynamic builders, and gen-html-prompts --assert fails if a new static
  prompt appears with no manifest entry. There is no unlocked tier left.
- Prompts with no slash-command counterpart (§1 variants, §4 pre-check, §5 add-ons, §7 blocks, the
  §4v reference) are canonical SECTIONS in CLAUDE.md, not new commands — each extends a command that
  already exists, so minting one would duplicate a body rather than extend it.
- net_score stays a strict gate; hardening shows up in defensive_count.
- R11 (Dynamic Workflows orchestrator) is HELD until DW leaves research preview.
- STATE.md is rolling and template-shaped; narrative history goes to .cycle/HISTORY.md (F15), and
  check-template-sync now fails if this file grows a section the template does not define.
- A GUARD MUST PROVE THE PROPERTY ITS COVERAGE RESTS ON, not a proxy for it. INV-56 proved a covering
  :focus-visible rule EXISTED; coverage actually rested on that rule being UNIVERSAL, which nothing
  asserted. Same shape as INV-68: the proven set rested on both parsers agreeing, and nothing measured
  them against the file. When a check passes, ask what unstated property makes its conclusion true.
- /broad-scan keeps fixes and new capability in SEPARATE plans: findings go in numbered Batches, G/ST
  items only in Expansion batches (E1…), never in a Batch or its hour total. G/ST work is a capability,
  never a production fix (net_score stays strict). ST, not S, because S1… is the Regression Scenario id.
- buildPack DERIVES its probes from the seed it prints and takes no `probes` override. The override is
  what let disclosure and use diverge; re-adding one reopens the class.

## Where I left off
Cycle 7 open; all 8 fix batches and the follow-ons shipped (v1.35.0–v1.43.0). 1–4 are merged (PR #26); 5–8 and the
follow-ons are on branch claude/tender-clarke-x722xl. Cycle 7 reflected (07-a-reflect.md: 21 − 0, corrected from the self-reported 25). Next: §4v in a fresh session,
then §6a. The console's rendering of Batches 2, 4 and 5 still wants a person at a browser (S5–S9).
