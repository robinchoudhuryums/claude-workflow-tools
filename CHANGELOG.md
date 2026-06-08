# Changelog

All notable changes to the Claude Workflow Tools templates. Bump `VERSION`
(semver) and add an entry here whenever you change command semantics, the
config schema, or the tooling. `/sync-commands` reports this version so
consuming projects know what they are syncing to.

## 1.11.0 — 2026-06-08

R7 — PR-review counterpart. The cycle grades health over time; this adds a
sibling that grades health per-change.

### Added
- New `/pr-review` command: applies the cycle's audit rubrics
  (severity/confidence, "would it fire in production this month," the hard
  regression definition, the test-vs-production-path and test-double
  probes, and an invariant cross-check) to a single PR's diff. Read-only;
  emits a PR REVIEW BLOCK with a verdict + blocking items. Runs by hand
  (`/pr-review 142`) or off a `subscribe_pr_activity` webhook event; posts
  to the PR only on operator request, and treats PR/comment text inside
  webhook / untrusted-external envelopes as untrusted.
- PR REVIEW BLOCK added to the Handoff Block Formats reference.
- Guard marker for the new command in `check-template-sync.mjs`; README
  slash-command + handoff-block tables and a Key Concepts note.

### Downstream impact
- New command — re-pull via `/sync-commands` to pick up
  `.claude/commands/pr-review.md`. Additive; no existing command body,
  config schema, or block schema changed. Not in the HTML console (it is
  a per-change sibling, not a cycle phase), so `--assert` is unaffected.

## 1.10.1 — 2026-06-04

R3 and R14 browser-verified — promoted out of "experimental/draft".

### Changed
- R3 (File System Access repo sync) and R14 (console §-prompts generated
  from CLAUDE.md) passed their browser checks: §0–§5 render cleanly with
  working Fill fields / Copy; FSA Connect / Save→repo / Load←repo /
  reconnect / non-Chromium fallback all work.
- Dropped the "experimental / unverified" labels (HTML Backup & Restore
  card + code comment, README, ROADMAP) and marked R3/R14 DONE.

### Downstream impact
- None requiring a re-pull (UI label + docs only; no command bodies, config
  schema, or block schema changed).

## 1.10.0 — 2026-06-04

P10 from the downstream field review — wires the seam-audit cadence so the
rotation isn't purely manual. Also a one-time .cycle/STATE.md tidy.

### Added
- `Seams Audit Cadence` — a command-readable Cycle Workflow Config field
  (default: every 4 subsystem cycles), and a "Subsystem cycles since last
  Seams audit" counter in .cycle/STATE.md.
- /reflect increments the counter (a completed subsystem cycle); the Seams
  & Invariants audit resets it to 0.
- /audit reads the cadence + counter and flags at the top when a Seams
  audit is DUE; /cycle-status surfaces "K of N (DUE?)". Both tolerate a
  missing counter/cadence (treat as 0 / default 4).

### Changed
- /setup-cycle output and the config schema include the new field; README
  Cycle Rotation documents it. Console p1/p4reflect regenerated; --assert green.
- Tidied this repo's .cycle/STATE.md (removed contradictory STOPPED R3/R14
  lines and stale Cycle-1/2 sections; corrected the version header).

### Downstream impact
- Command-body + config-schema change -> re-pull via /sync-commands. Fully
  backward-tolerant: existing STATE.md without the counter and config
  without the cadence both default gracefully.

### Review status
All concurred proposals (P1, P2, P3, P5, P7, P8, P9, P10, P11) shipped; P4
shipped as a guard; P6 declined.

## 1.9.1 — 2026-06-04

P4 from the downstream field review — MAINTAINER-ONLY tooling; no command
bodies changed, so downstream does NOT need to re-pull.

### Added
- Command-pair parity check in scripts/check-template-sync.mjs (P4):
  asserts the near-duplicate command groups keep their SHARED behaviors in
  sync, so updating one member can't silently leave the others behind —
    - implement family (/implement, /broad-implement, /targeted-implement):
      run-tests step, test-double scan, OPERATOR ACTIONS, manual-mode branch
    - audit family (/audit, /targeted-audit): "fire in production this
      month", OPERATOR ACTIONS SURFACED, "do not flag style preferences"
  This is a GUARD, not factoring — the commands stay self-contained.
- guard.test.mjs gains a 6th case: parity drift (a shared behavior dropped
  from one pair member) is caught.

### Notes
- Chosen over the proposal's "factor the shared body" because the commands
  are standalone prompts with no include mechanism; a guard preserves
  self-containment while killing the drift surface.

## 1.9.0 — 2026-06-04

P11 from the downstream field review — a metrics.csv SCHEMA change (additive,
backward-compatible).

### Added
- `defensive_count` — a SECONDARY signal in .cycle/metrics.csv: the
  Defensive/structural count from /reflect's three-way tally. It does NOT
  enter net_score (the strict "would it fire this month?" gate is
  deliberate), but it makes hardening cycles visible in the trend instead
  of reading as a flat ~0. Surfaced by `render-metrics` (a "def" column +
  a cumulative "Defensive/structural items (secondary)" line).
- Appended as the LAST column (after the quoted notes) so older files
  parse unchanged. `render-metrics` shows the column only when present;
  tests cover both the new schema and an old (pre-column) file.

### Changed
- CLAUDE.md metrics schema note, /reflect METRICS step, and /cycle-init
  header now include defensive_count. This repo's .cycle/metrics.csv header
  updated (existing rows read blank for it).

### Downstream impact
- Command-body changes -> re-pull via /sync-commands. For projects that
  already have a .cycle/metrics.csv: optionally append `,defensive_count`
  to the header to start populating it — existing rows keep working without
  it (render-metrics tolerates the missing column). No data rewrite needed.

### Still open from the review
P10 (seam cadence wired), P4 (pair parity guard, maintainer-only). P6 declined.

## 1.8.0 — 2026-06-04

P2 + P3 from the downstream field review — clarifications, no block-schema change.

### Changed
- P2 — finding-ID namespacing made explicit:
  - /audit states finding IDs are SESSION-LOCAL (F1, F2, …), not
    invariant-library IDs, so parallel audits don't collide.
  - /reflect (invariant growth) and the Seams audit (invariant discovery)
    now assign INV-N by reading the library's current max and incrementing,
    rather than the model picking a number.
- P3 — cycle numbering single source of truth:
  - Defined the increment rule (a new number begins only when a fresh
    /broad-scan or /audit starts after the prior cycle's /reflect; initial
    setup + first scan = Cycle 1) in CLAUDE.md "Cycle State & Memory".
  - .cycle/STATE.md's Cycle field is authoritative; /reflect stamps the
    metrics.csv cycle column from it; /cycle-status surfaces it and flags
    any metrics row whose cycle disagrees.

### Downstream impact
- Command-body changes -> re-pull via /sync-commands. No block-schema or
  data-format change. Console p1/p3 regenerated; --assert green.

### Still open from the review
P11 (defensive_count metric — schema change + backward-compat), P10 (seam
cadence), P4 (pair parity guard). P6 declined.

## 1.7.0 — 2026-06-04

P7 from the downstream field review — a handoff/summary BLOCK-SCHEMA change.

### Changed
- P7 — operator-only state is now a first-class field, not prose:
  - SESSION HANDOFF BLOCK (/audit) + TIER 2 HANDOFF BLOCK (/targeted-audit)
    gain "OPERATOR ACTIONS SURFACED" (each line tagged BLOCKS DEPLOY: Y/N).
  - IMPLEMENTATION HANDOFF BLOCK (/plan) gains "OPERATOR ACTIONS" carried
    forward to implement.
  - IMPLEMENTATION / BROAD SCAN / TARGETED SUMMARY BLOCKS subsume the old
    "DEPLOY STEP:" footer into "OPERATOR ACTIONS / DEPLOY:" — an operator-
    steps list (BLOCKS DEPLOY tags) plus the Deploy command line. The
    v1.5.0 Deploy Command value is preserved as the "Deploy:" sub-line.
  - Handoff Block Formats reference updated to match.

### Downstream impact
- BLOCK SCHEMA changed → re-pull via /sync-commands. The change is
  additive/rename and backward-tolerant: an old handoff block pasted into a
  new command is fine (missing field reads as None); the deploy command is
  retained. No data migration.
- Console §-prompts (p1/p2/p3) regenerated; --assert green.

### Still open from the review
P2 (ID namespacing), P3 (cycle-number SoT), P11 (defensive_count metric),
P10 (seam cadence), P4 (pair parity guard). P6 declined.

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
