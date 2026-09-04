# Changelog

All notable changes to the Claude Workflow Tools templates. Bump `VERSION`
(semver) and add an entry here whenever you change command semantics, the
config schema, or the tooling. `/sync-commands` reports this version so
consuming projects know what they are syncing to.

## 1.31.0 — 2026-09-04

Cycle-6 remediation, Batches 1+2 — the four findings the Seams & Invariants
audit and §4v raised against the guard family itself. Every one of them was a
guard that reported green while proving less than its rule text claimed.

**INV-68 — the invariant library's parse floor (the one that mattered most).**
Two parsers read the same library file and disagreed: `invariant-check.mjs`
anchors on `^(INV-\d+)` with no leading-whitespace tolerance, while
`verification-pack.mjs` trims each line first. A rule written with ONE leading
space therefore vanished from `invariant-check` **and** from the mutation audit
that derives its set from that same parse — so no case was orphaned, nothing
failed, and both reported `67/67 … Every runnable invariant fails closed ✓`
against a 68-rule file, while the §4v pack showed the verifier all 68. An
operator could add an invariant, see green, and believe it was proven.
`check-template-sync` structural check 12 now measures both parsers against a
permissive count of the file itself and fails if either sees fewer, or if they
disagree. INV-58 floors the mutation-case dimension; this floors the parse one
level up.

**INV-69 — a covering rule must APPLY, not merely EXIST.** INV-56 checked that
*some* `:focus-visible` rule using `box-shadow` existed somewhere in the file.
Scoping the file's single rule to `.nav-item` strips the focus indicator from
all 19 inline-suppressed form controls, and the check still reported every one
of them "covered". Coverage was real but rested on an unstated property — that
the rule is universal — which nothing asserted. Now asserted. (Confirmed in
Chromium first that the universal rule genuinely reaches a control carrying
inline `outline:none`.)

**INV-70 — the §4v pack's disclosed seed now reproduces its own probes.**
`main()` selected probes with the full 40-char HEAD sha and printed
`seed.slice(0, 12)`, in both the "seeded from" line and the `--seed` reproduce
command — so following the pack's own instructions returned a *different* five
invariants, and §4v's "do NOT substitute your own picks" was unauditable. Proved
at the last pack's own commit: the full sha yields the printed five, the printed
12-char seed yields five others. The seed is now resolved once at the source
(`git rev-parse --short=12`) and `buildPack` derives the probes itself from the
seed it prints, accepting no `probes` override — disclosure and use cannot
diverge by construction. The old test asserted determinism and the seed's
presence separately and never the composition; the new one re-derives from the
built pack, including a >12-char seed.

**Library text repairs.** INV-50 now states the scope it actually proves
(presence of an id, not that `getElementById` resolves to the intended element —
both Cycle-6 duplicate-id defects passed under it). INV-66's sentence said nine
prompts had no slash-command counterpart *and* named `setup`, which had one, as
one of them. **INV-29 is retired** — it enumerated 7 of the 16 locked static
prompts and is subsumed by INV-66; its drift mutation moved to INV-66 rather
than being retired with it.

Library 67 → 69 (one retired, three added), all runnable, 78 mutations. Full
16-stage Test Command green, 298 assertions.

## 1.30.1 — 2026-09-03

Removes 26 dead CSS rules (17 classes) from the console. No behaviour change —
none of the classes was applied to anything.

- `.log-card`, `.log-hdr`, `.log-ttl`, `.log-meta`, `.log-date`, `.lsh3`,
  `table.lt`, `.fr`, `.fn2`, `.fs`, `.fp0/1/2`, `.ft`, `.fl` — the residue of an
  older archive rendering; `renderArchive()` builds entries with inline styles
  now. `.log-body` is still used and stays.
- `.ct-check` and its two `.done` rules — superseded by the phase dots
  `renderCycle()` builds inline. Cycle-6 Batch 4 tokenised the colour inside
  `.ct-check.done::after` without noticing the class is applied to nothing.
- `.prose` — the four rules were never applied; the six textual occurrences of
  "prose" in the file are the English word inside prompt bodies.

Verified SAFE rather than assumed: the applied set was derived from real
`class="…"` attributes including template-literal and concatenation forms plus
`classList.add/remove/toggle` calls, not from raw text search — a raw search
reported `fl`, `fr`, `fs`, `ft` and `lt` as "used" because they appear inside
"flex", "from", "restoring" and `&lt;`. A rule was removed only when EVERY class
in its selector was dead, so nothing styling a live class was touched. Archive,
cycle tracker and Tier 1 re-verified rendering in headless Chromium afterwards.

ROADMAP **R21** queues the `/broad-scan` lens change this exercise argued for —
widening the dead-code bullet's nouns and adding a SAFE/PROPOSE proof gate,
without adding a general simplification mandate.

## 1.30.0 — 2026-09-03

Fixes the two duplicate-id collisions the Cycle-6 `/regression` pass found, and
adds the invariant that makes the class impossible. Console + guard only — **no
command body or config-schema change, so no `/sync-commands` re-pull**.

### The Tier 1 panel was destroyed on every load
`<section id="t1">` and `<pre id="t1">` shared an id. `getElementById` returns
the **first** element in document order, so `renderTier1()` assigned
`textContent` to the **section** — wiping its header, both prompts, both Copy
buttons and both Fill buttons, and replacing them with unstyled, unwrapped
prose. `<pre id="t1i">` (Broad Implement) went with it. The panel had rendered
this way since the tabbed-nav rewrite, on the hosted console, for the Tier 1
entry point this project's own workflow uses most.

`doCopy('setup')` had the same collision with `<section id="setup">`: it copied
the section, so the panel heading, purpose blurb and warning note were pasted
into the prompt an operator handed to an agent (10,841 chars instead of 10,127).

Both are fixed by renaming the **`<pre>`** ids — `t1` → `t1a` (matching the
existing `t2a`/`t2b` pattern) and `setup` → `psetup` (matching `p*`) — never the
section ids, which the nav `href`s and `showPanel()` depend on. No stored fill
values are orphaned: the Tier 1 fill form was inside the destroyed subtree and
could never have run, and Setup has no fill form.

### Why nothing caught it
`check-html`'s stubbed document is a flat id→element map with **no document
order**, so it cannot represent "first match wins" — the collision is invisible
to it by construction. `INV-50` passed throughout because `t1` *is* in the
markup; it proves an id exists, not that the element resolved at runtime is the
one intended. It took driving a real browser and counting `<pre>` elements.

`INV-67` closes it with a check the harness *can* run: strip the `<script>`
block, collect every markup `id`, fail on a duplicate. 177 ids checked,
mutation-proven by reinstating the exact collision. Library: 67, all runnable.

### Bookkeeping
`/reflect` had already run for Cycle 6, and it is the sole writer of
`net_score`/`prod_fixes`/`new_failure_modes`. These two production fixes are
therefore **not** in the cycle-6 metrics row (13 − 0); §6a should count 15 − 0
for the cycle. The reflect block is left intact as the honest record of what
that reflection concluded, and `.cycle/blocks/06-1.30.0-broad-implement.md`
supersedes its "carried out, unfixed" note.

## 1.29.0 — 2026-09-03

Cycle-6 `/broad-implement` Batches 5 and 6 — the last four findings of the
scan's batch plan. **`/setup-cycle` changed, so consuming projects should
re-pull with `/sync-commands`.**

### Batch 6 — every console prompt is now locked (F16)
The audit found eight console prompts sitting outside every lock. There were
**nine**, and the ninth was the one that mattered: `setup`, which *does* have a
canonical counterpart and had quietly decayed to a **pre-R18 copy** — missing 36
canonical lines including the entire "user-facing surfaces" profile step and the
instruction to propose an interface Health Dimension. An operator running
`/setup-cycle` from the console got a config that could never score the interface
layer, which is precisely the gap R18 shipped to close in v1.19.0. The file-global
markers could not see it, because the phrases appear elsewhere in the file.

- The static `MANIFEST` now resolves a canonical body from EITHER a slash
  `command:` or a `section:` heading, via the same resolver the dynamic lock
  uses. All 16 static `<pre>` blocks are locked; the nine without a slash
  command have canonical bodies under **"Console Reference Prompts"** in
  `CLAUDE.md`.
- `--assert` additionally fails if a *new* static prompt appears with no
  manifest entry. That derived half is the point: the audit itself under-counted
  the unlocked set, so a hand-maintained list would have been wrong on arrival.
- Three elaborations the console had been shipping and canonical had lost are
  restored to `/setup-cycle` (the policy-threshold maturity guidance, the seam
  files → Seams audit pointer, and "for any Medium or Low, explain what you'd
  need to verify"). `p7tmpl` is now project-agnostic instead of naming one
  built-in project's dimensions.
- These stay **sections, not commands**: each extends a command that already
  exists, so minting `/security-audit` would duplicate a body rather than
  extend one.

### Batch 5
- **F11.** The fill form classified bracket tokens by an ALL-CAPS-only pattern,
  so it missed every operator placeholder carrying a lowercase clause after an
  em dash (5 of them) while offering `[ID]`, `[INV-XX]` and `[X/10]` as fields —
  filling one rewrites the output block the prompt tells the agent to emit.
  Fields and format tokens are now told apart **structurally**: a token inside
  an `---OUTPUT BLOCK---` span, or sharing its line with another bracket token,
  is a template, not an input. Across all 16 prompts: 31 fields offered, every
  one an operator input.
- **F14.** The §4v rotation probes were `Math.random()` **re-rolled on every
  Copy**, so the copied prompt differed from the one on screen and an
  implementer could press Copy until the picks looked easy — the prompt's own
  "do NOT substitute your own picks" had no force. They are now a pure function
  of a stated seed (project + UTC day), reproducible by a verifier, never
  re-rolled. R19 gave the script this property via the commit sha; the browser
  has no sha, so it states the seed instead.
- **F15.** `.cycle/STATE.md` had grown to 24 sections and 347 lines with two
  `Decisions made` and two `Where I left off` — the substrate a new session
  loads was buried in narrative. It is back to its own 7-section template (64
  lines); the history moved to `.cycle/HISTORY.md`, and `check-template-sync`
  now fails if the file grows a section the template does not define.

### Guard notes
`INV-63`–`INV-66` added (66 total, 66 runnable, 74 mutations). The F14 guard
caught a real defect **in its own fix**: FNV-1a does not avalanche on a trailing
change, so with the seed appended every hash shifted by the same constant and
the selection never rotated. The seed is hashed as a prefix, and the guard now
requires a one-character seed change to reorder the picks. (`verification-pack.mjs`
is unaffected — sha256 avalanches.)

## 1.28.0 — 2026-09-03

Cycle-6 `/broad-implement` Batches 3 and 4 (four findings). **Console and tooling
only — no command body or config-schema change, so no `/sync-commands` re-pull.**

### Batch 3 — console data integrity and feedback
- **F05.** The project form renumbered invariants `INV-01..N` from LINE ORDER on
  every save, so deleting the third of ten rules shifted seven ids and broke
  every reference in already-archived handoff and verification blocks. It also
  counted from 1 while `getNextInvariantId()` counts both stores, so a project
  with five form invariants plus a §4v-added `INV-06` got a second `INV-06`.
  Ids now round-trip through the textarea as an optional `INV-NN |` prefix — the
  same shape the Cycle Workflow Config uses — and a new line is allocated above
  the max of both stores. Canonical `/reflect` has always said "do not invent or
  reuse a number"; the console was doing both.
- **F06.** A Dashboard fetch failure recorded its reason into `cache[id].error`
  and nothing ever read it — and when a cache entry already existed the reason
  was not even recorded. A 404 on a private repo, a 403 rate limit and an
  offline browser all rendered as "No data yet". The card now shows the reason
  and the fix (add a token, wait for the limit, `file://` blocks fetch).

### Batch 4 — light theme and assistive access
- **F13.** Sixteen literal hex text colours sat outside the token blocks, all of
  them dark-theme values: in light mode the nav badges measured **1.4:1**, the
  flow chips 1.5:1 and the state message 2.9:1. Text colour now goes through
  `--on-green/amber/red/blue/purple/teal`, which flip; the semantic *fills* stay
  put, so the deliberate "chrome only" light theme is unchanged. The Dashboard
  score chip flips too — S5 named that as the risk the decision left standing.
  `check-html` computes every `--on-*` token against every surface of its theme
  (48 pairs) and fails below 4.5:1, and rejects any new literal. Also fixes the
  four dead `.fill-select` rules the finding named: the select carried
  `.fill-input` plus inline styles duplicating them, and its `<option>`
  background rule was both dead and un-themed.
- **F12.** The mobile drawer had no `aria-expanded`, could not be dismissed from
  the keyboard, and left focus on `<body>` — a keyboard user opened a drawer they
  could not close. Escape now closes it and returns focus to the toggle. None of
  the 69 form controls had a programmatic label (the forms used styled `div`s);
  all now carry `<label for>` or an aria-label.

### Guard notes
`INV-59`–`INV-62` added (62 total, 62 runnable), each mutation-proven. Two of the
guards were wrong on the first attempt and the audit caught both: the drawer
backdrop's a11y exemption was pinned to the literal `closeNav()` and silently
stopped matching when the call gained an argument (it is now CONDITIONAL on the
Escape path existing, not merely documented), and the label check's `\bfor=`
also matched `data-for=`, so a broken association read as a valid one. The
element double now tracks classes, attributes and focus instead of no-oping
them, which is what makes the drawer assertions real.

## 1.27.0 — 2026-09-03

Cycle-6 `/broad-implement` Batches 1 and 2 (nine findings). **Two command
bodies changed** (`/reflect`, `/cycle-init`) — consuming projects should re-pull
with `/sync-commands`; the rest is console and tooling.

### Batch 1 — console safety
- **F01 (High, security).** `buildFillForm` interpolated subsystem names and
  saved fill values raw into innerHTML. The form renders only on interaction,
  so the init-time hostile fixture never reached it: a subsystem name from an
  imported backup executed in the console origin with `ccg:ghToken` in reach
  (confirmed in Chromium). Every interpolation now goes through `esc()` and
  every handler argument through `jsArg()`.
- **F09 (guard).** The hostile fixture's sink list was the last hand-listed
  set — and exactly where F01 hid. The sink set is now DERIVED from what the
  renders actually write; the fixture gives every static `<pre>` its markup
  text, seeds a hostile saved value for every placeholder, drives every fill
  form and the project editor, and fails if the derivation stops reaching
  them. Three field-level INV-20 mutation cases cover the fill form.
- **F17 (High, interface).** `body` is a flex ROW; the mobile media query never
  changed it, so below 768px the top bar rendered as a 174px left column and
  main overflowed the viewport (document 464px wide at 375px). Now stacks.
  A static check pins the rule; a real-DOM geometry assertion needs a browser
  stage (open gap).
- **F04.** A stored project missing `subsystems` threw in `renderCycle`, aborted
  init, and left no in-app way to delete it (the Projects panel never rendered
  and switching projects threw too). `loadCustomProjects` now repairs missing
  fields and drops entries with no id/name (warned once); a backup whose
  project list is not a JSON array is refused whole (`bad-projects`) with a
  visible message. A fresh-context boot test guards it.

### Batch 2 — hand-offs to the next session and to consumers
- **F02.** `.cycle/blocks/` accumulates across cycles; the first Cycle-6 pack
  would have carried all nine Cycle-5 blocks. `readBlocks` now scopes to the
  `<cycle>-` prefix and the pack names what it excluded.
- **F03.** Two `metrics.csv` readers split rows on a bare comma, so every row
  whose SUBSYSTEM contains a comma ("Auth, Security & HIPAA" — both built-in
  projects have such names) was silently skipped: under-counted totals in the
  pack, "—" trend on the status board. `scripts/csv.mjs` is now the ONE
  parser all three readers import (render-metrics's private copy retired).
  `/reflect` METRICS now says to quote any comma-bearing field.
- **F10.** `/cycle-init` step 5 told consumers to create PROJECT_HEALTH.md
  "from the §7 template" — which exists only in the console and names one
  built-in project's dimensions. The step now carries a project-agnostic
  skeleton with the field labels the parsers depend on.
- **F07.** PROJECT_HEALTH.md Current Standing still reported a defect fixed in
  v1.24.0 as open — and the SessionStart hook loaded it into every session.
  Corrected, with a note that the block is live status, not history.
- **F08.** `.cycle/config.md` cycle-number and test-count drift corrected.

## 1.26.0 — 2026-09-03

`/broad-scan` now ends with an **IMPLEMENTATION BATCH PLAN**. **Command-body
change** — consuming projects should re-pull with `/sync-commands`.

The Top 5 ranks findings by production impact; nothing ranked the *work*.
An operator reading a 17-finding audit still had to decide what to run first,
what belongs in one `/broad-implement` session, and which fixes have to land
before a new guard can go green. The new closing section makes the audit do
that: every finding from Stages 1–3 (interface findings included) is placed
exactly once — in a sequential batch sized for one implement session, or under
Deferred with a reason. Batches are ordered by impact, then by dependency (a
guard that would turn CI red until a gap closes goes after the batch that
closes it), with per-item S/M/L + hours and a batch total. The Top 5 stays.

Mirrored into the console's `buildTier1Text` (still `--assert`-locked at 100%
canonical coverage). Surfaced by the Cycle-6 dogfood scan, whose output was
the first to carry the section.

## 1.25.0 — 2026-07-27

Audits the 12 MANUAL invariants and promotes the F11 mutation audit into CI.
**Config-schema change** — the console's `/setup-cycle` output was missing two
things, so consuming projects generated from it should re-check their config
(see below); the command bodies themselves are unchanged.

### The MANUAL tier was a notation artifact, not a limit
Twelve invariants reported MANUAL because their `Verify:` field was written as
prose (`code read of PROJECTS`, `importStateFile logic`) rather than a command.
Auditing them found **ten were mechanically verifiable all along** and two —
INV-02 and INV-06 — were *already being enforced on every push* by a check that
had been running for releases, while the library reported them unverified. All
twelve are now runnable: the library is **58 invariants, 0 manual**.

Four had no assertion anywhere and now do (`check-html.mjs`): INV-07 (built-ins
resolve to the shipped Axis B defaults), INV-08 (the `| Verify:` suffix tracks
the value), INV-10 (the whole import path), INV-15 (§6a/§6b ask about the
project's *configured* categories). Three became structural checks in
`check-template-sync.mjs`: INV-14 (CI triggers + the guard step), INV-16 (config
schema parity), INV-12/INV-18 (every `.cycle/`-writing command step is gated on
the directory existing).

### Two real defects the audit surfaced
**INV-16 was false.** Its `Verify:` pointed at the capability markers, which only
prove a phrase appears *somewhere* in a file. Under that, the console's Setup
schema had been missing `### Seams Audit Cadence` entirely and its Invariant
Library line omitted the `| Verify:` field — so an operator who ran `/setup-cycle`
from the **console** got a config whose invariants could never become executable,
which is the one field this repo's whole invariant toolchain depends on. Both are
restored, and check 9 now compares the actual section lists across all three
copies of the schema. **If you generated a config from the console, add a
`Verify:` field to your invariants and a `Seams Audit Cadence` section.**

**INV-10 had never executed.** Its `Verify:` read "importStateFile logic", and the
headless `FileReader` stub never fired `onload` — so no clause of it (JSON
rejection, envelope rejection, the confirm gate, `ccg:*`-only writes) had ever
run. All four now do.

Also recorded, deliberately **not** fixed: Axis B configurability stops at
§6a/§6b. `buildSeamsText` PART 4 and the SEAMS & INVARIANTS AUDIT BLOCK still
enumerate the five default categories by name, so a project with custom
categories gets a Seams audit asking about ones it does not use. Fixing it means
editing an `--assert`-locked canonical body *and* the block's registered field
names. The check reports the gap rather than quietly passing.

### The mutation audit is now a CI stage
`tests/mutation-audit.mjs` — promoted from the Cycle-5 scratchpad script that
found a real false green. `invariant-check.mjs` proves each `Verify:` command
passes on a clean tree; that is not evidence it would **fail** if the rule were
violated. This violates each rule in a throwaway copy and requires the command
to fail. Three things changed on the way in, each closing a way the scratchpad
version could lie:

- **Coverage is derived** from the live library (through `invariant-check.mjs`'s
  exported parse — not a second copy). A runnable invariant with no mutation case
  is a failure, not a quietly smaller proven set.
- **A stale case fails.** The scratchpad scored a rotted find string as a neutral
  `?` and still reported "16/17 proven, 0 false greens".
- **Signals are per-invariant** — the field-level tier §4v asked for. Twenty
  invariants share `check-html.mjs`; under exit-code-only scoring a mutation for
  INV-06 that tripped INV-07's assertion still read as proof. Each case names the
  message its *own* assertion emits.

`tests/mutation-audit.test.mjs` guards the guard against all three. Result:
**58/58 invariants proven fail-closed across 60 mutations**, in ~15s. Test
Command and CI are now 16 stages.

## 1.24.0 — 2026-07-27

Closes every finding from the Cycle-5 §4v independent verification pass. Console
and tooling only — **no command semantics or config-schema change, so no
`/sync-commands` re-pull is required**.

### The live defect
The archive **"Copy content"** button called `navigator.clipboard.writeText()`
inline, bypassing `copyToClipboard()` — F05's exact silent-failure bug, left
alive in one sink for four releases. Now routed through the helper.
`copyFeedback()` also restores each button's *own* label instead of hardcoding
the prompt-copy icon, which is **why** the helper could not be reused there and
so how that sink kept its own call. `INV-54` adds a static scan: no inline
handler may touch `navigator.clipboard`.

### INV-53 — the false green §4v found
The hostile fixture hand-picked which fields to poison, so dropping `esc()` from
`inv.text` or `inv.subsystem` passed all 14 stages. The payload set is now
**derived from the sinks' own `${…obj.field…}` interpolations**, and the check
reports both what it derived and what it held back as non-string — it can never
silently narrow again. The archive sinks are covered for the first time.
- The first implementation was itself wrong in the same way: an unqualified
  `.field` structural test excluded `inv.text`, because `getFile().text()`
  exists elsewhere in the file. The derivation is now alias-scoped, and an
  assertion fails if the two fields §4v named ever drop out of the set.

### INV-55 — console block shapes
`check-output-blocks` validated CLAUDE.md and `.claude/commands/` only, so
dropping `Net score:` from the console's VERIFICATION BLOCK display passed
everything. It now validates the console too — **12 of 12 blocks**, in both
static `<pre>` displays and builder template literals.
- Getting this right took three passes. The first reported five failures that
  were all the checker's fault: a block's delimiter line carries its container's
  punctuation (`` ---END X---`; `` in a builder, `---END X---</pre>` in a
  display, `<pre id="…">---X---` on the open). Those are stripped before
  comparison; the five "findings" were artifacts, and the console was correct.

### INV-56 — focus visibility, the structural half
17 rules set `outline:none`, 15 of them inline on form controls where a
stylesheet `:focus` rule can never win on specificity, and the file had **zero**
`:focus-visible` rules. Added a global `:focus-visible` using `box-shadow` —
the one property inline `outline:none` cannot suppress. Batch 6 routed focus
visibility entirely to the perceptual bucket; this is the half that was
checkable from code all along. Contrast remains perceptual (S7/INV-52).

### F15 — CI least privilege
The `permissions: contents: read` block shipped in v1.21.0 with nothing
asserting it. `check-template-sync` now validates it (present, read-only, no
write scope), with a fail-closed `guard.test` case — which also required the
test's temp copy to include `.github/`.

### Invariants
`INV-20`'s scope-limit note retired (the gap is closed); `INV-53`–`INV-57`
added — 57 total, 45 runnable.

## 1.23.0 — 2026-07-27

**R19 — verification-pack assembly.** Command semantics change (the CHECKPOINT
steps now persist their block), so consuming projects should
**`/sync-commands` re-pull**. Fully additive: with no `.cycle/` directory every
command behaves exactly as before.

### Why
Assembling the Cycle-5 §4v prompt by hand exposed that **the handoff blocks live
nowhere.** Five Implementation Summary Blocks and two Cycle Summary Blocks
existed only in chat scrollback — `.cycle/STATE.md` carries prose *about* them,
not the blocks. The entire handoff design assumes they survive between sessions,
and the only thing persisting them was the operator copy-pasting; a fresh
`/cycle-resume` could not have reassembled them.

### `.cycle/blocks/`
The three implement commands and `/reflect` now write their summary block
verbatim to `.cycle/blocks/` at CHECKPOINT. `/audit` deliberately does **not** —
its first instruction is "Do not make any changes to any files", and a file
write would contradict it, so §6a still takes the Session Handoff Block by paste.

### `scripts/verification-pack.mjs`
Assembles a ready-to-paste §4v prompt:
- Body from CLAUDE.md via the same `sectionBody()` the `--assert` lock uses —
  no fourth copy.
- Live invariant library, parsed permissively so a rule whose text contains a
  pipe is not dropped (`INV-08` and `INV-46` are).
- **Rotation probes seeded from the commit sha.** The prompt says "pre-selected
  — do NOT substitute your own picks", which has no force if the implementer
  picks them; seeding makes the selection reproducible and auditable.
- Cycle totals from `metrics.csv`, **plus an automatic warning when a reflect
  row recorded a correction** — Cycle 5's three self-report corrections now
  reach the verifier without anyone remembering them.

Same lesson as R16/F17 and the panel fixture: a hand-assembled artifact drifts;
a derived one cannot.

### Guard
`tests/verification-pack.test.mjs` (14 assertions) wired into the Test Command
and CI — now **14 stages**. `INV-52` added (52 total, 40 runnable). R19 marker
pinned across CLAUDE.md + README.

## 1.22.0 — 2026-07-27

Cycle-5 closeout: F12, the headless stub's auto-vivify gap, and Batch 6 — the
first run of the R18 interface lens against its own host. Console and tooling
only — **no command semantics or config-schema change, so no `/sync-commands`
re-pull is required**.

### F12 — the metrics summary reported a permanently blank field
`render-metrics` printed `Latest synthesis: net ,` for every real project,
because a synthesis row's `net_score` is blank *by rule* (P1/INV-33 — those
columns are owned only by `phase=reflect`). It now reports the columns a
synthesis row actually owns and sources that cycle's net from its reflect rows.
The existing test asserted the old string against a fixture whose synthesis row
carried `net_score=3` — data the repo's own rule forbids — so a P1-compliant
case was added alongside it.

### The auto-vivify gap — a mistyped element id passed CI
`check-html`'s `getElementById` stub returned a live element for **any** id, so
a `render*()` writing to a mistyped id wrote to a phantom element, passed the
harness, and rendered an empty box in the browser. Not hypothetical: it happened
during v1.20.0 (`pr-prompt` vs `pr`) and was caught by reading, not tooling.
Writes are now recorded and every element written during init must exist in the
markup. Reads of unknown ids stay allowed — in a browser they return `null` and
the code already guards.

### Batch 6 — R18 dogfooded on the console
The lens's own gating worked as designed: the light-theme token set deliberately
flips "chrome only" (documented in the CSS), so the un-flipped semantic colors
are **not** reported as a finding — the contrast question is perceptual and was
routed to an operator check instead of guessed at.

- **(a)1 keyboard access — the real finding.** Nine controls built on
  `div`/`span`/`tr` had no `role`, no `tabindex` and no key handler: six variant
  toggles, the archive entry headers, the cycle-tracker items and the phase
  dots. All were mouse-only. Added `kbdActivate()` + `role="button"` +
  `tabindex="0"`, and moved the subsystem tables' action onto their existing
  `Use ↗` button, which is natively keyboard-reachable. Guarded by a check that
  **derives** the control set from the markup.
- **(a)2 missing states.** `renderCustomProjects` and `renderCustomInvariantsList`
  blanked their container when empty; both now render an empty state.
- Added a **Console UI/UX & Accessibility** health dimension — the console is a
  hosted user-facing surface and had no dimension scoring it, which is precisely
  the gap R18 exists to close. §6a should treat it as "First measurement".
- Promoted three **OPERATOR VISUAL CHECKS** into `Regression Scenarios` (S5
  light-mode legibility, S6 mobile drawer + tabbed nav, S7 keyboard-only pass),
  so the perceptual half is scheduled rather than assumed.

### Invariants
`INV-49` (keyboard reachability), `INV-50` (no writes to phantom elements),
`INV-51` (no blank synthesis net) — 51 total, 39 runnable.

## 1.21.0 — 2026-07-27

Cycle-5 Batch 3 (console correctness) and Batch 4 (make green mean green).
Console and tooling only — **no command semantics or config-schema change, so no
`/sync-commands` re-pull is required**.

### Batch 3 — console correctness
- **F06** — Axis B round-trip silently dropped `pulse`. `axisBToText` emitted
  three fields and `saveProjectForm` then re-read `pulse` from the *measures*
  column, so every project created through the form asked the wrong §6b pulse
  question. It fired on the common path, because the form pre-fills from
  `axisBToText(DEFAULT_AXIS_B)`. Now four fields (`name|measures|pulse|playbook`);
  a legacy three-field line is still read as `name|measures|playbook`.
- **F07** — a project name with no ASCII alphanumerics (`日本語プロジェクト`,
  `!!!`) derived to `''`, and the project saved with a falsy id: `getProject('')`
  fell through to the active project and `switchProject('')` reset to the first
  built-in, so it appeared in the list and could never be selected, edited or
  deleted. Falls back to a generated unique id.
- **F16** — `getFilledText` used `replaceAll(needle, string)`, which honors `$&`,
  `` $` ``, `$'` and `$1` in the replacement, silently mangling any pasted value
  containing them. Now a function replacement.
- **F20** — the backup envelope carried `app`/`kind`/`version` and nothing read
  them. A foreign file or a newer format is now rejected with a visible message;
  an absent envelope (older backups) is still accepted.

### Batch 4 — make green mean green
- **F11** — mutation-audited **every** script-verified invariant: violate the
  rule, run its own `Verify` command, check it fails. **16 of 17 were honest; one
  was a false green** — INV-23 claimed VERSION/CHANGELOG were "bumped when
  semantics change" while the check only tested that both files were non-empty.
- **F09** — closes that hole: VERSION must be semver and must equal the newest
  `## <semver>` CHANGELOG heading. Re-running the audit gives **17/17
  fail-closed, 0 false greens**. `guard.test.mjs` +1 case (now 14).
- **`jsArg()`** — a named helper for attribute-context JS arguments, replacing 14
  `esc(JSON.stringify(...))` call sites, plus a **static** guard: no `on*=`
  handler may call `esc()` to build a JS argument. The hostile-fixture check
  proves escaping only where the fixture reaches; this covers every handler in
  the file. (`esc()` in non-handler attribute text stays correct and allowed.)
- **F15** — `sync-check.yml` now declares `permissions: contents: read`.
- **F14** — already closed in the preceding docs sync; INV-11's `Verify` went
  from prose ("all 18", actually 20) to a runnable command.

### Invariants
`INV-23` rewritten; `INV-45`–`INV-48` added (48 total, 36 runnable). Every new
assertion in both batches is mutation-proven — including one of my own that was
initially a false green: the first F07 test asserted on the two helper functions
and still passed when the fix was removed from `saveProjectForm`, so it was
rewritten to drive the form end to end.

## 1.20.0 — 2026-07-27

Closes the console↔canonical parity gap and the guard hole that hid it (Cycle-5
F03, F21, F02, F17). Console and tooling only — **no command semantics or
config-schema change, so no `/sync-commands` re-pull is required**. Two new
console sections; every dynamic builder is now locked.

### F03 — `/pr-review` reaches the console
Shipped in v1.11.0 and documented in the README's block table, it had **zero**
presence in the console for four releases. Added a **PR Review** section +
`buildPrReviewText`, with the active project's invariant library injected so the
prompt is standalone for lens 8. Registered `locked:true` from day one.

### F21 — Tier 1 finally has its implement prompt
The Tier 1 section promised "audit-then-implement with your approval gate in
between" and shipped only the audit prompt, so a console-driven Tier 1 cycle had
no way to produce a `BROAD SCAN IMPLEMENTATION SUMMARY`. Added
`buildTier1ImplText` behind an explicit approval-gate note. Also `locked:true`.

### F02 — the §T2b exemption is retired
`buildTier2ImplText` was exempted from the R16 lock as "canonical delegates to
`/broad-implement` Step 1, the console must be standalone." The Cycle-5 audit
found the exemption had been hiding real rot: no P7 `OPERATOR ACTIONS / DEPLOY`
(it still read `6. DEPLOY STEP`, retired in v1.7.0 and by then the only surviving
instance in the repo), no P9 test-doubles scan, and it never emitted
`TARGETED IMPLEMENTATION SUMMARY` — so console Tier-2 output could not feed
§4v or §6a. The 4%-coverage number had been read as intentional and never
re-examined.
- Two things dissolved the tradeoff: F21 gave the delegation a real target in
  the console, and `canonicalCoverage` only requires canonical lines to be
  PRESENT — extras are ignored — so the builder carries its expanded Step-1
  detail *and* locks. The standalone-vs-locked conflict was never actually
  forced.
- **All nine dynamic builders are now locked. There is no report-only tier.**

### F17 — derive the block coverage instead of listing it
`check-template-sync`'s `WORKFLOW_BLOCKS` was a hand-maintained list of 7 while
`check-output-blocks` registered 12 — a parallel source of truth, the exact
Axis B category this tool polices. The five it omitted were not a random
sample: they were the ones hiding F03, F21 and F02. It is now derived from
`BLOCKS`, so a registered block that no console section carries fails CI.
- `guard.test.mjs` +2 cases (now 13), including the PR-REVIEW-BLOCK regression
  and a registry-block-with-no-console-representation case. Its `setup()` now
  copies `check-output-blocks.mjs`, which the guard imports.

### Test coverage
- `check-html`'s panel fixture is now **derived from the markup** rather than a
  hardcoded id list — it had already gone stale the moment a panel was added,
  the same failure shape as F17.
- New assertion: every `nav a href="#id"` resolves to a real panel. `showPanel`
  falls back to the first panel for an unknown id, so an orphaned nav link
  silently lands the user on the Dashboard instead of erroring.
- `INV-36` rewritten (nine locked, no exemptions); `INV-43`/`INV-44` added — 44
  invariants, 31 runnable PASS.

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
