# Cycle State

## Current
Cycle: 8
Phase: implement
Scope: broad (Cycle-8 /broad-scan, 2026-11-19 — 48 findings F1–F48, 9 fix batches, expansion plan E1–E5)
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs && node tests/verification-pack.test.mjs && node tests/mutation-audit.test.mjs && node tests/mutation-audit.mjs
Subsystem cycles since last Seams audit: 1 (cadence 3 — /reflect increments it, a Seams audit resets it)
Updated: 2026-11-20

## In progress (facts to carry forward — NOT judgments)
- Batches 1, 2 and 3 of 9 and the actionable follow-ons of the first two are complete (v1.44.0–v1.47.0; one
  block each in .cycle/blocks/). Batches 4–9 and the expansion plan are not started.
- The scan's full output (48 findings, ratings, batch + expansion plans) exists only in the session chat — the
  scan writes no file. The batch definitions under Pending are the record of what each batch contains.
- Cycle 7 was reflected (21 − 0) and merged (PRs #26, #27) but its §4v and §6a never ran; Cycle 8 opened on
  top of it. Its STATE record moved to .cycle/HISTORY.md in this checkpoint.
- Batch 1 was verified in Chromium through real clicks, keys and a real paste. S1–S4 were walked by
  automation, not by a person; S5–S17 (visual) have never been walked.
- This repo's console is live on GitHub Pages from `main`: v1.44.0 reaches users only when this branch merges.
- /sync-docs ran after Batch 1 (2026-11-20, docs only, no version bump): six gotchas added and one corrected,
  three operator-checklist entries, the scan's visual checks promoted as S10–S17, PROJECT_HEALTH's live-defect
  line, README and CLAUDE.md state-writer prose, a correction under CHANGELOG 1.39.0. It closed F10.
- /sync-docs ran again after Batch 3 (2026-11-20, docs and tests, no version bump): INV-76, 77, 78, 80 and 81
  promoted from Cycle 7's candidates with a Verify and a mutation case each (library 73 → 78, mutation cases
  128 → 135); INV-79 and INV-82 HELD. One gotcha, two design decisions and two operator-checklist entries added;
  PROJECT_HEALTH's live-defect line, README and CLAUDE.md prose reconciled with v1.47.0.

## Completed this cycle
- v1.44.0 | Batch 1 | F16 the 22 static Fill fields / variant-toggle handlers compile again (v1.39.0 had
  written `\'` into the attributes; dead on the hosted console v1.39.0–v1.43.0). F17 check-html compiles every
  static inline handler, checks each calls a function the script defines, and compiles every rendered handler
  before executing it (INV-04 widened). F18 the prompt header wraps — no header button clipped at 15 widths,
  320–1280px. F19 fields behind an OPTIONAL: / IF TRIGGERED: prefix are textareas, so a pasted block keeps its
  newlines. F21 "Custom…" opens a custom subsystem input, clears the stored scope and takes focus. F29 the
  /reflect prompt has a fill form, and the guard derives which prompts need one (INV-63 widened; also covers
  F19 and F21). F30 the regex lookbehind in the invariant form is replaced by splitUnescapedPipes and guarded.
  Mutation cases 104 → 111; library unchanged at 73.
- v1.45.0 | Batch 2 | F2 invariant-check finds fields by label, so a Verify command keeps its pipes (it was cut
  at the first one and the first stage's exit code reported as PASS); all 73 live commands parse unchanged.
  F3 buildPack injects the library and probes by function replacement (`$'`, `$&`, `$$` in a rule corrupted
  the pack). F7 INV-72's floor is the first release after the newest block of any EARLIER cycle, so a cycle's
  first release needs a block; proven by a guard.test sandbox case, which INV-72's Verify now also runs.
  F11 the SessionStart hook command and script are rooted at CLAUDE_PROJECT_DIR (fallback: cwd); the CLAUDE.md
  snippet follows. F15 CI on Node 22. Mutation cases 111 → 116; library unchanged at 73 (four rules widened).
- v1.46.0 | follow-ons | A a piped verification pack is complete (exitCode, not process.exit(), which cut it
  at 65,536 bytes). B button rows wrap — no panel scrolls sideways at 320px. C the Tier 1 scan and §0 prompts
  lost their empty fill forms; a guard holds "a form has fields" beside "a prompt with fields has a form".
  D the inline-handler scan reads handlers from tags only. E the systems-map field saves as typed. F docs:
  Verify-with-pipes in README and CLAUDE.md, two gotchas added and one extended, a correction under CHANGELOG
  1.43.0. Mutation cases 116 → 120; library unchanged at 73 (three rules widened).
- v1.47.0 | Batch 3 | F1 Phase is a closed lifecycle — audit, implement, reflect, idle; Health Synthesis
  step 8 sets idle; /cycle-status and portfolio-status pick the next action from it (only implement is "in
  progress"). F4 CYCLE OPEN reports a previous cycle reflected but never synthesized, and the pack warns when
  built without --cycle over one. F5 the same-audit-round exemption is "Phase: audit within 7 days"; the first
  implement CHECKPOINT of a cycle rolls the old sections into HISTORY.md. F6 /reflect numbers candidates above
  unpromoted ones and /sync-docs (check 5) proposes their promotion. F12 a block is never overwritten.
  Structural check 19 guards all of it. Mutation cases 120 → 128; library unchanged at 73 (three rules widened).
  Ten command bodies changed — consuming projects re-pull.

## Pending / not yet done
- Batch 4 — console data: F20 config-format invariant lines double their labels; F22 Dashboard not re-rendered
  on switch/add/delete/import; F23 Dashboard cache keyed by id only; F24 parseHealth/parseState unscoped;
  F25 refresh races; F26 Save → repo creates .cycle/; F27 project-form edge cases; F28 import shapes.
  Closing F28 makes candidate INV-82 true — promote it then (/sync-docs).
- Batch 5 — console focus and structure: F32 focus lost after eight actions; F33 no headings on 18 panels;
  F36 silent save failures after the first; F34 drawer trap above 768px; F35 aria-expanded drift, 16px dots.
- Batch 6 — console theme and prose: F31 --accent as text in light mode; F37 no reduced-motion /
  forced-colors / color-scheme / print; F38 six small items; F39 stale tips and cadence text.
- Batch 7 — check-html false greens: F40 hostile fixture blind to five sinks; F47 ten single-instance proofs;
  F48 four false reds. (After Batches 5 and 6.) Closing F40 makes candidate INV-79 true — promote it then.
- Batch 8 — sync, lock, mutation audit: F41 mutation signals matched against passing output; F42 --assert
  drops 23 lines and hand-lists builders; F43 INV-33 one literal phrase; F44 INV-12 step-shaped writes only;
  F45 INV-75 one spelling (after F39); F46 job-level permissions.
- Batch 9 — docs and adoption: F8 command frontmatter; F9 ROADMAP stale; F14 token note omits the shared
  github.io origin. (F10 was closed by /sync-docs on 2026-11-20.)
- Deferred: F13 — operator question: is CallAnalyzer's file layout and invariant list meant to be public?
- Expansion (optional): E1 G2 real-browser CI stage; E2 ST4 cycle-close + G1 §1s/§6a commands; E3 G3 scan
  persistence + G5 interface lens in /pr-review + ST1 allowed-tools; E4 ST3 mechanical mutation sweep;
  E5 G4 console import from config. Not batched: ST2 (event delegation + CSP).
- Cycle 7 still owes §4v in a FRESH session — `node scripts/verification-pack.mjs --cycle 7 --out pack.md`
  (without --cycle the pack builds Cycle 8 and now says Cycle 7 is owed) — then §6a. Carried from Cycle 7: F43
  (hook framing/size cap).
- Two Cycle-7 candidates are HELD, not declined — numbers reserved, text in 07-a-reflect.md: INV-79 (hostile
  fixture seeds every stored and fetched input; contradicted by F40) and INV-82 (active id names a project,
  ccg:* keys shape-validated on import; contradicted by F28). The next new candidate is INV-83.
- OPEN DECISIONS (operator, not work): INV-73 (§1s hardcodes the five default Axis B categories); §4v
  independence vs the SessionStart hook; R21's /audit vs /targeted-audit dead-code asymmetry.

## Open follow-on items
What is left is deliberate, needs a capability that does not exist yet, or is the owner's call:
- Layout has no CI guard (F18's header wrap, the 320px button rows): clipping is geometry and no stage drives
  a browser (E1 / ROADMAP R20). Both were measured in Chromium, 15 widths from 320 to 1280px.
- F15 has no guard: nothing can tell an end-of-life Node line from a supported one without a date.
- A static inline handler that calls a browser global the vm context does not stub (beyond alert, confirm,
  setTimeout) fails check-html's callee check until the stub is added — loud by design.
- invariant-check passes a Verify to the shell as written: `\|` is NOT a pipe there (`grep 'a\|b'` needs
  it), and toCommand still ends a command at " (", " + " or " then ", so a Verify cannot contain a subshell
  or `if … then`. Both documented.
- The hook snippet is POSIX shell syntax; a Windows setup whose hooks run under PowerShell needs
  `$env:CLAUDE_PROJECT_DIR`. The exec form (`"args"`) the Claude Code docs prefer would avoid the shell, but
  was not adopted: it could not be exercised here and older Claude Code versions may not read it.
- The Setup prompt's `[N]` is classified as a fill field by getPlaceholders; it has no form, and the F11
  check's NEVER list would reject a form that offered it.
- guard.test's F7 case reads this repo's .cycle/STATE.md and CHANGELOG.md to build its sandbox.
- check-html, check-template-sync and the mutation audit still call process.exit() after printing; their
  output is far below a pipe's 64 KiB buffer today, so nothing is cut. verification-pack was the one that was.
- The lifecycle is instruction text plus a text-derived guard (check 19): nothing mechanical checks a live
  STATE.md transition. A cycle-close command (E2 / ST4) is where that would live.
- Check 19 recognises a phase writer by the phrase "set Phase: <value>" — derived, but one wording (the same
  class as Batch 8's F43/F45). A step that sets a phase in other words reads as no writer: loud, not silent.
- A project that never synthesizes rests at Phase: reflect between cycles; the portfolio board lists it under
  "Reflected, not synthesized (or open the next audit)" until its next audit.
- The same-audit-round window is 7 days: a second audit of one round started later than that, with nothing
  implemented between, opens a new cycle.
- .cycle/HISTORY.md is now written by the first CHECKPOINT of a cycle and still read by nothing.
- Strategic, carried: no LICENSE file (the licence is the owner's choice).

## Decisions made (so the next session doesn't re-litigate)
- The console's prompts are GENERATED/LOCKED from CLAUDE.md. As of v1.29.0 this covers EVERY static
  <pre> as well as all nine dynamic builders, and gen-html-prompts --assert fails if a new static
  prompt appears with no manifest entry. There is no unlocked tier left.
- Prompts with no slash-command counterpart (§1 variants, §4 pre-check, §5 add-ons, §7 blocks, the
  §4v reference) are canonical SECTIONS in CLAUDE.md, not new commands — each extends a command that
  already exists, so minting one would duplicate a body rather than extend one.
- net_score stays a strict gate; hardening shows up in defensive_count.
- R11 (Dynamic Workflows orchestrator) is HELD until DW leaves research preview.
- STATE.md is rolling and template-shaped; narrative history goes to .cycle/HISTORY.md (F15), and
  check-template-sync now fails if this file grows a section the template does not define.
- A GUARD MUST PROVE THE PROPERTY ITS COVERAGE RESTS ON, not a proxy for it. INV-56 proved a covering
  :focus-visible rule EXISTED; coverage actually rested on that rule being UNIVERSAL, which nothing
  asserted. Same shape as INV-68: the proven set rested on both parsers agreeing, and nothing measured
  them against the file. When a check passes, ask what unstated property makes its conclusion true.
- /broad-scan keeps fixes and new capability in SEPARATE plans: findings go in numbered Batches, G/ST
  items only in Expansion batches (E1…), never in a Batch or its hour total. G/ST work is a capability,
  never a production fix (net_score stays strict). ST, not S, because S1… is the Regression Scenario id.
- buildPack DERIVES its probes from the seed it prints and takes no `probes` override. The override is
  what let disclosure and use diverge; re-adding one reopens the class.
- Guard messages added from Cycle 8 on are CYCLE-QUALIFIED ("Cycle-8 F19"). Finding ids restart every
  scan, older checks already print F19/F21/F30, and the mutation audit matches on these strings.
- Batch 1 WIDENED INV-04 and INV-63 instead of minting invariants: promotion to the library has no owning
  command yet (F6), and both defects were holes in what those two rules already claimed.
- Any fill field that opens with a directive prefix (OPTIONAL: / IF …:) is multi-line. Single-line inputs
  are what is left: short identifiers such as [PR NUMBER OR URL] and [FINDING IDS TO IMPLEMENT].
- A Verify field is the text from its label to the end of the line or the next LABELLED field, run by the
  shell exactly as written — no escape processing. A trailing note is `(a parenthesis)` or a labelled field.
- A guard whose violation needs several files to disagree is proven in guard.test's sandbox, and the
  invariant's Verify names guard.test as well (INV-72) — a single-file mutation of the live tree cannot.
- Phase has four values and each has one kind of writer: CYCLE OPEN → audit, CHECKPOINT → implement,
  /reflect → reflect, Health Synthesis → idle. plan / regression / verify were dropped because the sessions
  that would write them are read-only. Adding a value means adding its writer (check 19 fails otherwise).
- "Same audit round" is Phase: audit updated within 7 days, ANY scope. A same-day-or-same-scope rule was
  drafted and dropped: it split a Tier 3 round whose subsystem audits fall on consecutive days.
- The "reflected, never synthesized" notices (CYCLE OPEN, the pack) fire only where metrics.csv has a
  synthesis row for some cycle. A project that does not synthesize owes none, and a notice that fires every
  cycle teaches its reader to skip it.
- Candidates are promoted by /sync-docs with the operator's approval, never by /reflect or an implement
  session — which is why Batch 3 widened INV-35/52/65 and left INV-76…82 where they were.
- A candidate the newest audit contradicts is HELD until the contradicting finding closes — promoting it
  would add a rule whose Verify passes over a known violation (INV-79 / F40, INV-82 / F28).

## Where I left off
Cycle 8, Batches 1–3 and the follow-ons shipped as v1.44.0–v1.47.0 on branch claude/stoic-goldberg-gg0oz5
(not merged — the hosted console still serves v1.43.0 with the dead Fill buttons until it is). /sync-docs has
run on top (library 78; INV-79 and INV-82 held). Next: merge, have consuming projects run /sync-commands
(v1.47.0 changed ten command bodies), then /broad-implement Batch 4 (console data). Cycle 7's §4v and §6a
are still owed (pass --cycle 7). A person still needs to walk S5–S17.
