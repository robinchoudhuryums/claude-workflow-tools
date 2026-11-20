# Cycle State

## Current
Cycle: 8
Phase: implement
Scope: broad (Cycle-8 /broad-scan, 2026-11-19 — 48 findings F1–F48, 9 fix batches, expansion plan E1–E5)
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs && node tests/verification-pack.test.mjs && node tests/mutation-audit.test.mjs && node tests/mutation-audit.mjs
Subsystem cycles since last Seams audit: 1 (cadence 3 — /reflect increments it, a Seams audit resets it)
Updated: 2026-11-20

## In progress (facts to carry forward — NOT judgments)
- Batches 1–3 and 8, the follow-ons and expansion E2 are complete (v1.44.0–v1.49.0; one block each in
  .cycle/blocks/). What is left of the plan is Batch 9 and expansions E3 and E4.
- The four commands added in v1.48.0 have been checked structurally only — none has been run end to end.
  Cycle 7's owed verification (/verify 7 in a fresh session, then /health-synthesis 7) is their first real use.
- A scheduled task, "Weekly cross-project board", runs Mondays 7:36 America/Chicago over seven repositories.
  It clones the default branch, so it uses the older portfolio-status until this branch merges.
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
- v1.48.0 | E2 + freeze | G1 /verify, /seams-audit and /health-synthesis run the §4v / §1s / §6a prompts from
  chat: an input-gathering preamble plus an include that gen-commands expands from the canonical section (one
  source for each body). ST4 /cycle-close checks what a cycle owes, rolls STATE into HISTORY, sets Phase: idle.
  Fix: §6a step 8 idles only the cycle STATE is in (v1.47.0's wording would have idled Cycle 8 when Cycle 7's
  synthesis ran). Fix: portfolio-status lists a project with .cycle/ state and no PROJECT_HEALTH.md. The
  console is a Frozen Subsystem. Mutation cases 135 → 138; library 78 (INV-11, 35, 76 widened).
- v1.49.0 | Batch 8 | F41 the mutation audit counts a signal only on output the mutation added (each Verify
  command is first run on an unmodified copy), rejects signals that match any failure line, fails on an
  unknown --only id, and really runs --jobs cases at once (about 2.5 min, was 8); ten weak cases replaced,
  three of them import-crash "proofs". F43 the metrics-ownership rule is read out of step 8 in both §6a
  copies. F44 every sentence that writes cycle state must sit inside a gated step. F45 each policy clause is
  tied to its config field and a literal floor is refused in any wording, in CLAUDE.md, the README and the
  commands. F46 every permissions block in the workflow is read. Mutation cases 138 → 149; library 78 (five
  rules widened). No command body changed.

## Pending / not yet done
- Batch 9 — docs and adoption: F8 command frontmatter; F9 ROADMAP stale. (F10 closed by /sync-docs.)
- Expansion (optional): E3 G3 scan persistence + G5 interface lens in /pr-review + ST1 allowed-tools;
  E4 ST3 mechanical mutation sweep.
- DROPPED with the console freeze (2026-11-20, operator decision — known defects on the hosted page, none
  rated High; the scan's wording survives only in the session transcript):
  Batch 4 F20 F22 F23 F24 F25 F26 F27 F28 · Batch 5 F32 F33 F34 F35 F36 · Batch 6 F31 F37 F38 F39 ·
  Batch 7 F40 F47 F48 · from Batch 8: F42 (the --assert lock's holes) · from Batch 9: F14 (token note) ·
  expansion E1 (G2 browser CI stage), E5 (G4 console import), ST2 (event delegation + CSP).
- Deferred: F13 — operator question: is CallAnalyzer's file layout and invariant list meant to be public?
  (More pointed now: the frozen console that carries them stays hosted.)
- Cycle 7 still owes §4v in a FRESH session — `node scripts/verification-pack.mjs --cycle 7 --out pack.md`
  (without --cycle the pack builds Cycle 8 and now says Cycle 7 is owed) — then §6a. Carried from Cycle 7: F43
  (hook framing/size cap).
- Two Cycle-7 candidates are HELD, not declined — numbers reserved, text in 07-a-reflect.md: INV-79 (hostile
  fixture; contradicted by F40) and INV-82 (import shape validation; contradicted by F28). Both findings were
  dropped with the freeze, so both stay held until the console is unfrozen — or the operator declines them.
  The next new candidate is INV-83.
- OPEN DECISIONS (operator, not work): INV-73 (§1s hardcodes the five default Axis B categories); §4v
  independence vs the SessionStart hook; R21's /audit vs /targeted-audit dead-code asymmetry; whether the
  console lock should keep costing a builder mirror on every command-body change now that the console is frozen.

## Open follow-on items
What is left is deliberate, needs a capability that does not exist yet, or is the owner's call (console-only
follow-ons went with the freeze):
- The console is frozen but still locked: check-html and gen-html-prompts --assert stay in the Test Command,
  and a command-body edit still has to be mirrored into its builders.
- S5–S17 (visual scenarios) have never been walked by a person and are not owed while the console is frozen;
  S1–S4 are still walked by automation whenever the HTML changes.
- F15 has no guard: nothing can tell an end-of-life Node line from a supported one without a date.
- invariant-check passes a Verify to the shell as written: `\|` is NOT a pipe there (`grep 'a\|b'` needs
  it), and toCommand still ends a command at " (", " + " or " then ", so a Verify cannot contain a subshell
  or `if … then`. Both documented.
- The hook snippet is POSIX shell syntax; a Windows setup whose hooks run under PowerShell needs
  `$env:CLAUDE_PROJECT_DIR`. The exec form (`"args"`) the Claude Code docs prefer would avoid the shell, but
  was not adopted: it could not be exercised here and older Claude Code versions may not read it.
- guard.test's F7 case reads this repo's .cycle/STATE.md and CHANGELOG.md to build its sandbox.
- check-html, check-template-sync and the mutation audit still call process.exit() after printing; their
  output is far below a pipe's 64 KiB buffer today, so nothing is cut. verification-pack was the one that was.
- The lifecycle is instruction text plus a text-derived guard (check 19): nothing mechanical checks a live
  STATE.md transition. /cycle-close (v1.48.0) is still instruction text; team-tools has a scripted close-out
  (scripts/cycle-closeout.mjs — dry run, --check for CI, --close) that could be upstreamed here.
- Without verification-pack.mjs, /verify derives its rotation probes from the cycle number and library size,
  which are known before implementation — no weaker than the console's date seed, weaker than the pack's sha.
- Batch 3's block reported one new failure mode; the unconditional Phase: idle in §6a was a second, fixed in
  v1.48.0 before any merge. /reflect should record that correction in its metrics notes.
- Check 19 recognises a phase writer by the phrase "set Phase: <value>" — derived, but one wording (the class
  Batch 8 closed for F43/F45). A step that sets a phase in other words reads as no writer: loud, not silent.
- The mutation audit runs cases in parallel since v1.49.0: a Verify command that depends on timing can pass
  over its own defect under load. One was found and fixed (the piped-pack test); another would show up as an
  intermittent FALSE GREEN, not a steady one.
- The audit's generic-signal check is four probe strings — /failed/ is rejected, /wrong/ would not be.
- Check 10's sentence scan and check 16's floor scan read prose; a legitimate sentence shaped like a write
  or like a floor would be flagged. The failure line quotes the sentence.
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
- The Interactive Console is FROZEN (operator, 2026-11-20): the workflow runs through the slash commands, the
  .cycle/ files, portfolio-status and a weekly scheduled cross-project board. Console-only findings and
  expansion items were dropped, not deferred. The lock stays, so the hosted page keeps matching the commands.
- A command that runs a canonical section INCLUDES it ({{include: <heading>}}, expanded by gen-commands) and
  never copies it. Its preamble gathers inputs and may add a stated exception to the body's no-file-changes
  rule; it does not restate the body.
- /cycle-close is optional by design: Health Synthesis still sets idle, and the next cycle's first CHECKPOINT
  still rolls a STATE that was never closed.
- A mutation signal is the phrase the failing assertion prints, and it must match a line the mutation ADDED.
  Never "✗" or "error"; never a renamed export (that proves a crash, not the rule).
- The console is not scanned for a hardcoded policy floor: it is frozen and its tip still states one (F39).

## Where I left off
Cycle 8. v1.44.0–v1.49.0 are on branch claude/stoic-goldberg-gg0oz5 (not merged). Batches 1–3 and 8, the
follow-ons and E2 are done; the console is frozen. Left from the scan: Batch 9 (F8 command descriptions, F9
ROADMAP) and the optional E3 / E4. Then /reflect for Cycle 8. Cycle 7 still owes /verify 7 (fresh session)
and /health-synthesis 7. Consuming projects need /sync-commands for v1.47.0–v1.48.0.
