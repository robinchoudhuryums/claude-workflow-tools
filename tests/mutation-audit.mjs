#!/usr/bin/env node
// mutation-audit.mjs — the invariant library's own regression test.
//
// invariant-check.mjs proves each `Verify:` command PASSES on a clean tree.
// That is not evidence the command would FAIL if its invariant were violated —
// a Verify field that points at a check which cannot see the rule reports PASS
// forever. This audit closes that loop: for every runnable invariant, violate
// the rule in a throwaway copy of the repo, run that invariant's OWN Verify
// command, and require it to fail.
//
// Promoted from a scratchpad script written during Cycle 5 (finding F11), where
// it found a real false green. Three things changed on the way in, each closing
// a way the scratchpad version could have lied:
//
//   1. COVERAGE IS DERIVED. The case list is checked against the live library
//      (via invariant-check.mjs's exported parse — not a second copy of it).
//      A runnable invariant with no mutation case is a FAILURE, not a silent
//      omission. Hand-listed coverage has been the root cause in this repo five
//      times; the audit that polices the library must not repeat it.
//   2. A STALE CASE FAILS. The scratchpad printed "NO-TARGET" as a neutral `?`
//      and still reported "16/17 proven, 0 false greens" — a case whose find
//      string had rotted away simply stopped testing anything. A mutation that
//      cannot be applied is now a failure.
//   3. SIGNALS ARE PER-INVARIANT (the field-level tier §4v asked for). Twenty
//      invariants share `node scripts/check-html.mjs`; under an exit-code-only
//      test, a mutation for INV-06 that happened to trip INV-07's assertion
//      still read as CAUGHT. Each case names the message its OWN assertion
//      emits, so the audit proves the right check fired — not merely that
//      something did.
//   4. ONLY OUTPUT THE MUTATION ADDED COUNTS (Cycle-8 F41). A signal used to be
//      tested against everything the command printed, and 37 of 104 also
//      matched a PASSING run — the ✓ line of a check names its invariant too.
//      Each Verify command is now run once on an unmodified copy; a signal has
//      to match a line that run did not print. A signal that matches any
//      failure line at all is rejected before the case runs.
//
// Usage:  node tests/mutation-audit.mjs [--only INV-05,INV-20] [--jobs N]
// Exit 0 = every runnable invariant is proven fail-closed.

import { readFileSync, existsSync } from 'node:fs';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { tmpdir, availableParallelism } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseInvariants, toCommand, defaultSource } from '../scripts/invariant-check.mjs';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx !== -1 ? new Set(args[onlyIdx + 1].split(',').map(s => s.trim())) : null;
const jobsIdx = args.indexOf('--jobs');
// --jobs N cases at once; the default is the machine's core count, capped at 8.
const JOBS = jobsIdx !== -1 ? Math.max(1, Math.floor(+args[jobsIdx + 1]) || 1) : Math.min(8, availableParallelism());
const CASE_TIMEOUT_MS = 10 * 60 * 1000;

const HTML = 'claude-code-guide-v2.html';
const CFG = 'CLAUDE.md';

// ── Mutation cases ────────────────────────────────────────────────────────────
// INV id → one or more mutations. Each: [file, find, replace, signal].
// `signal` must match output produced by the assertion that belongs to THIS
// invariant — an exit code alone does not prove the right check fired.
// Multiple mutations per invariant give the field-level tier: INV-20's escaping
// is violated one sink at a time, because poisoning all of them at once is how
// a fixture passes while an individual field is unguarded.
const CASES = {
  // ── node scripts/check-html.mjs ─────────────────────────────────────────────
  'INV-04': [[HTML, 'function esc(s){', 'function esc(s){ ((( ', /syntax error/i],
             // Cycle-8 Batch 1 (F16/F17): an inline handler is JavaScript too, and nothing compiled one.
             // The first mutation IS the v1.39.0 defect that left every Fill fields button dead for
             // five releases; the second breaks a RENDERED handler (it used to be swallowed by the
             // hostile-fixture executor's catch); the third renames a callee out from under the markup.
             // Signals are phrases only the failing line prints.
             [HTML, `onclick="toggleFill('t1i')"`, `onclick="toggleFill(\\'t1i\\')"`, /static inline handler\(s\) do not compile/],
             [HTML, 'fillSubsystem(${argName})"', 'fillSubsystem(${argName}"', /rendered inline handler\(s\) do not compile/],
             [HTML, `onclick="expandAllVariants('s1-variants')"`, `onclick="expandEveryVariant('s1-variants')"`, /call function\(s\) the script does not define/],
             // Cycle-8 Batch 1 (F30): Node parses a regex lookbehind, Safari < 16.4 does not — and a
             // parse error in the one inline script stops all of it.
             // Cycle-8 follow-on D: the handler extractor back to scanning the whole markup — prose that
             // quotes an attribute would be compiled as a handler. Caught by the extractor's own fixture.
             ['scripts/check-html.mjs', 'return tagsOf(markup).flatMap(tag =>', 'return [markup].flatMap(tag =>', /Cycle-8 follow-on D: /],
             [HTML, 'const parts=splitUnescapedPipes(l);', "const parts=l.split(/(?<!\\\\)\\|/).map(x=>x.trim().replace(/\\\\\\|/g,'|'));", /regex lookbehind\(s\) in the console script/]],
  'INV-05': [[HTML, 'const dims=project.healthDimensions;', 'const dims=project.healthDimensions_TYPO;', /unresolved|leaked "undefined"/i],
             // Cycle-7 Batch 6 (F20): a defect only in the SECOND project's library. The builders
             // rendered the active project's invariants, so this was never rendered or checked.
             [HTML, "{id:'INV-01',text:'updateCall must throw", "{id:'INV-01',txt:'updateCall must throw", /leaked "undefined"|Cycle-7 F20/],
             [HTML, 'function buildVerificationText(project){\n  const invs=getProjectInvariants(project);', 'function buildVerificationText(project){\n  const invs=getProjectInvariants();', /Cycle-7 F20/]],
  'INV-06': [[HTML, '? project.axisB : DEFAULT_AXIS_B;', '? project.axisB : DEFAULT_AXIS_B.slice(0,3);', /5 default categories/i]],
  'INV-07': [[HTML, "id:'obs', name:'Observatory QA',", "id:'obs', name:'Observatory QA', axisB:[{name:'Sneaky',measures:'m',pulse:'p'}],", /INV-07/]],
  'INV-08': [[HTML, 'inv.verify?` | Verify: ${inv.verify}`:\'\'', '` | Verify: ${inv.verify}`', /INV-08/]],
  'INV-09': [[HTML, "k.indexOf('ccg:')===0&&!isSecretKey(k)) data[k]", 'k!==null) data[k]', /scope to ccg|secret key/i]],
  'INV-10': [[HTML, "if(!confirm(", 'if(false&&!confirm(', /INV-10/]],
  'INV-15': [[HTML, 'const axisB=getAxisB(project);', 'const axisB=DEFAULT_AXIS_B;', /INV-15/]],
  // Field-level tier: one sink at a time (§4v found the all-at-once form green).
  'INV-20': [
    // Cycle-7 Batch 4 (F25): the tracker label became a native <button>.
    [HTML, 'text-align:left;cursor:pointer">${esc(g)}</button>', 'text-align:left;cursor:pointer">${g}</button>', /unescaped stored content|injected data executed/i],
    [HTML, '${esc(inv.text)}', '${inv.text}', /unescaped stored content|injected data executed/i],
    // Cycle-7 Batch 6 (F45): remote Dashboard data (dashCache / dashManual) is seeded hostile now.
    [HTML, "'<div class=\"dcard-summary\">'+esc(summary)+'</div>'", "'<div class=\"dcard-summary\">'+summary+'</div>'", /unescaped stored content|injected data executed/i],
    [HTML, "value=\"'+esc(man.note||'')+'\"", "value=\"'+(man.note||'')+'\"", /unescaped stored content|injected data executed/i],
    [HTML, '${esc(inv.subsystem)}', '${inv.subsystem}', /unescaped stored content|injected data executed/i],
    // F01/F09 — the fill form renders only on interaction; these prove the
    // hostile fixture now reaches it, one sink at a time.
    [HTML, '<option value="${esc(s.name)}"${val===s.name', '<option value="${s.name}"${val===s.name', /unescaped stored content|injected data executed/i],
    [HTML, 'placeholder="Paste your systems map summary here..." oninput="saveVal(${argPid},${argName},this.value)">${esc(val)}</textarea>', 'placeholder="Paste your systems map summary here..." oninput="saveVal(${argPid},${argName},this.value)">${val}</textarea>', /unescaped stored content|injected data executed/i],
    [HTML, "'Paste content here...'}\" oninput=\"saveVal(${argPid},${argName},this.value)\">${esc(val)}</textarea>", "'Paste content here...'}\" oninput=\"saveVal(${argPid},${argName},this.value)\">${val}</textarea>", /unescaped stored content|injected data executed/i],
    [HTML, 'value="${esc(val)}" oninput="saveVal(${argPid}', 'value="${val}" oninput="saveVal(${argPid}', /unescaped stored content|injected data executed/i],
  ],
  'INV-21': [[HTML, 'function storageWarn(e){', 'function storageWarn(e){ return;', /storageWarn/i]],
  'INV-30': [[HTML, 'if(!window.showDirectoryPicker){ setStateIoMsg(', 'if(!window.showDirectoryPicker){ return; setStateIoMsg(', /R3 fallback/i]],
  'INV-37': [[HTML, 'overall:g(/Overall[^:\\n]*:\\s*([\\d.]+)\\s*\\/\\s*10/i)', 'overall:g(/NOPE([\\d.]+)/i)', /parseHealth|parseState|parseRepoSpec|scoreColor/i]],
  'INV-40': [[HTML, 'const SECRET_KEYS=[', 'const SECRET_KEYS=[].concat([] ,[] ), _unused=[', /secret key/i]],
  'INV-41': [[HTML, 'copyFeedback(btn,legacyCopy(text))', 'undefined', /copy failed silently/i]],
  'INV-42': [[HTML, 'panels.forEach(p=>p.classList.toggle(', 'panels.forEach(p=>0&&p.classList.toggle(', /showPanel|nav state not synced|handleHash/i]],
  'INV-44': [[HTML, '<section id="prreview" class="panel">', '<section id="prreview-x" class="panel">', /pointing at no panel/i]],
  'INV-45': [[HTML, 'onclick="copyToClipboard(${jsArg(', 'onclick="copyToClipboard(\'${esc(', /esc\(\) as a JS argument/i]],
  'INV-46': [[HTML, '${c.name} | ${c.measures||\'\'} | ${c.pulse||\'\'} | ${c.playbook||\'\'}', '${c.name} | ${c.measures||\'\'} | ${c.playbook||\'\'}', /round-trip lossy|legacy 3-field/i]],
  'INV-47': [[HTML, 'function fallbackProjectId(', 'function fallbackProjectId_unused(', /unusable id|not defined/i]],
  'INV-48': [[HTML, "reason:'foreign-app'", "reason:''", /envelope validation wrong/i]],
  'INV-49': [[HTML, 'role="button" tabindex="0"', 'data-role="button"', /mouse-only control/i]],
  'INV-50': [[HTML, "getElementById('subsysTableBody')", "getElementById('subsysTableBody-typo')", /not in the markup/i]],
  'INV-53': [['scripts/check-html.mjs', '`\\\\b${alias}\\\\.${f}\\\\s*', '`\\\\.${f}\\\\s*', /INV-53/]],
  'INV-54': [[HTML, 'onclick="copyToClipboard(${jsArg((e.content))},this)"', 'onclick="navigator.clipboard.writeText(${jsArg((e.content))})"', /bypassing copyToClipboard/i]],
  'INV-56': [[HTML, ':focus-visible{outline:2px solid var(--accent)', ':focus-visible-disabled{outline:2px solid var(--accent)', /focus-visible|outline:none/i]],
  'INV-59': [[HTML, "if(/^INV-\\d+$/i.test(parts[0]||''))id=parts.shift().toUpperCase();", "if(false)id=parts.shift().toUpperCase();", /F05/]],
  'INV-60': [[HTML, "+(err?'<div class=\"dcard-err\"", "+(false?'<div class=\"dcard-err\"", /F06/]],
  'INV-61': [
    [HTML, '.nb-g{background:rgba(34,197,94,.15);color:var(--on-green)}', '.nb-g{background:rgba(34,197,94,.15);color:#86efac}', /literal text colour/i],
    [HTML, '--on-green:#166534;', '--on-green:#86efac;', /F13 contrast/],
  ],
  // Reinstating the real collision: <pre id="t1a"> back to id="t1", which the
  // enclosing <section id="t1"> then shadows.
  'INV-67': [[HTML, '<pre id="t1a"></pre>', '<pre id="t1"></pre>', /duplicate id/i]],
  // Cycle-8 Batch 1 (F29/F19/F21): three ways the fill form failed the operator that the F11 check
  // could not see, because it starts from prompts that already have a working form. Listed first so
  // the original case keeps its place; signals are phrases only the failing line prints.
  'INV-63': [[HTML, '<div class="fill-form" id="fill-p4reflect"></div>', '', /no fill form: p4reflect/],
             [HTML, 'function isLarge(name){return DIRECTIVE_PREFIX.test(name)||', 'function isLarge(name){return ', /render as a single-line input/],
             [HTML, "if(val==='__custom__'){", "if(val==='__custom__')return;\n  if(false){", /renders no custom input/],
             // Cycle-8 follow-ons C and E: a fill form with nothing in it comes back; a field saves only on blur.
             [HTML, '      <pre id="p0">', '      <div class="fill-form" id="fill-p0"></div>\n      <pre id="p0">', /a Fill fields form with nothing to fill/],
             [HTML, 'placeholder="Paste your systems map summary here..." oninput="saveVal(', 'placeholder="Paste your systems map summary here..." onchange="saveVal(', /save only on blur/],
             [HTML, "const PH_RE = /\\[([A-Z][^\\][]*)\\]/g;", "const PH_RE = /\\[([A-Z][A-Z0-9\\s\\/\\-&',:.()]+)\\]/g;", /F11/],
             // Cycle-7 Batch 6 (F18): the length cap back — §6a's 224-char field drops out of its form.
             [HTML, "const PH_RE = /\\[([A-Z][^\\][]*)\\]/g;", "const PH_RE = /\\[([A-Z][^\\]]{0,199})\\]/g;", /F11/],
             // Cycle-7 Batch 8 (F19): the exact-match systems-map test back — §1 and §4 lose the bank.
             [HTML, "const isSysMap=n=>n.startsWith('PASTE SYSTEMS MAP SUMMARY HERE');", "const isSysMap=n=>n==='PASTE SYSTEMS MAP SUMMARY HERE';", /F19/]],
  'INV-64': [[HTML, "hash32(seed+'|'+String(inv.id))", "hash32(String(inv.id)+'|'+seed)", /F14/]],
  'INV-65': [['.cycle/STATE.md', '## Where I left off', '## Scratch\n\n## Where I left off', /F15/],
             // Cycle-8 Batch 3 — the lifecycle half of the rule (structural check 19).
             // F1: the template offers a phase no step sets.
             ['CLAUDE.md', 'Phase: [audit | implement | reflect | idle —', 'Phase: [audit | plan | implement | reflect | idle —', /cycle lifecycle \(Cycle-8 F1\): [^\n]*no step sets: plan/],
             // F1: a phase loses its only writer. (Until v1.48.0 this case removed §6a's idle write;
             // idle has three writers now, so removing one no longer violates the rule — reflect has one.)
             ['.claude/commands/reflect.md', 'set Phase: reflect and Updated', 'refresh Updated', /cycle lifecycle \(Cycle-8 F1\): [^\n]*no step sets: reflect/],
             // F4/F5: one audit's CYCLE OPEN step drifts from the others — two numbering rules.
             ['.claude/commands/audit.md', 'is the SAME audit round: Phase is already "audit" and Updated is within\nthe last 7 days', 'is the SAME audit round: Phase is already "audit" and Updated is within\nthe last 30 days', /the CYCLE OPEN step differs between/],
             // F5: an implement CHECKPOINT that no longer rolls the previous cycle's sections.
             ['.claude/commands/implement.md', 'progress" and "Completed this cycle" entries to .cycle/HISTORY.md under a', 'progress" and "Completed this cycle" entries to the end of the file under a', /does not roll the previous cycle's STATE sections into \.cycle\/HISTORY\.md: implement/],
             // F12: an implement CHECKPOINT that may overwrite a block.
             ['.claude/commands/targeted-implement.md', 'Never overwrite a block: if that name is taken', 'If that name is taken', /CHECKPOINT may overwrite an existing block: targeted-implement/],
             // F6: the command /reflect hands candidates to loses the step that takes them.
             ['.claude/commands/sync-docs.md', '5. Invariant candidates — has /reflect', '5. New rules — has /reflect', /hands invariant candidates to \/sync-docs, which has no step/]],
  'INV-62': [
    [HTML, 'id="navToggle" aria-label="Open navigation" aria-expanded="false"', 'id="navToggle" aria-label="Open navigation"', /F12/],
    [HTML, '<label class="fill-label" for="pf-name">', '<label class="fill-label" data-for="pf-name">', /F12/],
  ],

  // ── node scripts/check-template-sync.mjs ────────────────────────────────────
  'INV-02': [['README.md', '## Slash Commands Reference', '## Slash Commands Reference\n\nBogus `/totally-made-up` reference.\n', /without a CLAUDE.md template/i]],
  'INV-03': [['README.md', 'Dynamic Workflows', 'DWF-renamed', /marker "dynamic workflows"/i],
             // Cycle-8 Batch 9 (F9): /sync-docs loses its roadmap check
             [CFG, '6. Roadmap currency — if the project keeps', '6. Roadmap — if the project keeps', /marker "6\. roadmap currency" missing from: CLAUDE\.md/]],
  'INV-12': [['.claude/commands/reflect.md', 'METRICS (optional — only if .cycle/ exists)', 'METRICS', /not gated on the directory existing/i],
             // v1.35.0: the audits' CYCLE OPEN write must be inside the gating check's step set.
             ['.claude/commands/broad-scan.md', 'CYCLE OPEN (optional — only if .cycle/STATE.md exists)', 'CYCLE OPEN', /not gated on the directory existing|no longer read as writing/i],
             // Cycle-7 follow-on: the §1s body's own write is inside the derived step set now.
             [CFG, 'SEAM COUNTER (optional — only if .cycle/ exists): reset', 'SEAM COUNTER: reset', /not gated on the directory existing/i],
             // Cycle-8 Batch 8 (F44): a write that is not shaped like a step — a bullet under "Rules:".
             ['.claude/commands/implement.md', '- Check Common Gotchas before each action', '- Update .cycle/STATE.md after each action\n- Check Common Gotchas before each action', /writes cycle state outside a gated step \(Cycle-8 F44\): implement\.md/],
             // F44: a verb the old seven-verb list did not hold, and a file name with no ".cycle/" in front.
             ['.claude/commands/targeted-implement.md', '- Check Common Gotchas before each action', '- Save your progress to STATE.md as you go\n- Check Common Gotchas before each action', /writes cycle state outside a gated step \(Cycle-8 F44\): targeted-implement\.md/]],
  'INV-13': [[CFG, '### /pr-review\n', '### /pr-review-moved-out-of-claude-md\n', /without a CLAUDE.md template/i],
             // Cycle-8 Batch 9 (F8): the picker entry. gen --check agrees with a generator that drops the
             // block, so each of these is read by check 20's own parse of the table and the files.
             ['.claude/commands/audit.md', '---\ndescription: "Deep subsystem audit (produces a Session Handoff Block)"\nargument-hint: "<subsystem-name>"\n---\n\n', '', /command descriptions \(Cycle-8 F8\): [^\n]*audit\.md has no frontmatter description/],
             ['.claude/commands/reflect.md', 'description: "Post-cycle honest assessment"', 'description: "Reflect"', /reflect\.md is described as "Reflect" but its Command Index row says/],
             ['README.md', '| Post-cycle honest assessment |', '| Look back at the cycle |', /the README lists \/reflect as "Look back at the cycle"/],
             ['.claude/commands/audit.md', 'argument-hint: "<subsystem-name>"\n', '', /audit\.md reads \$ARGUMENTS and carries no argument hint/]],
  'INV-14': [['.github/workflows/sync-check.yml', '  pull_request:\n', '', /INV-14/],
             ['.github/workflows/sync-check.yml', '  pull_request:\n', '  pull_request:\n    branches: [never-a-real-branch]\n', /filters its pull_request trigger/]],
  'INV-16': [[CFG, '### Seams Audit Cadence   ← optional; default: every 4 subsystem cycles\nevery [N] subsystem cycles\n\n', '', /INV-16/]],
  'INV-18': [['.claude/commands/implement.md', '3. CHECKPOINT (optional — only if .cycle/ exists): create/update', '3. CHECKPOINT: create/update', /not gated on the directory existing/i]],
  'INV-33': [// (v1.53.0: the two console-builder cases left with the console lock.)
             // Cycle-8 Batch 8 (F43): the canonical copy tells the synthesis row to FILL the reflect-owned columns.
             [CFG, 'Leave net_score, prod_fixes, new_failure_modes, and defensive_count BLANK', 'Also fill net_score, prod_fixes, new_failure_modes, and defensive_count', /metrics-row ownership \(Cycle-8 F43\) — CLAUDE\.md §6a: [^\n]*leave net_score, prod_fixes and new_failure_modes BLANK/],
             // Cycle-7 Batch 6 (F49): a header missing a MIDDLE column matched no prefix and went unchecked.
             ['CLAUDE.md', 'axis_b_lowest,notes,defensive_count', 'axis_b_lowest,defensive_count', /canonical column list/]],
  'INV-34': [[CFG, 'investigate first', 'look at first', /contract marker\(s\) missing from CLAUDE\.md: "investigate first"/]],   // v1.53.0: the markers pin CLAUDE.md, not the console
  'INV-39': [[HTML, 'OPERATOR VISUAL CHECKS', 'VISUAL-GONE', /operator visual checks/i]],

  // ── node scripts/gen-commands.mjs --check ───────────────────────────────────
  'INV-01': [['.claude/commands/audit.md', 'Read CLAUDE.md', 'TAMPERED\nRead CLAUDE.md', /stale or missing/i]],
  // v1.50.0: an unfenced command is refused one step earlier — its Command Index row now names a command
  // the generator cannot extract — so the orphan-file message is no longer the one that prints.
  'INV-11': [[CFG, '### /roadmap\n\n```', '### /roadmap\n\nunfenced prose instead of a template', /the Command Index lists \/roadmap, which has no command template/],
             // Cycle-8 E2: an include that names no section must fail generation, never expand to nothing —
             // a truncated heading included (it must not resolve to a longer section by prefix).
             [CFG, '{{include: Seams & Invariants Audit (Section 1s in HTML tool)}}', '{{include: Seams & Invariants Audit}}', /include names no section with a fenced body/]],
  'INV-17': [[CFG, 'Produce a systems map in five phases:', 'Produce a systems map in six phases:', /stale or missing/i]],

  // ── node tests/guard.test.mjs ───────────────────────────────────────────────
  'INV-22': [['scripts/check-template-sync.mjs', 'const cmdMissing = tableCmds.filter', 'const cmdMissing = [] || tableCmds.filter', /README command lacking/i]],
  'INV-23': [['scripts/check-template-sync.mjs', 'does not match the newest CHANGELOG entry', 'matches the newest CHANGELOG entry (never printed)', /VERSION disagreeing/i],
             // Cycle-8 follow-on to F9: the roadmap contradicts the cycle. guard.test reads the LIVE ROADMAP.md.
             ['ROADMAP.md', '**Current bet:** R22, then R24, R27, and R25 / R26, in that order (operator, 2026-11-23).', '**Current bet:** R1, then R6.', /the live ROADMAP\.md fails — [^\n]*the strategic bet names R1, which is marked done or dropped/],
             ['ROADMAP.md', '- **R24 — Persist the scan report.** `effort: S (~1.5h)`', '- **R24 — Persist the scan report.** `effort: S (~1.5h)` — queued for Cycle 7', /the live ROADMAP\.md fails — [^\n]*R24 is still "queued for Cycle 7"/],
             // the check stops telling a finished item from an open one
             ['scripts/check-template-sync.mjs', 'closed: /✅ DONE|✗ DROPPED/.test(l) });', 'closed: false });', /a bet naming a finished item is not flagged/]],
  'INV-43': [['scripts/check-template-sync.mjs', 'const WORKFLOW_BLOCKS = BLOCKS.map(b => b.name.toLowerCase());', "const WORKFLOW_BLOCKS = ['session handoff block'];", /registry block with no console representation/i]],
  'INV-57': [['.github/workflows/sync-check.yml', 'permissions:\n  contents: read\n', '', /least-privilege permissions|baseline/i],
             // Cycle-7 Batch 7 (F44): the permissions block unbounded again — it reads to end of file.
             // Cycle-8 Batch 8 (F46): only the workflow-level permissions block is read again.
             ['scripts/check-template-sync.mjs', "const write = ciPermissionBlocks(wf).filter(b => b.level !== 'workflow' && /write/.test(b.text));", 'const write = [];', /detects a job-level permissions block asking for write \(Cycle-8 F46\) — guard did not fail as expected/],
             ['scripts/check-template-sync.mjs', "const perms = stripYamlComments(wf).split('\\n').filter(l => l.trim()).join('\\n').concat('\\n').match(/^permissions:[ \\t]*\\n((?:[ \\t]+\\S.*\\n)+)/m);", "const perms = wf.match(/^permissions:\\s*\\n((?:\\s+\\S.*\\n)+)/m);", /read past its block \(F44\)|comment/]],
  // INV-58 verifies THIS harness, so its case runs the meta-test (which runs
  // the audit with --only) rather than the audit itself — an invariant whose
  // Verify command is the audit would recurse into its own coverage set.
  'INV-58': [['tests/mutation-audit.mjs', 'if (uncovered.length) bad(', 'if (false && uncovered.length) bad(', /a runnable invariant with no mutation case fails the audit — audit did not fail as expected/],
             // Cycle-8 Batch 8 (F41): the audit credits a signal found anywhere in the output again.
             ['tests/mutation-audit.mjs', 'const added = linesOf(r.out, dir).filter(l => !base.lines.has(l));', 'const added = linesOf(r.out, dir);', /a signal that only matches lines a passing run prints too fails the audit — audit did not fail as expected/],
             // F41: a signal that matches any failure line is accepted again.
             ['tests/mutation-audit.mjs', 'if (genericSignal(signal)) return', 'if (false && genericSignal(signal)) return', /a signal that matches any failure line fails the audit — audit did not fail as expected/],
             // F41: an unknown --only id is not an error again ("0/0 proven ✓").
             ['tests/mutation-audit.mjs', "if (unknown.length) bad(", "if (false && unknown.length) bad(", /--only with an unknown invariant id fails the audit — audit did not fail as expected/]],
  // INV-68 — the proven vector: ONE leading space made a rule invisible to
  // invariant-check and to this audit's own derived set, while the §4v pack
  // still listed it.
  // INV-68 — make ONE reader drop rules the file contains. The first version of
  // this case indented a library line, which only violated the floor while the
  // two parsers disagreed about leading whitespace; F35 (Cycle 7) made both
  // tolerant, the indent stopped being a violation, and the case went FALSE GREEN.
  // A reader that silently narrows is what the floor exists to catch.
  'INV-68': [['scripts/verification-pack.mjs', "filter(l => /^INV-\\d+\\s*\\|/.test(l.trim()))", "filter(l => /^INV-[0-6]\\d\\s*\\|/.test(l.trim()))", /parse floor/i],
             ['scripts/invariant-check.mjs', "const m = line.match(/^(INV-\\d+)\\s*\\|(.+)$/);", "const m = line.match(/^(INV-[0-6]\\d)\\s*\\|(.+)$/);", /parse floor/i]],
  'INV-69': [[HTML, ':focus-visible{outline:2px', '.nav-item:focus-visible{outline:2px', /must apply, not merely exist/i]],
  // INV-71 — drift the ONE definition; every doc copy must stop matching it.
  'INV-71': [['scripts/health-fields.mjs', "topVertical:    'Top vertical priority:'", "topVertical:    'Top vertical priorities:'", /health-field contract/i]],
  // INV-74 — drop a stage from CI that the Test Command still documents.
  'INV-74': [['.github/workflows/sync-check.yml', 'run: node tests/portfolio.test.mjs', 'run: echo skipped', /CI never runs|Test-Command parity/i],
  ],
  // ── Cycle-7 candidates promoted by /sync-docs on 2026-11-20 (INV-76, 77, 78, 80, 81) ──
  // INV-76 — a command that names a helper script unconditionally; one that delegates a step.
  'INV-76': [['.claude/commands/pr-review.md', 'if the project has scripts/invariant-check.mjs', 'the helper scripts/invariant-check.mjs', /standalone commands \(F11\): [^\n]*names scripts\/invariant-check\.mjs unconditionally/],
             ['.claude/commands/audit.md', 'print the FROZEN SUBSYSTEM banner (see /targeted-audit) before', 'print the FROZEN SUBSYSTEM banner (see /targeted-audit step 2) before', /standalone commands \(F11\): [^\n]*delegates to another command/],
             // Cycle-8 E2: a command that includes a canonical section but does not hold its text.
             ['.claude/commands/verify.md', 'PART 2 — REGRESSION COUNT', 'PART 2 — REGRESSIONS', /verify\.md does not carry the body of "Verification Pass/],
             // Cycle-8 follow-on to F8: the label names a script — the body rule, applied to the description.
             [CFG, '| `/regression` | Post-implementation regression check | — |', '| `/regression` | Post-implementation regression check (runs scripts/regress.mjs) | — |', /the Command Index describes \/regression with a scripts\/ path/]],
  // INV-77 — the script's port of the console hash drifts from the console's own.
  'INV-77': [['scripts/verification-pack.mjs', 'h = Math.imul(h, 16777619) >>> 0; }', 'h = Math.imul(h, 16777621) >>> 0; }', /F21: --selector console picks differ/]],
  // INV-78 — a stage that is listed but cannot fail the job. (The first case proved this under
  // INV-74 until the rule had a line of its own in the library.)
  'INV-78': [['.github/workflows/sync-check.yml', 'run: node tests/mutation-audit.mjs', 'run: node tests/mutation-audit.mjs || true', /not a bare stage/],
             ['.github/workflows/sync-check.yml', '        run: node tests/guard.test.mjs', '        continue-on-error: true\n        run: node tests/guard.test.mjs', /a conditional or failure-tolerant job\/step can skip or swallow a stage/]],
  // INV-80 — a release dropped from the "changed none" list.
  'INV-80': [['.cycle/config.md', 'v1.36.0–v1.41.0', 'v1.36.0–v1.40.0', /re-pull list \(Operator State Checklist\): [^\n]*in neither list: v1\.41\.0/]],
  // INV-81 — delete stops purging; delete takes a longer id's keys with it.
  'INV-81': [[HTML, '  purgeProjectData(id);\n  if(activeProjectId===id)', '  if(activeProjectId===id)', /project delete: [^\n]*survived the delete/],
             [HTML, '&&!longer.some(o=>k.indexOf(`ccg:${o}:`)===0)) doomed.push(k);', ') doomed.push(k);', /project delete: [^\n]*was wrongly removed/]],
  // INV-86/87/88 (v1.53.0) — the lifecycle rules' CONTENT (structural check 23). Each case breaks ONE copy.
  'INV-86': [['.claude/commands/audit.md', 'the last 7 days', 'the last 70 days', /CYCLE OPEN content \(v1\.53\.0, INV-86\): [^\n]*audit's CYCLE OPEN lacks the 7-day same-round bound/],
             ['.claude/commands/broad-scan.md', 'it does not hold the number', 'it still holds the number', /CYCLE OPEN content \(v1\.53\.0, INV-86\): [^\n]*broad-scan's CYCLE OPEN lacks an old "Phase: audit" not holding the number/],
             ['.claude/commands/targeted-audit.md', 'was reflected but never verified or synthesized', 'was reflected', /CYCLE OPEN content \(v1\.53\.0, INV-86\): [^\n]*targeted-audit's CYCLE OPEN lacks the reflected-but-unsynthesized report/]],
  'INV-87': [['CLAUDE.md', "— a synthesized cycle is closed — but only if STATE.md's", "— a synthesized cycle is closed — whenever STATE.md's", /conditional idle \(v1\.53\.0, INV-87\): [^\n]*§6a body's step 8 does not limit Phase: idle/],
             ['.claude/commands/health-synthesis.md', 'leave Phase alone and say so.', 'set it to idle as well.', /conditional idle \(v1\.53\.0, INV-87\): [^\n]*health-synthesis\.md's step 8 does not leave a later cycle's Phase alone/]],
  'INV-88': [['.claude/commands/reflect.md', 'OR in any earlier "Invariant candidates" line', 'and', /candidate numbering \(v1\.53\.0, INV-88\): [^\n]*\/reflect numbers candidates from the library alone/],
             ['.claude/commands/seams-audit.md', '"Invariant candidates" or "Proposed additions" line under .cycle/blocks/', 'library entry', /candidate numbering \(v1\.53\.0, INV-88\): [^\n]*\/seams-audit numbers proposed invariants from the library alone/]],
  // INV-73 (v1.53.0) — the Seams audit asks about the project's configured Axis B categories.
  'INV-73': [['.claude/commands/seams-audit.md', "Provide cross-cutting observations for each of the project's Axis B categories — the Horizontal (Axis B) Categories in the Cycle Workflow Config", 'Provide cross-cutting observations relevant to the five Axis B categories from Health Synthesis', /configured Axis B in the Seams audit \(v1\.53\.0, INV-73\): [^\n]*seams-audit\.md's Part 4 does not ask/],
             ['CLAUDE.md', 'HORIZONTAL OBSERVATIONS (evidence for next Axis B scoring — one line per Axis B category in the Cycle Workflow Config', 'HORIZONTAL OBSERVATIONS (evidence for next Axis B scoring — one line per default category', /configured Axis B in the Seams audit \(v1\.53\.0, INV-73\): [^\n]*§1s body's output block does not take one line per configured/]],
  // INV-91 (v1.53.0) — one dead-code lens in every audit. Each case breaks ONE copy.
  'INV-91': [['.claude/commands/targeted-audit.md', 'never removals.', 'or removals.', /dead-code lens \(v1\.53\.0, INV-91\): [^\n]*audit\(s\) with no dead\/superseded-artifact lens: targeted-audit/],
             ['.claude/commands/audit.md', 'Volume is not a\n   finding; concealment is. ', '', /dead-code lens \(v1\.53\.0, INV-91\): [^\n]*audit's dead-code lens lacks "Volume is not a finding; concealment is\."/],
             ['.claude/commands/broad-scan.md', 'it, it is a PROPOSE, not a finding.', 'it, remove it.', /dead-code lens \(v1\.53\.0, INV-91\): [^\n]*broad-scan lacks the rule that a removal needs a fix's evidence/]],
  // INV-92 (v1.54.0) — /verify and /health-synthesis stop with no reflect block; a fixed verification block name.
  'INV-92': [['.claude/commands/verify.md', "NO REFLECT BLOCK — if none of that cycle's files is a …-reflect.md", 'If there is no …-reflect.md', /verification inputs \(v1\.54\.0, INV-92\): [^\n]*\/verify does not check for the cycle's reflect block/],
             ['.claude/commands/health-synthesis.md', 'first. Do not go on until they answer.', 'first, or carry on.', /verification inputs \(v1\.54\.0, INV-92\): [^\n]*\/health-synthesis does not stop and ask/],
             ['.claude/commands/verify.md', '.cycle/blocks/<cycle>-verification.md — a fixed name, taking no letter', '.cycle/blocks/<cycle>-<letter>-verification.md — the next unused letter', /verification inputs \(v1\.54\.0, INV-92\): [^\n]*\/verify does not write its block under the fixed name/]],
  // INV-90 (v1.52.0) — follow-on items tracked to a disposition (structural check 22).
  // Every case breaks ONE copy and is caught by that copy's CONTENT, not only by
  // the copies disagreeing — the property Cycle-8 §4v found missing for F4–F6.
  'INV-90': [['.claude/commands/targeted-implement.md', '- roadmap — too large for one session; /sync-docs proposes a roadmap item\n', '', /follow-on tracking \(v1\.52\.0\): [^\n]*targeted-implement's FOLLOW-ON IDS rule lacks the "roadmap" disposition/],
             ['.claude/commands/regression.md', 'FOLLOW-ON IDS (every follow-on item this session reports)', 'FOLLOW-ON NOTES (every follow-on item this session reports)', /follow-on tracking \(v1\.52\.0\): [^\n]*reports follow-on items with no FOLLOW-ON IDS rule: regression/],
             ['.claude/commands/implement.md', "- FO-[cycle]-[n] | [File: area] — [out-of-scope item for the backlog] | → [this cycle | next audit | roadmap | decision | won't do (reason)]", '- [out-of-scope items to add to the backlog]', /follow-on tracking \(v1\.52\.0\): [^\n]*implement's follow-on item line is not an FO ID/],
             ['.claude/commands/broad-implement.md', '"Noted" is not a disposition. ', '', /follow-on tracking \(v1\.52\.0\): [^\n]*broad-implement's FOLLOW-ON IDS rule lacks the refusal of "noted"/],
             ['.claude/commands/implement.md', '- this cycle — a later implement session takes it by its ID', '- this cycle — a later session may take it', /follow-on tracking \(v1\.52\.0\): [^\n]*the FOLLOW-ON IDS rule differs between/],
             ['.claude/commands/cycle-resume.md', 'remove each open item this\nsession finished or closed', 'leave the open items as they\nare', /follow-on tracking \(v1\.52\.0\): [^\n]*cycle-resume's FOLLOW-ON IDS rule lacks removing finished items/],
             ['.claude/commands/audit.md', '- already fixed: say what you checked;\n', '', /follow-on tracking \(v1\.52\.0\): [^\n]*audit's FOLLOW-ON REVIEW lacks "- already fixed:"/],
             ['.claude/commands/targeted-audit.md', 'already fixed from\n.cycle/STATE.md to .cycle/HISTORY.md with what you checked, and', 'already fixed from\n.cycle/STATE.md, and', /follow-on tracking \(v1\.52\.0\): [^\n]*targeted-audit's FOLLOW-ON REVIEW lacks "to \.cycle\/HISTORY\.md with what you checked"/],
             ['.claude/commands/broad-scan.md', 'FOLLOW-ON REVIEW (optional', 'FOLLOW-UP NOTE (optional', /follow-on tracking \(v1\.52\.0\): [^\n]*no FOLLOW-ON REVIEW step: broad-scan/],
             ['.claude/commands/targeted-audit.md', 'is a LEAD, not a finding', 'is a finding', /follow-on tracking \(v1\.52\.0\): [^\n]*targeted-audit's FOLLOW-ON REVIEW lacks "is a LEAD, not a finding"/],
             ['.claude/commands/broad-implement.md', '- FO-<cycle>-<n> items (follow-on items', '- Follow-on items (items', /follow-on tracking \(v1\.52\.0\): [^\n]*\/broad-implement does not take FO items by ID/],
             ['.claude/commands/cycle-close.md', 'marked "this cycle" is OWED', 'marked "this cycle" is carried', /follow-on tracking \(v1\.52\.0\): [^\n]*\/cycle-close does not check follow-on dispositions/],
             ['CLAUDE.md', '## Open follow-on items\n- FO-[cycle]-[n] | [File: area]', '## Open follow-on items\n- [File: area]', /follow-on tracking \(v1\.52\.0\): [^\n]*STATE\.md template's follow-on line does not show/],
             ['.cycle/STATE.md', 'could not be exercised here | → next audit', 'could not be exercised here', /follow-on tracking \(v1\.52\.0\): [^\n]*no FO ID or no open disposition: "- FO-8-5 /],
             ['.cycle/STATE.md', 'never been run end to end | → next audit', 'never been run end to end | → noted', /follow-on tracking \(v1\.52\.0\): [^\n]*no FO ID or no open disposition: "- FO-8-20 /],
             ['.cycle/STATE.md', '- FO-8-13 |', '- FO-8-11 |', /follow-on tracking \(v1\.52\.0\): [^\n]*FO-8-11 is used twice/]],
  // INV-72 — ship a release into the current cycle with no block for it.
  // INV-75 — drop one of the three clause labels from the canonical rule.
  'INV-75': [['CLAUDE.md', '(a) DECLINE —', '(a) DROP —', /relative policy trigger \(INV-75\): [^\n]*no longer names the "DECLINE" clause/],
             // Cycle-8 Batch 8 (F45): the floor is back as a literal, in words the old regex did not know.
             ['CLAUDE.md', '(d) ABSOLUTE FLOOR — it is at or below `Policy threshold`, regardless of trend.', '(d) ABSOLUTE FLOOR — it is at or below 5/10 for two cycles running, regardless of trend.', /a hardcoded policy floor is written into the prose \(Cycle-8 F45\)/],
             // F45: a clause stops reading its field while the section still names it elsewhere.
             ['CLAUDE.md', '(a) DECLINE — its score fell in `Consecutive cycles` consecutive cycles, at any magnitude.', '(a) DECLINE — its score fell in 2 consecutive cycles, at any magnitude.', /the DECLINE clause no longer reads `Consecutive cycles`/],
             // F45: the floor written into a command file, outside the canonical section.
             ['.claude/commands/health-pulse.md', 'Close with:', 'A category at or below 4/10 for two consecutive cycles needs a policy response.\n\nClose with:', /a hardcoded policy floor is written into the prose \(Cycle-8 F45\) — health-pulse\.md/]],
  // Pin STATE.md back to Cycle 6: every release after Cycle 6's (v1.35.0 on) then
  // sits in range with no 06- block. The first version of this case inserted a
  // fake 1.30.2 release, which only fell inside the floor while the cycle WAS 6 —
  // it went FALSE GREEN the moment Cycle 7 opened. Blocks accumulate and are
  // never deleted, so this form stays violating in every later cycle.
  'INV-72': [['.cycle/STATE.md', '\nCycle: ', '\nCycle: 6\nPinned-by-mutation: ', /release with no block/i],
             // Cycle-8 Batch 2 (F7): the floor comes from EARLIER cycles' blocks. Without that a cycle's first
             // release is unguarded — but the live tree cannot show it (this cycle already has a block), so the
             // proof is guard.test's sandbox, which INV-72's Verify now also runs.
             ['scripts/check-template-sync.mjs', 'const earlier = versioned.filter(x => x.cycle < Number(cycle))', 'const earlier = versioned.filter(x => false)', /Cycle-8 F7: /]],

  // ── node scripts/gen-html-prompts.mjs --assert ──────────────────────────────

  // ── node scripts/check-output-blocks.mjs ────────────────────────────────────
  'INV-31': [[CFG, 'Audit confidence: [High / Medium / Low]\n', '', /audit confidence|missing field/i],
             // Cycle-7 Batch 7 (F50): a field outside the registry's hand-listed subset, renamed in one copy.
             [CFG, '### TIER 2 HANDOFF BLOCK\n```\n---TIER 2 HANDOFF BLOCK---\nScope: [subsystem]\nFindings: [count] total — [critical/high/medium/low breakdown]\nProduction bugs (would fire this month): [count]', '### TIER 2 HANDOFF BLOCK\n```\n---TIER 2 HANDOFF BLOCK---\nScope: [subsystem]\nFindings: [count] total — [critical/high/medium/low breakdown]\nProduction bugs: [count]', /lacks field\(s\) other copies carry/]],
  'INV-38': [[CFG, 'SEAM INVENTORY:', 'SEAM-LIST:', /seam inventory|missing field/i]],

  // ── the remaining test-backed scripts ───────────────────────────────────────
  'INV-24': [['scripts/cycle-context.mjs', 'existsSync', 'Boolean', /no context block emitted/],
             // Cycle-7 Batch 7 (F37): the Current Standing and Pending outputs had no fixture.
             ['scripts/cycle-context.mjs', "    if (lines.length) out.push(", "    if (false) out.push(", /Current Standing score line missing/],
             // v1.53.0: the hook carries facts only — put the implementer's narrative back and it fails.
             ['scripts/cycle-context.mjs', "  if (current) out.push(`\\n## Current\\n${current}`);", "  if (current) out.push(`\\n## Current\\n${current}`);\n  { const w = section(state, 'Where I left off'); if (w) out.push(`\\n## Where I left off\\n${w}`); }", /hook carried Where I left off/],
             ['scripts/cycle-context.mjs', ".map(l => l.split(' — ')[0])", "", /hook carried the standing's prose/],
             // Cycle-8 Batch 2 (F11): the hook back on the working directory — the script, then the command.
             ['scripts/cycle-context.mjs', 'process.env.CLAUDE_PROJECT_DIR || process.cwd()', 'process.cwd()', /Cycle-8 F11: /],
             ['.claude/settings.json', '${CLAUDE_PROJECT_DIR:-.}/', '', /Cycle-8 F11: /]],
  'INV-25': [['scripts/csv.mjs', 'export function parseCSV(text) {', 'export function parseCSV(text) { text = text.split(\'\\n\').slice(0, 2).join(\'\\n\');', /cumulative net score wrong/]],
  'INV-26': [['scripts/invariant-check.mjs', 'const cmd = verify.split(/\\s+\\(|\\s+\\+\\s+|\\s+then\\s+/i)[0].trim();', 'const cmd = verify.trim();', /summary counts wrong/],
             // Cycle-7 Batch 7 (F38): dedupe removed — each invariant gets its own key, so a shared command runs per rule.
             ['scripts/invariant-check.mjs', 'if (cmd) { if (!byCmd.has(cmd)) byCmd.set(cmd, []); byCmd.get(cmd).push(inv); }', "if (cmd) { byCmd.set(cmd + ' #' + inv.id, [inv]); }", /identical commands must run once/],
             // Cycle-7 Batch 8 (F42): Verify commands back in the caller's directory.
             ['scripts/invariant-check.mjs', 'execSync(cmd, { cwd, stdio:', 'execSync(cmd, { stdio:', /did not run in the project root/],
             // Cycle-8 Batch 2 (F2): the Verify command cut at its first pipe again.
             ['scripts/invariant-check.mjs', '      let cmd = body.slice(v.end);', "      let cmd = body.slice(v.end).split('|')[0];", /the command was cut at the pipe/]],
  'INV-27': [['scripts/portfolio.mjs', 'function section(md, heading) {', 'function section(md, heading) { return \'\';', /missing project alpha/]],
  // The extractors run past the closing fence, so a body swallows the next command's section.
  'INV-28': [['scripts/gen-html-prompts.mjs', "j < lines.length && lines[j].trim() !== '```'; j++) body.push", 'j < lines.length; j++) body.push', /commandBody extraction wrong/]],
  // The harness stops noticing a required field missing from a block.
  'INV-32': [['scripts/check-output-blocks.mjs', 'const missing = b.fields.filter(f => !s.body.includes(f));', 'const missing = [];', /did not detect a dropped field/]],
  'INV-35': [['scripts/portfolio-status.mjs', 'function seamsCadence(cycleDir, root) {', 'function seamsCadence(cycleDir, root) { return \'\';', /beta seams-DUE wrong/],
             // v1.48.0: a project with .cycle/ state and no PROJECT_HEALTH.md is skipped again.
             ['scripts/portfolio-status.mjs', "    md = ''; noHealth = true;", "    console.error('skipped'); continue;", /no-health project: /],
             // Cycle-8 Batch 3 (F1): every non-idle phase reads "in progress — run /cycle-resume" again.
             ['scripts/portfolio-status.mjs', "const phaseKind = phase => PHASE_KIND[String(phase).toLowerCase().split(/\\s+/)[0]] || 'wip';", "const phaseKind = phase => (String(phase).toLowerCase() === 'idle' ? 'idle' : 'wip');", /Cycle-8 F1: phase misclassified/]],
  'INV-51': [['scripts/render-metrics.mjs', "that cycle's net ${synthNet}", "that cycle's net ${lastSynth.net_score}", /F12: synthesis line did not sum the cycle net/]],
  // The probe selection stops depending on its seed — every pack would name the same five.
  'INV-52': [['scripts/verification-pack.mjs', "line.split('|')[0].trim() + String(seed)", "line.split('|')[0].trim()", /selectProbes ignored the seed/],
             // Cycle-8 Batch 2 (F3): the library injected as a replacement STRING again ($& $' $$ read as patterns).
             ['scripts/verification-pack.mjs', '() => library)', 'library)', /Cycle-8 F3: /],
             // Cycle-8 follow-on A: process.exit() after writing stdout — a piped pack is cut short.
             ['scripts/verification-pack.mjs', 'process.exitCode = main(process.argv.slice(2));', 'process.exit(main(process.argv.slice(2)));', /Cycle-8 follow-on A: /],
             // Cycle-8 Batch 3 (F4): a pack built without --cycle says nothing about the earlier cycle still owed §4v.
             ['scripts/verification-pack.mjs', 'const owed = explicitCycle ? null : pendingCloseOut(metrics, cycle);', 'const owed = null;', /Cycle-8 F4: /]],
  // INV-70 — reintroduce the disclosure/use split: select with a truncated
  // seed while the header still prints the full one.
  // Re-targeted in Cycle-7 Batch 8: buildPack now dispatches through SELECTORS (F21).
  'INV-70': [['scripts/verification-pack.mjs', 'const probes = SELECTORS[selector](invariants, seed);', 'const probes = SELECTORS[selector](invariants, String(seed).slice(0, 4));', /does NOT reproduce/i]],
};

// ── Coverage, derived from the live library ───────────────────────────────────
const libSrc = defaultSource(REPO);
const invariants = parseInvariants(readFileSync(libSrc, 'utf8'));
const runnable = invariants.map(i => ({ ...i, cmd: toCommand(i.verify) })).filter(i => i.cmd);

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

const uncovered = runnable.filter(i => !CASES[i.id]);
const orphaned = Object.keys(CASES).filter(id => !runnable.some(i => i.id === id));
if (uncovered.length) bad(`runnable invariant(s) with no mutation case — unproven, add one to CASES: ${uncovered.map(i => i.id).join(', ')}`);
if (orphaned.length) bad(`mutation case(s) for an invariant that is no longer runnable: ${orphaned.join(', ')}`);

// Cycle-8 F41: `--only INV-999` matched nothing and the audit reported
// "0/0 runnable invariants proven … ✓" with exit 0 — a typo in a CI step or a
// §4v probe read as proof. An id the library does not hold as runnable is an
// error, and so is a run that proves nothing.
if (ONLY) {
  const unknown = [...ONLY].filter(id => !runnable.some(i => i.id === id));
  if (unknown.length) bad(`--only names id(s) that are not runnable invariants in the library: ${unknown.join(', ')}`);
}

// A signal has to name ITS assertion. One that matches any failure line at all
// ("✗", "error") credits whatever happened to fail — including a script that
// simply crashed on a broken import (F41: four proofs were exactly that).
const GENERIC_FAILURE_LINES = ['  ✗ some other check failed', 'Error: boom', 'error', 'something failed'];
const genericSignal = signal => GENERIC_FAILURE_LINES.some(l => signal.test(l));

// ── Run ───────────────────────────────────────────────────────────────────────
const targets = runnable.filter(i => CASES[i.id] && (!ONLY || ONLY.has(i.id)));
if (!targets.length) bad('no invariant selected — the audit ran nothing, which proves nothing');

const copyRepo = async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mut-'));
  await cp(REPO, dir, { recursive: true, filter: s => !s.includes('/.git/') && !s.endsWith('/.git') });
  return dir;
};
// exec, not execSync: a synchronous child blocks the event loop, so the worker
// pool below ran one case at a time whatever --jobs said (F41).
const run = (cmd, cwd) => new Promise(resolve => {
  exec(cmd, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: CASE_TIMEOUT_MS }, (err, stdout, stderr) => {
    const out = (stdout || '') + (stderr || '');
    if (!err) return resolve({ code: 0, out });
    resolve({ code: typeof err.code === 'number' ? err.code : 1, out, timedOut: !!err.killed });
  });
});
// Lines are compared with the copy's own path removed, so the same line from
// two different temp directories is the same line.
const linesOf = (out, dir) => out.split(dir).join('<ROOT>').split('\n').map(l => l.trimEnd()).filter(Boolean);

// What each Verify command prints when NOTHING is wrong. Only output the
// mutation ADDS can be evidence (F41: 37 of 104 signals also matched a passing
// run — "/INV-07/" is printed by the ✓ line too — so a mutation that failed some
// OTHER assertion in the same command was credited to this invariant).
const baselines = new Map();
async function baselineFor(cmd) {
  if (!baselines.has(cmd)) baselines.set(cmd, (async () => {
    const dir = await copyRepo();
    try { const r = await run(cmd, dir); return { code: r.code, lines: new Set(linesOf(r.out, dir)) }; }
    finally { await rm(dir, { recursive: true, force: true }); }
  })());
  return baselines.get(cmd);
}

async function runCase(inv, [file, find, replace, signal], n) {
  if (genericSignal(signal)) return { verdict: 'WEAK SIGNAL', detail: `mutation ${n}: ${signal} matches any failure line — name the phrase this invariant's own assertion prints` };
  const base = await baselineFor(inv.cmd);
  if (base.code) return { verdict: 'BROKEN BASELINE', detail: `${inv.cmd} fails on an unmodified copy (exit ${base.code}) — nothing can be proven against it` };
  const dir = await copyRepo();
  try {
    const path = join(dir, file);
    if (!existsSync(path)) return { verdict: 'NO-TARGET', detail: `${file} does not exist` };
    const before = await readFile(path, 'utf8');
    if (!before.includes(find)) return { verdict: 'NO-TARGET', detail: `${file} no longer contains ${JSON.stringify(find.slice(0, 50))}` };
    await writeFile(path, before.split(find).join(replace));
    const r = await run(inv.cmd, dir);
    if (r.timedOut) return { verdict: 'TIMEOUT', detail: `mutation ${n}: ${inv.cmd} did not finish in ${CASE_TIMEOUT_MS / 1000}s` };
    if (!r.code) return { verdict: 'FALSE GREEN', detail: `mutation ${n}: ${inv.cmd} still passed` };
    const added = linesOf(r.out, dir).filter(l => !base.lines.has(l));
    if (signal.test(added.join('\n'))) return { verdict: 'CAUGHT', detail: `mutation ${n}` };
    return { verdict: 'WRONG CHECK', detail: signal.test(r.out)
      ? `mutation ${n}: failed, but ${signal} only matches lines a PASSING run prints too — not this invariant's assertion`
      : `mutation ${n}: failed, but not via this invariant's assertion (no ${signal})` };
  } finally { await rm(dir, { recursive: true, force: true }); }
}

// Flatten to a work queue so multi-mutation invariants parallelise too.
const queue = targets.flatMap(inv => CASES[inv.id].map((c, i) => ({ inv, c, n: i + 1 })));
const results = new Map();
let cursor = 0;
async function worker() {
  while (cursor < queue.length) {
    const { inv, c, n } = queue[cursor++];
    let r;
    try { r = await runCase(inv, c, n); }
    catch (e) { r = { verdict: 'AUDIT ERROR', detail: `mutation ${n}: ${e.message}` }; }
    if (!results.has(inv.id)) results.set(inv.id, []);
    results.get(inv.id).push(r);
  }
}
await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, worker));

for (const inv of targets) {
  const rs = results.get(inv.id) || [];
  const worst = rs.find(r => r.verdict !== 'CAUGHT');
  const label = `${inv.id} (${rs.length} mutation${rs.length === 1 ? '' : 's'}) via \`${inv.cmd}\``;
  if (!worst) ok(label);
  else bad(`${label} — ${worst.verdict}: ${worst.detail}`);
}

console.log('Invariant mutation audit — violate each rule, run its own Verify command:\n');
console.log(log.join('\n'));
const proven = targets.filter(i => (results.get(i.id) || []).length && results.get(i.id).every(r => r.verdict === 'CAUGHT')).length;
console.log(`\n${proven}/${targets.length} runnable invariants proven fail-closed (${queue.length} mutations, ${JOBS} at a time); library: ${invariants.length} total, ${runnable.length} runnable.`);
// exitCode, not exit(): a piped report is not cut short (the class verification-pack had).
if (failures) { console.error(`\n${failures} problem(s): not every selected invariant is proven fail-closed.`); process.exitCode = 1; }
else console.log('Every runnable invariant fails closed when violated. ✓');
