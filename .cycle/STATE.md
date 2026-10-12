# Cycle State

## Current
Cycle: 6
Phase: idle — CYCLE 6 IS CLOSED (§6a ran 2026-09-04). Two post-synthesis releases landed after it: v1.33.0 (policy trigger RELATIVE) and v1.34.0 (/broad-scan G/ST IDs + EXPANSION PLAN, and R21's dead-artifact lens). Cycle 7 begins with a fresh /broad-scan, which increments Cycle to 7 (P3).
Scope: Interactive Console (HTML) + Tooling & Sync Infrastructure + Canonical Templates & Docs
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs && node tests/verification-pack.test.mjs && node tests/mutation-audit.test.mjs && node tests/mutation-audit.mjs
Subsystem cycles since last Seams audit: 0 (cadence 3 — reset by the Seams & Invariants audit of 2026-09-04; its block is .cycle/blocks/06-c-seams.md)
Updated: 2026-10-12

## In progress (facts to carry forward — NOT judgments)
- Nothing partially done. v1.34.0 is complete; the next step is the Cycle-7 /broad-scan.

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

## Pending / not yet done
CYCLE 6 IS COMPLETE — §6a ran on 2026-09-04 (overall 9.0 → 9.2; PROJECT_HEALTH.md and one
phase=synthesis metrics row written). Nothing remains in this cycle.
NEXT: /broad-scan opens Cycle 7 and increments the Cycle field to 7.
- Cycle 7's queued first item: R22 (R21 shipped in v1.34.0 ahead of the scan, so the Cycle-7 scan is
  the first to run with it). R22 is (scripts/synthesis-pack.mjs, the §6a assembler; recorded 2026-09-04 after
  §6a had to be hand-fed a reconciliation that had already rotted in four places).
- OPEN, pending a DECISION rather than work — INV-73: §1s must ask about the project's CONFIGURED Axis B
  categories. buildSeamsText hardcodes the five defaults, and THIS project's five are all custom, so the
  Seams audit of 2026-09-04 was asked about categories it does not use. It is the single finding that
  pulled TWO Axis A dimensions down at synthesis (Prompt Quality, Adaptability) and holds Silent Prompt
  Degradation at 8.5. Closing it means editing an --assert-locked canonical body AND the SEAMS block's
  registered field names; making those dynamic weakens the shape check that guards them.
- OPEN, pending a DECISION: §4v independence vs the SessionStart hook. The hook injects STATE.md —
  implementer prose and self-assessment — into every new session, including a §4v one, which contradicts
  §4v's own opening instruction. Either suppress the judgment-bearing sections when Phase is `verify`,
  or require §4v to run hook-free.
- CLOSED in v1.33.0: the policy trigger is now RELATIVE (decline / sharp drop / persistent laggard /
  absolute floor), validated by replaying six cycles of real Axis B history — Cycle 5 fires, Cycle 6
  correctly does not. The Cycle-6 PROJECT_HEALTH entry still QUOTES the old reasoning ("lowest 8.0 vs
  threshold 4/10"); the verdict is unchanged, so correct the wording at the next synthesis rather than
  editing a historical entry.
- INV-72 is a RATCHET, not a proof of completeness: its floor is derived from the versions this cycle
  already has blocks for, so a cycle whose FIRST release ships blockless sets its own floor above it.
- R21 left one decision open: /audit focus area 2 still carries the terse code-only dead-code bullet and
  /targeted-audit has no dead-code lens at all. Decide that asymmetry deliberately, not by reflex.
- ROADMAP R20 (real-DOM console test stage) is recorded but not built, and is now trebly earned.

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
- /broad-scan keeps fixes and new capability in SEPARATE plans: findings go in numbered Batches, G/ST
  items only in Expansion batches (E1…), never in a Batch or its hour total. G/ST work is a capability,
  never a production fix (net_score stays strict). ST, not S, because S1… is the Regression Scenario id.
- buildPack DERIVES its probes from the seed it prints and takes no `probes` override. The override is
  what let disclosure and use diverge; re-adding one reopens the class.

## Where I left off
CYCLE 6 CLOSED (§6a 2026-09-04: overall 9.0 → 9.2). Two post-synthesis releases since: v1.33.0 (relative
policy trigger) and v1.34.0 (/broad-scan G/ST IDs + separate EXPANSION PLAN; R21 dead-artifact lens;
/broad-implement accepts G/ST). Both changed command bodies — consuming projects re-pull with /sync-commands.

Next action: /broad-scan opens Cycle 7 (and increments Cycle to 7). It is the first scan to carry both
v1.34.0 changes, so check its output actually numbers G/ST items and places each one exactly once. R22 is
the queued first item; three decisions wait on the operator (INV-73, §4v-vs-hook, R21's /audit asymmetry).

Worth carrying: the question that found four Cycle-6 guard defects — WHAT UNSTATED PROPERTY MAKES THIS
CHECK'S CONCLUSION TRUE? — and R22, which is the same argument R19 won.
