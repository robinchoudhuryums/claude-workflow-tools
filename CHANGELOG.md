# Changelog

All notable changes to the Claude Workflow Tools templates. Bump `VERSION`
(semver) and add an entry here whenever you change command semantics, the
config schema, or the tooling. `/sync-commands` reports this version so
consuming projects know what they are syncing to.

## 1.19.1 — 2026-07-27

Console security + reliability fixes from the Cycle-5 `/broad-scan` (F01, F04,
F05, F08). Console and tooling only — **no command semantics or config-schema
change, so no `/sync-commands` re-pull is required**.

### F01 (Critical) — a GitHub token could be written into your repository
`collectState()` gathered every `ccg:*` key, and R17 had added the Dashboard's
optional PAT at `ccg:ghToken`. Both **Export state** (a downloadable file) and
**Save → repo** (which writes `.cycle/console-state.json` *inside* a git repo
this workflow tells you to commit) therefore serialized the token in plaintext,
while the console's own UI claimed it was "stored only in this browser."
- Added `SECRET_KEYS` / `isSecretKey()`. Secrets are excluded from
  `collectState()` **and** from `stateBackupKeys()` — so a backup can neither
  carry a credential out nor install one from someone else's file.
- **Deny by default:** anything under `ccg:secret:*` is excluded automatically,
  so a future secret cannot silently rejoin the wildcard the way this one did.
- Corrected the UI note; added `.gitignore` covering
  `.cycle/console-state.json` as a second layer.
- **Operator action:** any state file exported or committed before this release
  may contain a live token — rotate it.

### F04 (High) — stored content reached innerHTML and inline handlers unescaped
INV-20 was only partly applied. Six sinks interpolated stored values raw:
`renderCycle` (label + `advancePhase`/`setPhase` args), `renderSubsysTable` and
`renderT2SubsysTable` (hand-rolled quote escaping that handled `'` but not `"`),
`renderProjectSelector`, `renderCustomInvariantsList`, and `dashboardCard`
(`href` plus two handler args). Reachable by typing a subsystem name containing
`"`, or by importing/loading a state backup, where every field is attacker
controlled. All now use `esc()` for text and `esc(JSON.stringify(...))` for
attribute-context JS args.
- The `dashboardCard` case was the subtle one and was **not** in the original
  finding: it already called `esc()`, but inside `'...'` in an `onclick` — and
  `esc()` renders `'` as `&#39;`, which the browser decodes back to `'` before
  parsing the handler. It looked escaped and was not.

### F05 (Medium) — copy failed silently
`doCopy`/`doCopyVerification` called `navigator.clipboard.writeText(...).then()`
with no `.catch()` and no availability guard, so on `file://`, in any non-secure
context, or on a permission denial the console's primary action did nothing and
said nothing. Factored into one `copyToClipboard()` with an `execCommand`
fallback and a visible "Copy failed" state on the button.

### F08 (Medium) — the tabbed navigation had no coverage
`check-html`'s stub returned `[]` from every `querySelectorAll`, so
`showPanel()`/`handleHash()` ran against nothing and any assertion about them
passed vacuously. Added real panel/nav fixtures and assertions for
single-panel isolation, nav + `aria-current` sync, unknown-id fallback, and
hash routing.

### Test coverage
Nine new `check-html` assertions, every one mutation-proven to fail closed. The
escaping check is now two-layered: a substring scan for the text half, and — for
inline handlers — **entity-decode-then-execute in a sandbox with a tripwire**,
because a substring scan structurally cannot see the `&#39;` case above. This
also retires INV-20's false green: its `Verify` previously ran a check that only
tested `esc()` in isolation, never that `esc()` was *applied*.
`INV-09` reworded; `INV-40`/`41`/`42` added (42 total; 29 runnable PASS).

## 1.19.0 — 2026-07-27

Adds the interface & visual layer to the audit lens (ROADMAP R18). Command
semantics and the config schema both change → **`/sync-commands` re-pull
required**. Backward-compatible: no config field becomes mandatory, no output
block changes shape, and projects with no user-facing surface skip the new
section entirely.

### Why it was missing
Across all 20 command templates the entire UI/UX surface was one line
(`/broad-scan` Stage 3, "Where is the UX friction?" — and that asks about
*workflow* friction, not the visual layer). Three causes: the **verification
bar** (every rubric here is built on what an agent can prove from code + a Test
Command, and visual correctness has no such proof surface — the same discipline
that HELD R11); **origin domain** (both built-in projects are server-heavy SaaS
with UI as one subsystem of 8–12, and all five default Axis B categories are
backend failure shapes); and **no scoring slot** — a user-visible interface
defect answered NO to `/reflect` Q1, landed in defensive/structural, and was
excluded from `net_score`, so it could never appear in the trend.

### D1 — `/broad-scan` Stage 3 interface lens
- New **INTERFACE & VISUAL LAYER** section, gated on the project having a
  user-facing surface (a library/CLI/service writes "No user-facing surface —
  not assessed" and skips it).
- Splits findings into **(a) STRUCTURAL** — verifiable by code read, reported
  as findings under the Stage 1 rubric (keyboard/assistive access, missing
  empty/loading/error states, responsive posture, theme completeness,
  design-token bypass, feedback on failure) — and **(b) PERCEPTUAL**
  (contrast, hierarchy, spacing), which the audit is explicitly forbidden from
  reporting as findings or guessing at.
- Perceptual items route to a new **OPERATOR VISUAL CHECKS** output, written in
  `Regression Scenarios` format so they can be promoted into that block and
  walked every cycle instead of living as a "worth an eyeball" handoff note.
- New **INTERFACE FINDINGS** output section. Stage 3 question 3 reworded
  `UX friction` → `workflow friction` so it no longer overlaps the new lens.

### D2/D3 — config schema + `/setup-cycle`
- Schema notes (all three copies — template block, `/setup-cycle` OUTPUT 1, and
  the console's setup `<pre>`): include an interface Health Dimension when the
  project has a client surface; optionally swap an Axis B category for
  `Visual / Interaction Regression Posture`; visual checks are homed in
  `Regression Scenarios`.
- `/setup-cycle` Phase 1 now profiles **user-facing surfaces**, and Phase 4
  *proposes* the interface dimension rather than hoping it emerges — this
  repo's own 12 dimensions had none despite the console being its entire face.

### D4 — scoring slot (`/reflect`)
- Q1 now counts a user-visible interface defect (broken layout, unreachable
  control, missing error state on a path users hit) as **YES** — its trigger is
  a user opening the surface, not load.
- **Trend discontinuity, deliberate:** cycles before 1.19.0 scored these as
  defensive/structural and excluded them from `net_score`. Cumulative
  `net_score` across the 1.18.0 boundary is therefore computed on a slightly
  different rule. Nothing was rewritten retroactively.

### Guard + console
- `§T1 buildTier1Text` reconciled to the new canonical body; still
  `--assert`-locked at 100% canonical line coverage (6/7 builders locked).
- `check-template-sync` gains two R18 markers pinning the lens heading **and**
  the perceptual routing target across CLAUDE.md / console / README — the
  (a)/(b) split is the load-bearing part, so the guard pins the routing, not
  just the heading. Two fail-closed cases added to `guard.test.mjs` (now 11).
- `INV-39` added (39 invariants).
- Deferred by decision: the same lens for `/audit` and `/pr-review` — ship
  `/broad-scan` first, run it on a real UI project, then decide.

> Also carried in this release (shipped to `main` after 1.18.0 without their own
> version bump): the console's tabbed panel navigation, inline-style colour
> tokenization, and style-class extraction.

## 1.18.0 — 2026-06-17

Closes the last unguarded gaps in the HTML console — both 8.5 priorities from
the Cycle-4 synthesis (top vertical: "browser-only render/FSA paths not
headless-tested"; top horizontal: "dynamic console builders marker-pinned but
not generated"). No command body / config schema change → no `/sync-commands`
re-pull.

### W2 — headless coverage of browser-only paths
- `check-html` now captures `innerHTML` per element id and asserts the render
  *outputs* (subsystem table, invariant table, cycle tracker, Dashboard board),
  not merely that init didn't throw. Proven fail-closed via mutation.
- Factored the duplicated state-import logic in `importStateFile` and
  `loadStateFromRepo` into shared `stateBackupKeys` / `applyStateKeys` helpers
  (the Parallel-Source-of-Truth shape the tool polices), then headless-tested
  the serialize→wipe→restore round-trip — every `ccg:*` key restores losslessly,
  foreign keys dropped on both sides.

### W1 — full textual lock of the remaining dynamic builders (R16-full)
- §4v (`buildVerificationText`), §1s (`buildSeamsText`), §6a (`buildP6aText`)
  were marker-pinned but not textually locked (no canonical body to diff). Added
  `sectionBody()` — extracts a canonical body from a fenced block under a
  non-slash `### ` heading, so these cycle-type prompts get locked **without
  minting a slash command**. Each now carries its full canonical body in
  CLAUDE.md and is gated by `gen-html-prompts --assert` at 100% line coverage.
- **6 of the 7 dynamic builders are now textually locked** (was 3); only §T2b
  remains report-only-by-design. Zero marker-only builders left. The §6a lock
  specifically catches the Cycle-4 F1 class (the metrics-ownership rule is now
  pinned — proven fail-closed).
- Registered the `SEAMS & INVARIANTS AUDIT BLOCK` (§1s) and `POLICY RESPONSE`
  (§6a) output blocks in `check-output-blocks` + homed them in Handoff Block
  Formats, so their shape is guarded now that they live in CLAUDE.md.
- Added `sectionBody` unit tests; check-template-sync's marker pins are retained
  as a documented secondary layer (defense-in-depth).

### Roadmap reconciliation
- Marked R4 (`/cycle-init`), R6 (SessionStart hook), R8 (`portfolio.mjs`) DONE —
  shipped earlier but never reflected. R16 closed in full.

## 1.17.0 — 2026-06-17

Hosted-console UX: a project Dashboard, light mode, and working mobile nav.
All in `claude-code-guide-v2.html` (the GitHub Pages tool) — no command body,
config schema, or output-block change, so no `/sync-commands` re-pull.

### Added
- **Dashboard** — a new landing section showing live status for each configured
  project. Data source is GitHub-primary with a fallback chain: live fetch of
  `PROJECT_HEALTH.md` + `.cycle/STATE.md` (raw URL for public repos, contents
  API for private when a token is set) → last-cached (with relative timestamp)
  → self-reported → "no source". Per-card ⚙ editor sets the `owner/repo[@branch]`
  mapping and a manual fallback; an optional read-only GitHub token (stored only
  in `localStorage`, sent only to `api.github.com`) covers private repos and
  rate limits. All network calls are deferred via `setTimeout`, so the headless
  `check-html` / `gen-html-prompts --assert` stubs never touch `fetch`.
- **Light / dark theme** — a `[data-theme="light"]` chrome flip (prompt/code
  blocks stay dark in both themes for legibility); toggle in the sidebar + mobile
  bar; persists to `localStorage` (`ccg:theme`); first load respects
  `prefers-color-scheme`.
- **Mobile navigation** — the 768px breakpoint used to do `nav{display:none}`,
  leaving phones with no nav at all. Replaced with a slide-in drawer + hamburger
  in a sticky top bar + tap-backdrop; nav links close the drawer.

### Guarded
- INV-37: the Dashboard's pure parsers (`parseHealth` / `parseState` /
  `parseRepoSpec` / `scoreColor`) are locked by `check-html`, verified against
  real `PROJECT_HEALTH.md` / `STATE.md` shapes, so a regex regression can't
  silently blank the board.

### New localStorage keys
`ccg:theme`, `ccg:dashRepos`, `ccg:dashCache`, `ccg:dashManual`, `ccg:ghToken`.

## 1.16.0 — 2026-06-16

R16 (increment 3 — **COMPLETE**) — §6b locked, §T2b resolved by design.

### Added
- `buildP6bText` (§6b) synced to 100% of `/health-pulse` and **locked** (INV-36).
  Canonical `/health-pulse` is standalone (no delegation), so this was the §T1
  pattern: mirror the canonical prose, keep the console's injected concrete data
  (`Dimensions for this project: …`, the project's Axis B categories) as extras.
  The prior console copy had drifted in wording and added its own scaffolding.

### Resolved
- §T2b (`buildTier2ImplText` ← `/targeted-implement`) is **report-only by design**,
  not paused. Canonical `/targeted-implement` deliberately delegates to
  `/broad-implement` Step 1, while the console prompt must be standalone (a console
  user copies one prompt with no sibling in front of them) — so the divergence is
  intentional. Locking it would force the Step-1 detail to be duplicated into the
  canonical command, contradicting the repo's "parity-guard, not factoring"
  decision. It stays guarded by the R16-S parity markers (a dropped/renamed
  contract still fails closed) rather than the textual lock.

### R16 outcome
3 of 4 dynamic builders locked (§T1, §T2a, §6b); 1 report-only by design (§T2b).
The dynamic console builders are now contract-locked to CLAUDE.md — closing the
gap R14 left (it covered only the static `<pre>` §-prompts).

### Downstream impact
- The §6b console prompt text changed — re-copy the HTML console if you use it. No
  `.claude/commands/` body, config schema, or output-block schema changed → no
  `/sync-commands` re-pull.

## 1.15.0 — 2026-06-16

R16 (increment 2) — §T2a locked to /targeted-audit.

### Added
- `buildTier2AuditText` (§T2a) synced to 100% of `/targeted-audit` and **locked**
  (INV-36, now covering both locked builders). The console prompt was a
  paraphrased, **older** copy that had dropped two later canonical additions —
  the `OPERATOR ACTIONS SURFACED` block (P7) and the `[IF TRIGGERED: …POLICY
  RESPONSE BLOCKS…]` scope trigger — and reworded the rest; both are now restored
  and the wording matches canonical.
- `DYNAMIC_MANIFEST` entries may carry a `replace` map (same shape as the static
  MANIFEST) so a builder that substitutes `$ARGUMENTS` → `[SUBSYSTEM GROUP NAME]`
  is compared against the canonical body with the same substitution applied.

### Downstream impact
- The §T2a console prompt text changed (restores operator-actions surfacing +
  policy-response trigger) — re-copy the HTML console if you use it. No
  `.claude/commands/` body, config schema, or output-block schema changed → no
  `/sync-commands` re-pull. §T2b/§6b remain report-only, paused on the R16
  standalone-vs-canonical decision.

## 1.14.0 — 2026-06-16

R16 (first increment) — dynamic-builder lock engine + §T1 locked to /broad-scan.
Extends the R14 generation lock from the static §-prompts to the runtime
prompt builders.

### Added
- `gen-html-prompts.mjs`: a headless render-and-compare engine for the dynamic
  builders. `renderDynamicPrompt()` executes the console's inline `<script>`
  under a stubbed DOM and returns a builder's output; `canonicalCoverage()`
  requires 100% of a canonical command's lines to be present (injected config =
  ignored extra lines). A `DYNAMIC_MANIFEST` marks each builder `locked` (gated
  by `--assert`) or report-only. `--assert` now also gates locked builders; the
  default drift report shows per-builder canonical coverage.
- `buildTier1Text` (§T1) reconciled to 100% of `/broad-scan` and **locked**
  (INV-36) — the canonical "rate each Health Dimensions entry" sentence is
  restored (the injected dimension list follows it) and the frozen-subsystem
  line matches canonical.
- `tests/gen-html-prompts.test.mjs`: 6 new cases (canonicalCoverage fail-closed +
  extra-line tolerance + drop; renderDynamicPrompt project/no-arg/missing paths).

### Notes / paused
- Measured coverage exposed that §T2a (56%), §T2b (4%), §6b (0%) materially
  diverge — and that canonical `/targeted-implement` & `/health-pulse` delegate
  to sibling commands, so locking them as-is would regress the console's
  standalone prompts. They are tracked report-only in the drift report and
  **paused** pending the ROADMAP R16 decision (expand canonical to standalone vs.
  keep the richer console prompts). check 6/7 (R16-S markers) still guard them.

### Downstream impact
- The §T1 console prompt text was refined toward canonical — re-copy the HTML
  console if you use it. No `.claude/commands/` body, config schema, or
  output-block schema changed → no `/sync-commands` re-pull for commands. The
  engine is maintainer tooling.

## 1.13.0 — 2026-06-16

R15 — cross-project development-status board. The status sibling of the R8
health dashboard.

### Added
- `scripts/portfolio-status.mjs`: joins each project's `PROJECT_HEALTH.md`
  health score with the `.cycle/` data it already writes — `STATE.md`
  (phase, in-progress, "Subsystem cycles since last Seams audit" K vs the
  cadence N → DUE) and `metrics.csv` (net-score trend) — into one board:
  `Project | Overall | Phase | In-progress | Net Δ | Seams | Updated`. Ranks
  lowest-overall first; surfaces in-progress projects to /cycle-resume and
  DUE seams audits; projects without a `.cycle/` directory still list (status
  columns degrade to `—`). Same args as `portfolio.mjs`; `--out FILE` writes.
- `tests/portfolio-status.test.mjs` (INV-35): fixture projects prove the
  join, ranking, seams-DUE/cadence, net trend (comma-in-notes safe), and the
  no-`.cycle/` degradation. Wired into the Test Command + CI.

### Downstream impact
- Additive helper — copy `scripts/portfolio-status.mjs` if you want it. No
  command body, config schema, or output-block schema changed → no
  `/sync-commands` re-pull needed for commands.

## 1.12.2 — 2026-06-16

R16 (S half) — per-builder parity guard for the DYNAMIC console prompt builders.
Closes the residual that Cycle-4 F1 exposed: R14 locked the static §-prompts,
but the per-project dynamic builders were only marker-pinned for known points.

### Added
- `check-template-sync.mjs` structural check 7: pins each dynamic builder
  (`buildP6aText` §6a, `buildP6bText` §6b, `buildSeamsText` §1s,
  `buildVerificationText` §4v, `buildTier1Text`, `buildTier2*Text`) to a small
  set of load-bearing contract markers that must co-occur in BOTH CLAUDE.md and
  the HTML console — a dropped/renamed contract now fails closed (6 builders).
- `guard.test.mjs` 9th case proving the new check fails closed on a dropped
  contract marker (§6a "TWO-AXIS GRID").

### Notes
- Maintainer-only repo tooling (like `check-html`/`check-template-sync`); no
  command body, config schema, or output-block schema changed — no downstream
  re-pull. The `S` half of R16; full generation of the dynamic builders (M–L)
  stays open on the roadmap.

## 1.12.1 — 2026-06-16

Cycle 4 dogfood broad-scan — fixes a cross-artifact drift the guard couldn't
see: the non-R14-generated HTML §6a synthesis prompt still violated the P1
metrics-ownership rule.

### Fixed
- HTML §6a Health Synthesis prompt (`buildP6aText`): the `phase=synthesis`
  metrics row was instructed to write `net_score`/`prod_fixes`, contradicting
  the canonical P1 rule (those columns are owned ONLY by `phase=reflect` rows,
  v1.6.0). `render-metrics` sums every row, so this double-counted the trend.
  Now it writes only `category_d_ratio` + `axis_b_lowest` and leaves the
  reflect-owned columns blank (F1).
- HTML §6a metrics header updated to the 11-column P11 schema (adds the
  trailing `defensive_count`) — it was the stale pre-v1.9.0 10-column header (F2).
- This repo's `.cycle/metrics.csv` Cycle-1 synthesis row had the double-count
  baked in (`net_score=2,prod_fixes=2` duplicating the two reflect rows);
  blanked those fields. Cumulative net 10 → 8 (true 9 fixes − 1) (F3).
- `README.md` "What's in this repo" listed only 2 of 9 scripts; now lists all (F5).

### Added
- `check-template-sync.mjs` structural check 6 (F4): fails closed if any
  `metrics.csv` header in CLAUDE.md/HTML drops `defensive_count`, or if the
  §6a synthesis step is told to write `net_score` (the double-count footgun).
  Two fail-closed cases added to `guard.test.mjs`.

### Downstream impact
- None requiring a re-pull: §6a is HTML-console-only (not a slash command),
  and no `.claude/commands/` body, config schema, or output-block schema
  changed. Maintainer-side correctness + guard hardening.

## 1.12.0 — 2026-06-08

R13 — prompt-output regression harness. Extends the sync guard from
structure to output shape.

### Added
- `scripts/check-output-blocks.mjs`: validates every workflow output block
  in CLAUDE.md — balanced `---NAME---` / `---END…---` delimiters (incl. the
  asymmetric SESSION HANDOFF close), all required fields present, the
  producing command still emits the block, no field drift between a
  command's inline copy and the Handoff Block Formats reference, and no
  unregistered block delimiter. 10 blocks covered.
- `tests/check-output-blocks.test.mjs`: proves the harness fails closed on
  a dropped field, a broken/renamed delimiter, a producer that stops
  emitting its block, and an unregistered new block.
- Wired both into the Test Command and CI; new invariants INV-31 (shape
  valid) and INV-32 (fails closed) in `.cycle/config.md`.

### Notes
- Maintainer-only repo tooling (like `check-html` / `check-template-sync`),
  not part of the project-agnostic command set — no downstream re-pull, no
  command body / config / block schema change.
- The static, deterministic half of R13; live-LLM execution against fixture
  repos (real output capture) is non-deterministic and out of scope for CI.

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
