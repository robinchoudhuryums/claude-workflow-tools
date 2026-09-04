# Cycle State

## Current
Cycle: 6
Phase: implement — Cycle-6 REMEDIATION. §4v and the Seams audit have both RUN; Batches 1+2 of the plan they produced landed as v1.31.0. Batches 3-5 remain, then §6a closes the cycle.
Scope: Interactive Console (HTML) + Tooling & Sync Infrastructure + Canonical Templates & Docs
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs && node tests/verification-pack.test.mjs && node tests/mutation-audit.test.mjs && node tests/mutation-audit.mjs
Subsystem cycles since last Seams audit: 3 — STALE: the Seams audit HAS run (2026-09-04). Resetting this to 0 is Batch 5 item E2 and was out of scope for the Batch 1+2 session, so /audit and portfolio-status will keep reporting DUE until it lands.
Updated: 2026-09-04

## In progress (facts to carry forward — NOT judgments)
- Nothing partially done. Batches 1+2 are complete and pushed as v1.31.0; Batches 3-5 have not been started.
- The remediation plan has 12 items in 5 batches. Batches 1+2 (A1 A2 B1 B2) are DONE. Remaining:
  Batch 3 — C1 INV-71 (derive the PROJECT_HEALTH "Current Standing" label set across its four readers:
  portfolio.mjs, portfolio-status.mjs, console parseHealth, /cycle-init's skeleton — they match today,
  nothing asserts it) and C2 INV-74 (CI runs every stage of the documented Test Command, in order —
  parity is exact today, INV-14 only asserts one script runs). Both go green on landing.
  Batch 4 — D1 backfill .cycle/blocks/06-1.30.1-broad-implement.md, THEN D2 INV-72 (every release that
  changes shipped code has a block). Order is load-bearing: D2 is RED until D1 lands.
  Batch 5 — E1 the three owed Common Gotchas, E2 reset the seam counter to 0, E3 CHANGELOG/VERSION.
- POST-REFLECT: /reflect stamped the cycle-6 metrics row (13 − 0) before v1.30.0. §6a should count
  15 − 0 with 5 defensive for the cycle, PLUS v1.31.0's 1 − 0 with 3 defensive. No metrics row was
  added for v1.30.0, v1.30.1 or v1.31.0 — /reflect is the sole writer of those columns.
- §4v has run and its VERIFICATION BLOCK reported one FAIL (INV-52's reproducibility clause). B2/INV-70
  closes it. §6a must be given the post-remediation state, not that block's verdict alone.
- S5/S7/S8/S9 have still never been walked by a person in a browser.

## Completed this cycle
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
- Invariant library 58 → 69 (one retired, three added), all runnable and mutation-proven (78 mutations).

## Pending / not yet done
CLOSING CYCLE 6 — the Seams audit and §4v are DONE. What remains:
1. REMEDIATION Batches 3, 4 and 5 (listed in "In progress" above). Batch 4's D1 must precede D2.
2. §6a HEALTH SYNTHESIS. Inputs are .cycle/blocks/06-*.md — now SIX blocks (four implement, the
   reflect block, and 06-1.31.0). The §4v VERIFICATION BLOCK and the SEAMS & INVARIANTS AUDIT BLOCK
   from 2026-09-04 are NOT yet saved to .cycle/blocks/ — they live in the session transcript, and §6a
   wants them (06-b-verification.md and 06-c-seams.md). Saving them is worth doing before §6a.
   TELL §6a: the metrics row reads 13 − 0 because /reflect ran before v1.30.0; the cycle total is
   15 − 0 with 5 defensive, plus v1.31.0's 1 − 0 with 3 defensive. §6a writes ONE phase=synthesis row
   (category_d_ratio + axis_b_lowest only — never net_score, P1/INV-33) and the PROJECT_HEALTH.md
   Current Standing block, which is LIVE status read by the Dashboard, both portfolio scripts and the hook.
3. Then Cycle 7 begins with a fresh /broad-scan (which increments Cycle to 7 per P3).
- DEFERRED pending a decision, not forgotten: INV-73 (§1s must ask about the project's CONFIGURED Axis B
  categories — buildSeamsText hardcodes the five defaults, and THIS project's five are all custom, so the
  Seams audit that just ran was asked about categories it does not use). Closing it means editing an
  --assert-locked canonical body AND the SEAMS block's registered field names; making those dynamic
  weakens the shape check that guards them. Decide before spending it.
- DEFERRED pending a decision: §4v independence vs the SessionStart hook. The hook injects STATE.md —
  implementer prose and self-assessment — into every new session, including a §4v one, which contradicts
  §4v's own opening instruction. Either suppress the judgment-bearing sections when Phase is `verify`,
  or require §4v to run hook-free.
- ROADMAP R21 is queued as Cycle 7's first item (the /broad-scan dead-artifact lens). It changes a
  command body → downstream re-pull.
- ROADMAP R20 (real-DOM console test stage) is recorded but not built, and is now trebly earned: F17's
  fix is pinned by a static CSS rule, BOTH duplicate-id defects were invisible to the vm harness, and
  INV-69 was written only after driving Chromium to confirm what the universal rule actually does.

## Open follow-on items
- deleteProject() leaves ccg:<pid>:invariants / :archive / :cycle behind; a new project deriving the
  same id inherits a dead project's invariants.
- The project form splits invariant lines on `|`, so rule text containing a pipe mis-parses (this
  repo's own INV-08/INV-46 would).
- --accent is 3.4:1 on the light surface; left alone deliberately as the identity colour.
- The `#fff` phase-dot label on a semantic fill is 2.3:1 — perceptual, for S8.
- legacyCopy()'s SUCCESS path is still unexercised (the stub execCommand returns false).
- Strategic: CSP (needs event delegation, L), no LICENSE file.

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
- buildPack DERIVES its probes from the seed it prints and takes no `probes` override. The override is
  what let disclosure and use diverge; re-adding one reopens the class.

## Where I left off
v1.31.0 pushed: Cycle-6 remediation Batches 1+2. Full Test Command green (16 stages, 298 ✓, was 292);
69/69 invariants runnable, PASS, and mutation-proven across 78 mutations. Rebased onto origin/main
(v1.30.1) before committing — the branch was based on a stale main and would have reverted the
dead-CSS release. Nothing is half-done.

Next action: Batch 3 (C1 INV-71, C2 INV-74), then Batch 4 (D1 backfill the v1.30.1 block, THEN D2
INV-72 — that order is load-bearing), then Batch 5. Before §6a, save the §4v VERIFICATION BLOCK and
the SEAMS & INVARIANTS AUDIT BLOCK from the 2026-09-04 session into .cycle/blocks/ as
06-b-verification.md and 06-c-seams.md; §6a reads that directory and cannot see a transcript.

Worth carrying: every finding in this batch was a guard that reported green while proving less than its
rule text claimed, and the pattern behind all four is one question — WHAT UNSTATED PROPERTY MAKES THIS
CHECK'S CONCLUSION TRUE? INV-56's rested on its one :focus-visible rule being universal; the "N/N
invariants proven" line rested on two parsers agreeing; §4v's anti-steering rested on the printed seed
being the seed used. None of the three was asserted. Also: I got INV-56 WRONG first — I reported a
false green, then found the covering rule is universal and my test control was genuinely covered. The
real defect was narrower (a scoped rule still passes). Driving the browser before writing the guard is
what corrected it; the mutation audit alone would not have.
