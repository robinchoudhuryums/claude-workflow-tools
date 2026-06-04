# Changelog

All notable changes to the Claude Workflow Tools templates. Bump `VERSION`
(semver) and add an entry here whenever you change command semantics, the
config schema, or the tooling. `/sync-commands` reports this version so
consuming projects know what they are syncing to.

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
