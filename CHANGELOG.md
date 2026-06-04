# Changelog

All notable changes to the Claude Workflow Tools templates. Bump `VERSION`
(semver) and add an entry here whenever you change command semantics, the
config schema, or the tooling. `/sync-commands` reports this version so
consuming projects know what they are syncing to.

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
