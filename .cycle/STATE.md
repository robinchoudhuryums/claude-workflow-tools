# Cycle State

## Current
Cycle: 6
Phase: implement — Cycle-6 REMEDIATION COMPLETE. §4v and the Seams audit have run; all five batches of the plan they produced landed (v1.31.0, v1.32.0). Only §6a remains to close the cycle.
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
CLOSING CYCLE 6 — remediation is COMPLETE. One step remains:
1. §6a HEALTH SYNTHESIS. Inputs: the eight .cycle/blocks/06-*.md files. §6a writes the PROJECT_HEALTH.md
   update and ONE phase=synthesis metrics row (category_d_ratio + axis_b_lowest only — never net_score,
   P1/INV-33). Then update PROJECT_HEALTH.md Current Standing, which is LIVE status read by the
   Dashboard, both portfolio scripts and the hook — and is now guarded by INV-71.
2. Then Cycle 7 begins with a fresh /broad-scan (which increments Cycle to 7 per P3).
- OPEN, pending a DECISION rather than work — INV-73: §1s must ask about the project's CONFIGURED Axis B
  categories. buildSeamsText hardcodes the five defaults, and THIS project's five are all custom, so the
  Seams audit of 2026-09-04 was asked about categories it does not use. Closing it means editing an
  --assert-locked canonical body AND the SEAMS block's registered field names; making those dynamic
  weakens the shape check that guards them.
- OPEN, pending a DECISION: §4v independence vs the SessionStart hook. The hook injects STATE.md —
  implementer prose and self-assessment — into every new session, including a §4v one, which contradicts
  §4v's own opening instruction. Either suppress the judgment-bearing sections when Phase is `verify`,
  or require §4v to run hook-free.
- INV-72 is a RATCHET, not a proof of completeness: its floor is derived from the versions this cycle
  already has blocks for, so a cycle whose FIRST release ships blockless sets its own floor above that
  release. Worth a second look in Cycle 7.
- ROADMAP R21 is queued as Cycle 7's first item (the /broad-scan dead-artifact lens). It changes a
  command body → downstream re-pull.
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
v1.32.0 pushed: Cycle-6 remediation Batches 3-5, after v1.31.0's Batches 1-2. Full Test Command green
(16 stages, 304 ✓, from 292 at the start of remediation); 72/72 invariants runnable, PASS, and
mutation-proven across 81 mutations. The Seams counter is reset to 0. Nothing is half-done.

Next action: §6a HEALTH SYNTHESIS — the last step of Cycle 6 — then /broad-scan opens Cycle 7.

Worth carrying: TWO of my own guards were wrong on first write this remediation and both were caught
before landing. Check 13 originally scanned whole FILES for the health labels, which would have passed
with the console's parseHealth broken — every label appears twice per artifact, so a file-global
`includes` proves nothing; scoping each check to the span that writes it, and moving the console to a
behavioural check, is the corrected form. Then check 13 shadowed an outer `absent` with an inner one,
a TDZ that only fires when a file is MISSING — invisible in this repo, caught by guard.test.mjs's
sandbox, which is exactly the case the sandbox exists for. The pattern across this whole remediation is
one question: WHAT UNSTATED PROPERTY MAKES THIS CHECK'S CONCLUSION TRUE? INV-56's rested on its one
:focus-visible rule being universal; "N/N invariants proven" rested on two parsers agreeing; §4v's
anti-steering rested on the printed seed being the seed used; the health board rested on four
hard-coded label lists matching. None of the four was asserted. Ask it of every new guard.
