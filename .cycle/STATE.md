# Cycle State

## Current
Cycle: 6
Phase: verify — implementation, /regression and /reflect are DONE through v1.30.1. Cycle 6 closes with §4v then §6a; a Seams audit is DUE.
Scope: Interactive Console (HTML) + Tooling & Sync Infrastructure + Canonical Templates & Docs
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs && node tests/verification-pack.test.mjs && node tests/mutation-audit.test.mjs && node tests/mutation-audit.mjs
Subsystem cycles since last Seams audit: 3 (cadence 3 — **DUE**: run a Seams & Invariants audit; it resets this to 0)
Updated: 2026-09-03

## In progress (facts to carry forward — NOT judgments)
- Nothing partially done. Cycle 6 implementation is finished; the cycle itself is not closed.
- POST-REFLECT: /reflect already ran and stamped the metrics row (13 − 0). The two production fixes in
  v1.30.0 landed AFTER it and are deliberately NOT in that row — /reflect is the sole writer of those
  columns. §6a should count 15 − 0 for the cycle; the v1.30.0 block states this.
- The next concrete step is /regression, then /reflect (which increments the seam counter to 3/3 = DUE),
  then §4v in a FRESH session (`node scripts/verification-pack.mjs` now scopes to cycle 6 automatically),
  then §6a. The Cycle-6 blocks for §4v are already persisted in .cycle/blocks/06-*.md.
- S5/S7/S8/S9 have still never been walked by a person in a browser. Everything machine-checkable about
  them is now guarded; what remains is whether the result LOOKS right.

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
- Invariant library 58 → 67, all runnable and mutation-proven (75 mutations).

## Pending / not yet done
CLOSING CYCLE 6 — three steps, in this order:
1. SEAMS & INVARIANTS AUDIT (DUE at 3/3). Console §1s, or the "Seams & Invariants Audit" section body
   in CLAUDE.md. Audit-only, no implementation. Run it BEFORE §6a so its horizontal observations feed
   Axis B. On completion RESET the seam counter above to 0 and save the block to
   .cycle/blocks/06-c-seams.md.
2. §4v INDEPENDENT VERIFICATION — MUST be a genuinely FRESH session with zero context from the
   implementation. Assemble the input with:  node scripts/verification-pack.mjs --cycle 6 --out pack.md
   It derives the canonical body, the live 67-invariant library, all five Cycle-6 blocks, rotation probes
   seeded from the HEAD sha, the cycle totals, and an automatic warning that /reflect corrected a
   self-reported count. Paste pack.md in. Save the VERIFICATION BLOCK to .cycle/blocks/06-b-verification.md.
3. §6a HEALTH SYNTHESIS. Inputs are the .cycle/blocks/06-*.md files. TELL IT: the metrics row reads
   13 − 0 because /reflect ran BEFORE the v1.30.0 duplicate-id fixes; the true cycle total is 15 − 0
   with 5 defensive. §6a writes the PROJECT_HEALTH.md update and ONE phase=synthesis metrics row
   (category_d_ratio + axis_b_lowest only — never net_score, P1/INV-33). Then update PROJECT_HEALTH.md
   Current Standing, which is LIVE status read by the Dashboard, both portfolio scripts and the hook.
Then Cycle 7 begins with a fresh /broad-scan (which increments Cycle to 7 per P3).
- ROADMAP R21 is queued as Cycle 7's first item: the /broad-scan dead-artifact lens, with its exact
  replacement text in the roadmap entry. It changes a command body → downstream re-pull.
- ROADMAP R20 (real-DOM console test stage) is recorded but not built, and is now doubly earned: F17's
  fix is pinned by a static CSS rule, and BOTH duplicate-id defects were invisible to the vm harness and
  found only by driving Chromium from a session scratchpad.
- /sync-docs owes one more gotcha: a stubbed DOM that is a flat id→element map cannot represent
  "getElementById returns the first match", so id shadowing is invisible to it by construction.

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

## Where I left off
v1.30.0 pushed on claude/broad-scan-8a6drq; full Test Command green (16 stages, 292 ✓); 67/67 invariants
runnable and mutation-proven across 75 mutations. Cycle 6 is implemented, regressed, reflected, and its
two post-reflect defects are closed. The Tier 1 panel renders for the first time in many releases —
browser-verified, not inferred. Nothing is half-done.

Next action: the three close-out steps in "Pending" above — Seams audit (DUE), then §4v in a FRESH
session, then §6a. Nothing is half-done; each is a clean start.

Worth carrying: THREE of my own guards were wrong on first write this cycle and were caught — two by the
mutation audit (a derivation that narrowed itself on introduction; a regex where \bfor= matched
data-for=) and one by the guard I had just written (an FNV-1a seed appended instead of prefixed, so the
probes never rotated). And the two worst defects of the cycle were invisible to the headless harness
entirely: a flat id→element map cannot model document order. Guards are not free of the defects they
guard against, and a harness's shape decides which bug classes it can never see.
