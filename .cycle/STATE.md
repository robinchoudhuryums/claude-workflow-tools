# Cycle State

## Current
Cycle: 6
Phase: idle — CYCLE 6 IS CLOSED. Audit → implement → regression → reflect → remediation → §4v → Seams audit → §6a all complete. Cycle 7 begins with a fresh /broad-scan, which increments Cycle to 7 (P3).
Scope: Interactive Console (HTML) + Tooling & Sync Infrastructure + Canonical Templates & Docs
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs && node tests/verification-pack.test.mjs && node tests/mutation-audit.test.mjs && node tests/mutation-audit.mjs
Subsystem cycles since last Seams audit: 0 (cadence 3 — reset by the Seams & Invariants audit of 2026-09-04; its block is .cycle/blocks/06-c-seams.md)
Updated: 2026-09-04

## In progress (facts to carry forward — NOT judgments)
- Nothing partially done. All five remediation batches are complete and pushed (v1.31.0, v1.32.0).
- The ONLY step left in Cycle 6 is §6a HEALTH SYNTHESIS. Its inputs are the eight .cycle/blocks/06-*.md
  files, which now include the §4v VERIFICATION BLOCK (06-b-verification.md) and the SEAMS & INVARIANTS
  AUDIT BLOCK (06-c-seams.md) — both were persisted in the v1.32.0 batch, having existed only in a chat
  transcript until then.
- TELL §6a the bookkeeping it cannot derive: the cycle-6 metrics row reads 13 − 0 because /reflect ran
  BEFORE the v1.30.0 duplicate-id fixes. Cycle total is 15 − 0 with 5 defensive, PLUS v1.31.0 (1 − 0,
  3 defensive) and v1.32.0 (0 − 0, 6 defensive). No metrics row was added for v1.30.0, v1.30.1, v1.31.0
  or v1.32.0 — /reflect is the sole writer of those columns (P1/INV-33).
- §4v reported ONE failure, INV-52's reproducibility clause. v1.31.0's INV-70 closes it. §6a should
  score the post-remediation state, not that block's verdict alone.
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
- v1.32.0 | Cycle-6 remediation Batches 3-5 | C1 INV-71 the PROJECT_HEALTH "Current Standing" label
  contract gets ONE definition (scripts/health-fields.mjs, keyed not positional); doc copies checked
  inside the span that writes them, the console checked by BEHAVIOUR because parseHealth matches a loose
  pattern rather than spelling the labels. C2 INV-74 CI runs every Test Command stage in order.
  D1 three blocks backfilled: 06-1.30.1 (marked a reconstruction, claims re-verified), 06-b-verification
  and 06-c-seams. D2 INV-72 every release of the current cycle has a block. E2 seams counter reset.
- Invariant library 58 → 72 (one retired, six added), all runnable and mutation-proven (81 mutations).

## Pending / not yet done
CYCLE 6 IS COMPLETE — §6a ran on 2026-09-04 (overall 9.0 → 9.2; PROJECT_HEALTH.md and one
phase=synthesis metrics row written). Nothing remains in this cycle.
NEXT: /broad-scan opens Cycle 7 and increments the Cycle field to 7.
- Cycle 7's queued first items: R21 (the /broad-scan dead-artifact lens — changes a command body, so
  downstream re-pull) and R22 (scripts/synthesis-pack.mjs, the §6a assembler; recorded 2026-09-04 after
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
- The POLICY MECHANISM has never engaged in six cycles. Threshold 4/10 with scores between 7 and 9.5
  means the "≤ threshold for 2 consecutive cycles" trigger is unreachable. Flagged at Cycle 5 and again
  at Cycle 6 — either the threshold is wrong for this project or the rule should be relative (a category
  that FALLS two cycles running), and that is a config decision.
- INV-72 is a RATCHET, not a proof of completeness: its floor is derived from the versions this cycle
  already has blocks for, so a cycle whose FIRST release ships blockless sets its own floor above it.
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
- buildPack DERIVES its probes from the seed it prints and takes no `probes` override. The override is
  what let disclosure and use diverge; re-adding one reopens the class.

## Where I left off
CYCLE 6 CLOSED. §6a ran 2026-09-04: overall 9.0 → 9.2, Category D 20% → 16%, no policy triggers.
PROJECT_HEALTH.md Current Standing + a Cycle 6 Score History entry written; one phase=synthesis metrics
row appended (category_d_ratio + axis_b_lowest only — net_score columns left blank per P1/INV-33).
Full Test Command green (16 stages, 304 ✓); 72/72 invariants runnable, PASS, mutation-proven across 81
mutations. Seams counter 0/3.

Next action: /broad-scan opens Cycle 7 (and increments Cycle to 7). R21 and R22 are its queued first
items; two decisions (INV-73, §4v-vs-hook) are waiting on the operator, not on work.

Worth carrying: the cycle's whole shape was "the finding machinery is working better than the guards it
inspects." Four guards proved less than their rule text claimed, and EVERY instance was caught by this
project's own processes — §4v caught INV-52, the Seams audit caught INV-56, the mutation audit and
guard.test.mjs each caught one of my own new guards mid-write. The question that found all four is worth
asking of every guard: WHAT UNSTATED PROPERTY MAKES THIS CHECK'S CONCLUSION TRUE? INV-56's rested on its
one :focus-visible rule being universal; "N/N invariants proven" rested on two parsers agreeing; §4v's
anti-steering rested on the printed seed being the seed used; the health board rested on four hard-coded
label lists matching. None was asserted. Also worth carrying: §6a itself had to be hand-fed a
reconciliation that had already rotted in four places — that is R22, and it is the same argument R19 won.
