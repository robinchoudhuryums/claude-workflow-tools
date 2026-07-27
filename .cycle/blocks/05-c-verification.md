---VERIFICATION BLOCK---
Verified scope: Canonical Templates & Docs + Interactive Console (§T1 builder) + Tooling & Sync Infrastructure
Verification date: 2026-07-27
Cycle being verified: claude-workflow-tools Cycle 5 (v1.19.0 → v1.22.0), base d12c347

INVARIANT PROBE RESULTS:
Probed: 24 | Passed: 23 | Failed: 1 | Unverified: 0
INV-20 | stored content HTML-escaped at every render sink | FAIL | rule holds in code, but the Verify does NOT
  enforce it. The hostile fixture makes only SOME fields per record hostile (text:'imported', subsystem:'s'), so
  dropping esc() from ${esc(inv.text)} or ${esc(inv.subsystem)} passes all 13 stages. Hostile fields (inv.id,
  p.name) ARE caught. Same defect class as INV-23's false green — F11's sweep missed it.
INV-34 | builder contract markers co-present | PASS (weak) | markers are file-global substrings; backstopped by
  INV-36, which did catch both at builder level.
All other probed invariants PASS, each by mutation rather than by reading test names:
INV-01, 09, 10, 22, 23, 25/51, 27, 31, 33, 36, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50.

REGRESSION COUNT:
Regressions found: 0
Independently re-derived the feared regression (9 controls made focusable could have been focusable-but-
invisible): all 17 outline:none rules sit on form inputs; none touch the newly-focusable div/span/tr controls,
so the UA default ring survives. Claim confirmed. Also checked and rejected as regressions: secrets no longer
restored from backup; phase dots naming via `title`; subsystem row double-handler (stopPropagation verified).
Net score: 10 − 0 = 10

CYCLE EXECUTION QUALITY:
Tests run to completion: YES — all 13 stages re-run at HEAD by the verifier; every stage exit 0.
Common Gotchas cross-checked: NO for the first three releases — the section did not exist until commit 18ba010,
  which landed after v1.20.0. Batches 1–3 ran under commands instructing "check Common Gotchas before each fix"
  with nothing to check. YES for v1.21.0/v1.22.0.
New Common Gotchas added: YES — the entire 10-entry section was created this cycle.

COVERAGE GAP REPORT:
Fixes with regression tests: 8 of 10 fully covered (verified by mutation, not by reading test names)
Category D candidates:
F15 | CI permissions: contents: read | no test asserts the workflow's permissions block
F04 | escaping at render sinks | partial — inv.text/inv.subsystem left benign in the fixture (see INV-20)
F05 | copy never fails silently | partial — archive "Copy content" calls navigator.clipboard.writeText()
     inline with no .catch() and no fallback, bypassing copyToClipboard(). The exact bug F05 fixed, still
     live in one sink. legacyCopy()'s success path also stays unexercised.
—   | HTML static block-format <pre> displays | no shape check at all; check-output-blocks validates
     CLAUDE.md ↔ .claude/commands only.
Category D ratio: 20%
---END VERIFICATION BLOCK---

PROPOSED INVARIANTS (from the verifier):
INV-53 | Every stored field reaching a render sink is hostile in the check-html fixture — the payload set is
  DERIVED from the sink's interpolated fields, not hand-picked | Guards INV-20's coverage claim | Testable: yes
INV-54 | Every clipboard write goes through copyToClipboard() — no inline handler calls navigator.clipboard
  directly | Testable: yes, a static scan mirroring the jsArg guard
INV-55 | Workflow output blocks rendered in the console's static <pre> displays are shape-checked against the
  same registry as CLAUDE.md's | Testable: yes, extend check-output-blocks to the HTML
INV-56 | Any control with outline:none supplies an alternative focus indicator | Testable: yes, structurally.
  16 of 18 outline-suppressing controls have no :focus replacement; the file has zero :focus-visible rules.
  Pre-existing, but Batch 6 routed focus visibility entirely to the perceptual bucket when half is structural.
