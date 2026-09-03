# Roadmap — Claude Workflow Tools

Forward-looking work for this repo and adjacent workflow-optimization
projects. Organized in the four-tier format produced by `/roadmap`
(this repo dogfooding its own command). Tiers 1–3 are grounded in
specific gaps; Tier 4 is exploratory. Effort: S ≈ <2h, M ≈ ½–2 days,
L ≈ 3+ days for one developer working with Claude Code.

Item IDs (R#) are stable references for planning sessions.

---

## Tier 1 — Short-term (days–weeks)

- **R20 — Real-DOM console test stage.** `effort: M (~1 day)`
  The Cycle-6 scan found two High findings no headless check could see —
  a fill-form XSS sink that only renders on interaction (F01) and a mobile
  layout that put the top bar in a side column below 768px (F17) — by
  driving the pre-installed headless Chromium with a small driver page and
  asserting DOM geometry, `:focus-visible` box-shadow, and payload
  execution. The vm-stub harness (`check-html`) cannot see layout,
  transitions, or a real parser. Promote that driver into `tests/` as a CI
  stage (geometry at 375/768px, focus ring on each control type, hostile
  fixture executed through `toggleFill`), so S6/S7's structural halves stop
  being "never walked" and F17's guard is a measurement rather than a
  static CSS rule. Same lesson as R14/R16: what has no proof surface gets
  no guard.

- **R1 — Dogfood the workflow on this repo itself.** `effort: S`
  The tool ships its own `.claude/commands/` as skills but has never
  been run through its own cycle. Run `/setup-cycle`, write its Cycle
  Workflow Config, and do one real `/broad-scan` → `/broad-implement`.
  Fastest way to surface friction invisible from the outside, and it
  will likely re-prioritise the rest of this roadmap. *(In progress —
  `/setup-cycle` is the first step.)*

- **R4 — `/cycle-init` scaffolding command.** `effort: S` — ✅ DONE.
  `/cycle-init` (`.claude/commands/cycle-init.md`) creates `.cycle/`, seeds
  `STATE.md` from the template, stubs `metrics.csv` / `estimates.csv` /
  `PROJECT_HEALTH.md`, and never overwrites an existing file. Removes the manual
  `mkdir` + copy friction from adopting the file-backed state flow.

- **R5 — Command versioning + changelog.** `effort: S`
  Add a `VERSION` / `CHANGELOG.md` and a version marker the guard
  checks, so `/sync-commands` can report *what changed and why* across
  consuming repos, not just *that* text differs. Matters now that
  updates roll across multiple projects (Observatory, CallAnalyzer,
  pers-fin).

- **R10 — Estimate calibration loop.** `effort: S`
  We already capture S/M/L + wall-clock estimates. Log estimate-vs-actual
  over cycles (a metrics column) and surface personal calibration
  ("your L's actually take 5 days"). Cheap, compounding accuracy gain.

## Tier 2 — Medium-term (weeks–months)

- **R6 — SessionStart context-loader hook.** `effort: S–M` — ✅ DONE.
  `scripts/cycle-context.mjs` (wired as a `SessionStart` hook) auto-loads the
  STATE substrate + Current Standing + invariant count into every session;
  fail-safe (prints nothing with no `.cycle/`). Directly retired the tool's
  most-cited friction ("paste the systems map every session") and the
  cross-session memory burden the handoff-block system works around.

- **R2 — Metrics → visualization.** `effort: M`
  Phase 3 added `metrics.csv` + `PROJECT_HEALTH.md` history but nothing
  renders them — and long-term progress tracking is the HTML tool's
  reason to exist. A generator (markdown sparkline tables, or a chart
  view in the HTML that reads an imported `metrics.csv`) makes trend
  tracking data-driven instead of hand-maintained. The missing half of
  the Phase 3 work.

- **R7 — PR-review counterpart.** `effort: M` — ✅ DONE (v1.11.0). New
  `/pr-review` command applies the cycle's rubrics (severity/confidence,
  "would it fire in production this month," the hard regression
  definition, test-vs-prod-path + test-double probes, invariant
  cross-check) to a single PR's diff and emits a PR REVIEW BLOCK. Runs by
  hand or off a `subscribe_pr_activity` webhook event; posts only on
  operator request. Health over time now has a sibling for health
  per-change.

- **R8 — Cross-project portfolio dashboard.** `effort: M` — ✅ DONE.
  `scripts/portfolio.mjs` aggregates each repo's `PROJECT_HEALTH.md` "Current
  Standing" into one board ranked lowest-overall-first (with the portfolio
  average) — "which project across my portfolio most needs attention." R15
  extended it with the development-status sibling (`portfolio-status.mjs`).

- **R15 — Portfolio *status* board (extends R8).** `effort: S–M (~½ day)` — ✅ DONE (v1.13.0). `scripts/portfolio-status.mjs` joins health with `.cycle/` STATE + metrics into a `Project | Overall | Phase | In-progress | Net Δ | Seams | Updated` board; fail-closed test (INV-35) wired into the Test Command + CI.
  `portfolio.mjs` (R8) ranks projects by *health score* (it reads only the
  `Current Standing` block), but not by *development status*. Join it with
  the `.cycle/` data every project already writes — `STATE.md` (`Phase`,
  "Where I left off", `Updated`, the seams counter) and `metrics.csv`
  (trend) — to emit a board with columns: Project | Overall | Phase |
  In-progress? | Trend | Seams DUE? | Last updated. Turns "which is
  unhealthiest" into "what's the state of each, and where's my next
  action." Lean toward a separate `portfolio-status.mjs` so R8's
  health-only board and its test stay untouched; ship with a fail-closed
  test + an invariant. (Surfaced by the Cycle-4 reflect Q: cross-project
  status tracking.)

- **R18 — Interface & visual layer in the audit lens.** `effort: M` — ✅ DONE (v1.19.0).
  Across all 20 command templates the entire UI/UX surface was ONE line
  (`/broad-scan` Stage 3: "Where is the UX friction?" — and even that is
  *workflow* friction, not the visual layer). `/audit`'s 12 focus areas,
  `/targeted-audit`'s 5 and `/pr-review`'s 9 lenses had nothing visual. Three
  causes, in order of weight: (1) **the verification bar** — every rubric here
  is built on what an agent can prove from code + a Test Command, and visual
  correctness has no such proof surface (the same discipline that HELD R11);
  (2) **origin domain** — both built-in projects are server-heavy SaaS with UI
  as one subsystem of 8–12, and all five default Axis B categories are backend
  failure shapes; (3) **the scoring machinery had no slot** — a user-visible
  interface defect answers NO to /reflect Q1 ("fired under realistic load?"),
  lands in defensive/structural, and is excluded from `net_score` by design, so
  it could never show in the trend.
  Shipped as four coupled parts: **D1** `/broad-scan` Stage 3 gains an
  INTERFACE & VISUAL LAYER lens, gated on the project having a user-facing
  surface, splitting findings into (a) STRUCTURAL — verifiable by code read,
  reported as findings — and (b) PERCEPTUAL — contrast/hierarchy/spacing, which
  the agent must NOT guess at and instead routes to OPERATOR VISUAL CHECKS in
  Regression-Scenario format; **D2** config-schema notes (interface Health
  Dimension, optional `Visual / Interaction Regression Posture` Axis B
  category, visual checks homed in Regression Scenarios); **D3** `/setup-cycle`
  proposes the interface dimension instead of hoping it emerges (this repo's
  own 12 dimensions had none, despite the console being its entire face);
  **D4** `/reflect` Q1 counts a user-visible interface defect as YES.
  Deferred by decision: the same lens for `/audit` and `/pr-review` — ship
  `/broad-scan` first, run it on a real UI project, then decide (per-change
  review in `/pr-review` is the likelier winner). Subsumes R17's
  "accessibility (keyboard) pass on custom controls" follow-on by making it a
  standing audit lens rather than a one-off.

- **R19 — Verification pack assembly (`scripts/verification-pack.mjs`).** `effort: M` — ✅ DONE (v1.23.0).
  Assembling the Cycle-5 §4v prompt by hand exposed four frictions, and the
  first is structural: **the handoff blocks live nowhere.** Five Implementation
  Summary Blocks and two Cycle Summary Blocks existed only in chat scrollback —
  `.cycle/STATE.md` carries *prose about* them, not the blocks themselves. The
  entire handoff design assumes those blocks survive between sessions, and the
  only thing persisting them was the operator copy-pasting. A fresh
  `/cycle-resume` could not have reassembled them.
  The other three: this repo is not a project in its own console, so the console
  cannot inject its invariant library into §4v (it only knows `obs`/`cla`);
  rotation-probe selection has a conflict of interest with no mechanism (the
  prompt says "pre-selected — do NOT substitute your own picks", but nothing
  stops the implementer picking them); and the "don't trust the self-report"
  signal had to be written from memory, when `/reflect` already knows which
  batch summaries it corrected.
  Shipped as: a `.cycle/blocks/` convention (the implement commands and
  `/reflect` persist their block verbatim at CHECKPOINT — additive, skipped with
  no `.cycle/`), plus a script that derives the §4v body via the existing
  `sectionBody()` (no fourth copy), injects the live invariant library, seeds
  the rotation probes from the HEAD sha so they are reproducible rather than
  chosen, and reads `metrics.csv` to emit the cycle totals **and an automatic
  warning when a reflect row records a correction**.
  Same lesson as R16/F17 and the panel fixture: *a hand-assembled artifact
  drifts; a derived one cannot.* The §4v pack was the most hand-assembled thing
  left in the workflow.
  Deliberately out of scope: `/audit` does NOT persist its Session Handoff Block
  — that command's first line is "Do not make any changes to any files", and a
  file write would contradict it. §6a still takes the handoff block by paste.

## Tier 3 — Long-term (months+)

- **R3 — Converge the HTML's two state stores.** `effort: M–L` — ✅ DONE (v1.4.0–1.5.0; browser-verified). File System Access "Connect repo folder" syncs console state to `.cycle/console-state.json`, handle persisted via IndexedDB, Export/Import fallback.
  The HTML keeps state in `localStorage` while the repo keeps it in
  `.cycle/` / `PROJECT_HEALTH.md` — a dual source of truth that is
  ironically the "Parallel Source-of-Truth Drift" the tool's own Axis B
  polices. Use the File System Access API so the HTML reads/writes the
  repo's `.cycle/` directly, unifying them and making export/import
  largely unnecessary.

- **R9 — Invariants-as-tests as a standalone library.** `effort: M–L`
  The `Verify:` field is a convention with no runner. Generalise it
  into a small vitest/pytest plugin where invariants are declared once
  and become both documentation and executable tests — a reusable
  product beyond this workflow.

- **R14 — Generate the HTML console's prompts from CLAUDE.md.** `effort: M–L` — ✅ DONE (v1.5.0; browser-verified). Console §-prompts generated by `gen-html-prompts.mjs --write` and locked by `--assert` in CI; retires the fourth-copy drift class.
  Distinct from R3 (which converges *state*); this converges *prompt
  content*. The HTML's static §-prompts are a hand-maintained fourth
  copy of the commands that can silently drift from the canonical
  CLAUDE.md bodies — Cycle 1 found exactly this (F02/F03), and the guard
  can only marker-pin known divergence points, not full equivalence.
  Generating the console's prompt text from CLAUDE.md (the way
  `.claude/commands/` already is) would retire the whole drift class and
  close the last unguarded gap (§1-audit parity). The hard part is the
  transform: console prompts use `[PASTE …]` placeholders + inline
  per-project config, so it's a templating job, not a copy.

- **R16 — Finish R14 for the *dynamic* console builders.** `effort: M–L` — ✅ DONE (v1.14.0–1.16.0). Dynamic-builder lock engine shipped (`renderDynamicPrompt` + `canonicalCoverage` in `gen-html-prompts.mjs`); **3 of 4 dynamic builders locked** to 100% canonical coverage by `--assert` (INV-36): §T1 (`buildTier1Text` ← /broad-scan), §T2a (`buildTier2AuditText` ← /targeted-audit), §6b (`buildP6bText` ← /health-pulse).
  **§T2b's option-(b) resolution was SUPERSEDED in v1.20.0** — see the closing note below.
  The original reasoning, kept for the record:
  canonical `/targeted-implement` deliberately *delegates* to `/broad-implement` Step 1, while the console prompt must be standalone — an intentional divergence. Rather than duplicate the Step-1 detail into canonical (which would contradict the repo's "parity-guard, not factoring" decision), `buildTier2ImplText` stays **report-only, guarded by the R16-S parity markers** (a dropped/renamed contract still fails closed). The earlier measurement (§T2a 56%, §T2b 4%, §6b 0%) is what surfaced that only §T2b genuinely delegates; §T2a and §6b were standalone reword-drift and are now locked.
  **R16-full — ✅ DONE (v1.18.0, W1).** The remaining hand-written dynamic
  builders — `buildVerificationText` (§4v), `buildSeamsText` (§1s), and
  `buildP6aText` (§6a) — are now textually locked too. They are cycle-type
  prompts, not slash commands, so a new `sectionBody()` extractor diffs each
  against a canonical body in a fenced block under its `### ` section heading
  (no `/command` minted). **6 of 7 dynamic builders are now `--assert`-locked at
  100% line coverage** (only §T2b stays report-only-by-design); zero marker-only
  builders remain. The §6a lock pins the P1 metrics-ownership rule that Cycle-4
  F1 broke (proven fail-closed). The §1s/§6a output blocks (`SEAMS & INVARIANTS
  AUDIT BLOCK`, `POLICY RESPONSE`) are now registered + shape-guarded by
  check-output-blocks. The fourth-copy drift class is fully closed.
  **R16-final — ✅ DONE (v1.20.0).** The §T2b exemption is retired and **all nine
  dynamic builders are locked; no report-only tier remains.** The Cycle-5 audit
  found the exemption had been load-bearing in the wrong direction: §T2b was not
  merely "delegating," it was a pre-P7 prompt missing the OPERATOR ACTIONS field
  and the test-doubles scan, and it never emitted a `TARGETED IMPLEMENTATION
  SUMMARY` — the 4%-coverage number was read as intentional divergence and so
  never re-examined. Two things dissolved it: adding a `/broad-implement` prompt
  to the console (F21) gave the delegation something real to point at, and
  `canonicalCoverage` only requires canonical lines to be PRESENT, so a builder
  can carry expanded console-only detail *and* be locked — the standalone-vs-
  locked tradeoff the original decision assumed was never actually forced.
  Lesson worth keeping: a documented exemption is where drift goes to hide.

- **R17 — Hosted-console UX (GitHub Pages tool).** `effort: M` — ✅ DONE (v1.17.0).
  Followed from hosting the console at `https://robinchoudhuryums.github.io/claude-workflow-tools/`:
  (a) a **Dashboard** landing showing live per-project status — GitHub-primary
  (`PROJECT_HEALTH.md` + `.cycle/STATE.md`) with cache → self-reported fallback,
  optional local-only token for private repos; parsers locked by `check-html`
  (INV-37); (b) **light/dark theme** (chrome-only flip, persists, respects
  `prefers-color-scheme`); (c) **mobile nav drawer** replacing the prior
  `nav{display:none}` dead-end. All network deferred via `setTimeout` so headless
  checks stay green. Possible follow-ons: scroll-spy/active-state sync on deep
  links, an accessibility (keyboard) pass on custom controls, and a cross-project
  "worst-first" sort on the Dashboard.

## Tier 4 — Future possibilities (exploratory)

- **R11 — Dynamic Workflows orchestrator reference.** ⏸️ HELD — BLOCKED ON DW GA (decision 2026-06-08).
  Once Dynamic Workflows graduates past research preview, ship an actual
  reference orchestration script that fans out per-subsystem audit
  subagents and a no-context verifier, encoding the playbook we
  documented. The handoff-block formats become the orchestrator's state.
  Gated on DW stabilising; until then the playbook stays advisory.
  *Considered 2026-06-08 and deliberately held: a live DW-calling
  orchestrator can't be verified in this environment (no DW runtime;
  research-preview semantics will shift), which fails the verification-bar
  discipline. A headless advisory "planner" subset was offered and
  declined in favor of waiting for DW GA. Revisit when DW leaves preview.*

- **R12 — Multi-operator shared state.**
  The single-operator assumption is a known limitation. Now that state
  is file-backed, multi-developer use is tractable: define merge
  conventions for `PROJECT_HEALTH.md` / `STATE.md`, a lightweight
  "claim a subsystem" lock, and coordination for in-progress cycles.
  Worth exploring if the workflow spreads to a team.

- **R13 — Prompt-template regression harness.** ✅ DONE (v1.12.0).
  `scripts/check-output-blocks.mjs` validates output *shape* — does
  `/audit` still produce a well-formed SESSION HANDOFF BLOCK? — by
  checking balanced delimiters, required fields, producer emission, and
  inline-vs-reference field drift across all 10 workflow blocks, with
  `tests/check-output-blocks.test.mjs` proving it fails closed. The
  natural extension of the sync guard from structure to behaviour. Shipped
  the static, deterministic half (CI-able); live-LLM execution against
  fixture repos (real output capture) is non-deterministic and was left
  out of the CI gate by design.

---

## The one strategic bet

If resources were limited, prioritise **R1 (dogfood) immediately, then
R6 (SessionStart hook)**. R1 is the cheapest way to learn what is
actually worth building — its findings should reorder everything below
it. R6 attacks the workflow's deepest structural friction (cross-session
memory) more directly than anything shipped so far, and compounds with
every command already in place.
