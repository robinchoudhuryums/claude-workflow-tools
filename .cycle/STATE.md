# Cycle State

## Current
Cycle: 6
Phase: implement — all six batches of the Cycle-6 /broad-scan IMPLEMENTATION BATCH PLAN are complete (v1.27.0, v1.28.0, v1.29.0)
Scope: Interactive Console (HTML) + Tooling & Sync Infrastructure + Canonical Templates & Docs
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs && node tests/verification-pack.test.mjs && node tests/mutation-audit.test.mjs && node tests/mutation-audit.mjs
Subsystem cycles since last Seams audit: 3 (cadence 3 — **DUE**: run a Seams & Invariants audit; it resets this to 0)
Updated: 2026-09-03

## In progress (facts to carry forward — NOT judgments)
- Nothing partially done. Cycle 6 implementation is finished; the cycle itself is not closed.
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
- Invariant library 58 → 66, all runnable and mutation-proven.

## Pending / not yet done
- /regression, /reflect, §4v (fresh session), §6a to close Cycle 6.
- A Seams & Invariants audit is DUE once /reflect increments the counter to 3/3.
- ROADMAP R20 (real-DOM console test stage) is recorded but not built: F17's fix is pinned by a static
  CSS rule, and the Chromium driver used to verify it lives in a session scratchpad, not the repo.

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
v1.29.0 pushed on claude/broad-scan-8a6drq; full Test Command green (16 stages); 66/66 invariants
runnable and mutation-proven. Cycle 6's batch plan is fully implemented — all 17 findings closed
across three releases. Nothing is half-done. Next action is to CLOSE the cycle: /regression, then
/reflect, then §4v in a fresh session, then §6a. Two of my own new guards were wrong on first write
this cycle and the mutation audit caught both; a third (the F14 seed) was caught by the guard I had
just written. That pattern — a new guard born narrower than it looks — is now a Common Gotcha.
