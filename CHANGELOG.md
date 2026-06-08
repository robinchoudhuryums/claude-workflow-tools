# Changelog

All notable changes to the Claude Workflow Tools templates. Bump `VERSION`
(semver) and add an entry here whenever you change command semantics, the
config schema, or the tooling. `/sync-commands` reports this version so
consuming projects know what they are syncing to.

## 1.6.0 — 2026-06-04

Field proposals from a downstream dogfooding session (HIPAA RAG app).

### Changed
- P1 — pinned metrics.csv ownership: net_score/prod_fixes/new_failure_modes
  are written ONLY by the phase=reflect row; implement commands write
  STATE.md, not metrics. Closes a double-count footgun. (CLAUDE.md Cycle
  State note + /reflect METRICS step.)
- P5 — /plan now emits a complete, SEPARATE IMPLEMENTATION HANDOFF BLOCK
  per batch (Batch 2 must stand alone), so a split survives a fresh session.
- P8 — added a "is the tested path the production path?" probe to
  /regression (new step 4) and the /implement dependency check, catching
  Parallel-Source-of-Truth drift during implement instead of after.
- P9 — implement family (/implement, /broad-implement, /targeted-implement)
  now scans for a module's test doubles (mocks/stubs/fixtures encoding the
  OLD behavior) BEFORE editing, not reactively in RUN TESTS.

### Notes
- Command-body changes -> downstream must re-pull via /sync-commands.
- No handoff/summary block SCHEMA changed, so cross-command paste
  compatibility is unaffected. Console prompts regenerated + --assert green.
- Still open from the same review (future versions): P7 (operator-actions
  field), P2 (ID namespacing), P3 (cycle-number SoT), P11 (defensive signal),
  P10 (seam cadence), P4 (pair parity guard).

## 1.5.0 — 2026-06-04

### Changed
- R14 (option a) FINISHED (headless portion): the console static §-prompts
  (p0,p1,p2,p3,p4post,p4reflect,p5) are now GENERATED from CLAUDE.md via
  `gen-html-prompts.mjs --write` and locked by `--assert` in the Test
  Command + CI (INV-29). The HTML-as-fourth-copy drift class is retired for
  these prompts. (Browser render spot-check still recommended.)

### Added
- R3 — IndexedDB persistence for the connected repo folder handle (survives
  reloads), explicit read/write permission checks, and auto-reconnect on
  load. Headless fallback regression test in check-html.mjs (INV-30). The
  real FSA picker/IO flow still needs browser verification.

## 1.4.0 — 2026-06-04

### Added
- R14 (option a) transform engine + drift report (`scripts/gen-html-prompts.mjs`):
  a CLAUDE.md→console prompt transform with a read-only drift report
  (`--check`) and an opt-in `--write`. Makes the console-vs-canonical gap
  measurable; `--write` is browser-verify-only and never run by CI.
  Engine unit test `tests/gen-html-prompts.test.mjs` (INV-28).
- R3 DRAFT (experimental, unverified headless): File System Access option
  in the console Backup & Restore card — "Connect repo folder" syncs state
  to .cycle/console-state.json. Feature-detected; falls back to Export/Import.

### Notes
- R14 in-place `--write` rewrite and the R3 FSA flow both need manual
  browser verification; the drift report measured 0–39% console↔canonical
  overlap (173 canonical lines absent), confirming the rewrite is large.

## 1.3.0 — 2026-06-04

### Added
- Cross-project portfolio dashboard (`scripts/portfolio.mjs`, R8):
  aggregates several projects PROJECT_HEALTH.md "Current Standing"
  sections into one board (lowest overall first = audit next) with the
  portfolio average. Regression test `tests/portfolio.test.mjs` (INV-27),
  wired into the Test Command + CI.

### Notes
- R3 (FSA state-store convergence) and R14 (generate HTML prompts from
  CLAUDE.md) remain open by design — R3 is browser-only (unverifiable
  headless); R14 is a lossy templating transform that risks degrading the
  console prompts. Both need their own focused effort (see ROADMAP/STATE).

## 1.2.0 — 2026-06-04

### Added
- Executable invariant runner (`scripts/invariant-check.mjs`, R9): runs
  every invariant whose `Verify:` field is a command and reports
  PASS/FAIL; prose/test-name fields are MANUAL. `--list` shows the
  classification. The automated half of the §4v invariant probe.
- Regression test `tests/invariant-check.test.mjs` (INV-26), wired into
  the Test Command + CI.

## 1.1.0 — 2026-06-04

### Added
- SessionStart context hook (`scripts/cycle-context.mjs`) — auto-loads the
  cycle substrate (STATE + current standing + invariant count) into each
  new session. Wire via `.claude/settings.json`. (R6)
- Metrics report renderer (`scripts/render-metrics.mjs`) — turns
  `.cycle/metrics.csv` into a markdown trend report (table + sparklines +
  cumulative summary). (R2)
- Regression tests for both (`tests/render-metrics.test.mjs`,
  `tests/cycle-context.test.mjs`), wired into the Test Command + CI.
- ROADMAP R14 (generate the HTML console prompts from CLAUDE.md) recorded.


## 1.0.0 — 2026-06-04

First versioned release. Consolidates the templates, the interactive HTML
console, and the generated `.claude/commands/` directory under a single
canonical source (CLAUDE.md) with a drift guard.

### Added
- Generated `.claude/commands/` directory (`scripts/gen-commands.mjs`) so
  consumers copy a folder instead of transcribing prompts.
- Optional `.cycle/` state directory: `STATE.md`, `metrics.csv`,
  `estimates.csv`; plus `PROJECT_HEALTH.md` at the repo root.
- Cycle navigation commands: `/cycle-status`, `/cycle-resume`, `/cycle-init`.
- Configurable Axis B (horizontal bug-shape) categories per project.
- Executable invariants (`Verify:` field) and per-cycle metrics/estimate logs.
- Manual test mode + Regression Scenarios, Frozen Subsystems, Deploy Command.
- Optional Dynamic Workflows acceleration playbook (Opus 4.8+).
- Sync guard (`scripts/check-template-sync.mjs`) + HTML-JS coverage
  (`scripts/check-html.mjs`) + guard regression test (`tests/guard.test.mjs`),
  all run in CI.

### Changed
- All Tier-3 and utility commands are now inlined in CLAUDE.md (previously
  summaries pointing at the HTML), so `/sync-commands` covers every command.
- broad-scan effort estimates now include a wall-clock time alongside S/M/L.

### Notes
- Versioning starts here; earlier history is in git.
