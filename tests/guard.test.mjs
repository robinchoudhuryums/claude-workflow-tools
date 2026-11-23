#!/usr/bin/env node
// guard.test.mjs
//
// Regression test for the sync guard (scripts/check-template-sync.mjs) —
// the F03 logic that previously had no committed test (Cycle 1 Category D).
// Black-box: copies the repo's guard inputs into a temp dir, runs the real
// guard, and asserts it PASSES on a clean copy and FAILS closed on each
// kind of injected drift it is supposed to catch.
//
// Usage: node tests/guard.test.mjs   (exit 0 = all cases behaved, 1 = a gap)

import { mkdtempSync, copyFileSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, cpSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'cwt-guard-'));
  for (const f of ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html', 'VERSION', 'CHANGELOG.md']) copyFileSync(join(repo, f), join(dir, f));
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  // check-output-blocks.mjs is copied because check-template-sync now imports
  // BLOCKS from it (F17) — the guard cannot run in the temp dir without it.
  // gen-html-prompts.mjs: gen-commands imports sectionBody from it to expand include lines (v1.48.0).
  for (const s of ['gen-commands.mjs', 'gen-html-prompts.mjs', 'check-template-sync.mjs', 'check-output-blocks.mjs', 'health-fields.mjs']) copyFileSync(join(repo, 'scripts', s), join(dir, 'scripts', s));
  cpSync(join(repo, '.claude'), join(dir, '.claude'), { recursive: true });
  // The guard now asserts the CI workflow's permissions block (F15), so the
  // temp copy needs it — without this the baseline case fails for a reason
  // unrelated to any injected drift.
  cpSync(join(repo, '.github'), join(dir, '.github'), { recursive: true });
  return dir;
}
function runGuard(dir) {
  const opts = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
  try { const out = execFileSync('node', [join(dir, 'scripts', 'check-template-sync.mjs')], opts); return { code: 0, out }; }
  catch (e) { return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }; }
}

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

// Case helper: mutate a fresh copy, run, assert it fails with the right signal.
function expectFail(label, mutate, signal) {
  const d = setup();
  try { mutate(d); const r = runGuard(d); if (r.code !== 0 && signal.test(r.out)) ok(label); else bad(`${label} — guard did not fail as expected (code ${r.code})`); }
  catch (e) { bad(`${label} — ${e.message}`); }
  finally { rmSync(d, { recursive: true, force: true }); }
}

// 1) Baseline: an unmodified copy passes.
{
  const d = setup();
  try { const r = runGuard(d); if (r.code === 0) ok('baseline (unmodified copy) passes'); else bad('baseline copy failed: ' + r.out.slice(-300)); }
  finally { rmSync(d, { recursive: true, force: true }); }
}

// 2) A removed capability marker is caught.
expectFail('detects a removed capability marker (Dynamic Workflows)',
  d => writeFileSync(join(d, 'README.md'), readFileSync(join(d, 'README.md'), 'utf8').replaceAll('Dynamic Workflows', 'DWF-renamed')),
  /dynamic workflows/i);

// 3) A stale generated command file is caught.
expectFail('detects a stale .claude/commands file',
  d => appendFileSync(join(d, '.claude', 'commands', 'audit.md'), '\nTAMPERED\n'),
  /stale|\.claude\/commands/i);

// 4) A README command with no CLAUDE.md template is caught.
expectFail('detects a README command lacking a CLAUDE.md template',
  d => appendFileSync(join(d, 'README.md'), '\nBogus `/totally-made-up` reference.\n'),
  /totally-made-up/);

// 5) A workflow output block missing from the HTML console is caught.
expectFail('detects a workflow block dropped from the HTML console',
  d => writeFileSync(join(d, 'claude-code-guide-v2.html'), readFileSync(join(d, 'claude-code-guide-v2.html'), 'utf8').replaceAll('CYCLE SUMMARY BLOCK', 'CYCLE-SUMMARY-GONE')),
  /cycle summary block|reflect emits/i);

// 6) Command-pair parity (P4): a shared behavior removed from one member of a pair is caught.
expectFail('detects command-pair parity drift (shared behavior dropped from one member)',
  d => { const f = join(d, '.claude', 'commands', 'broad-implement.md'); writeFileSync(f, readFileSync(f, 'utf8').replace(/test doubles/i, 'TEST-DOUBLES-REMOVED')); },
  /shared behavior|drift across the pair/i);

// 7) Metrics schema parity (P11): a metrics.csv header that drops the
// trailing defensive_count column is caught.
expectFail('detects a metrics.csv header missing defensive_count',
  d => { const f = join(d, 'CLAUDE.md'); writeFileSync(f, readFileSync(f, 'utf8').replace(',axis_b_lowest,notes,defensive_count', ',axis_b_lowest,notes')); },
  /defensive_count/i);

// 8) Metrics-row ownership (P1): re-introducing "phase=synthesis with the
// overall net_score" (the double-count footgun) is caught.
expectFail('detects the §6a synthesis double-count footgun (net_score on a synthesis row)',
  d => { const f = join(d, 'CLAUDE.md'); writeFileSync(f, readFileSync(f, 'utf8').replace('Fill phase=synthesis with the Category D ratio', 'Fill phase=synthesis with the overall net_score')); },
  /double-count|net_score/i);

// 9) Dynamic-builder parity (R16): a dropped contract marker in a dynamic
// console builder (here §6a's "TWO-AXIS GRID") is caught.
// (v1.53.0: the console lock is retired, so the contract markers pin CLAUDE.md, not the console's copy.)
expectFail('detects a canonical prompt contract losing its marker (a dropped contract marker)',
  d => { const f = join(d, 'CLAUDE.md'); writeFileSync(f, readFileSync(f, 'utf8').replace(/TWO-AXIS GRID/gi, 'TWO-PLANE GRID')); },
  /two-axis grid/i);

// 10) Interface/visual lens (R18): dropping the perceptual routing target from
// the console — the half that stops the audit guessing at what it cannot see —
// is caught. Uses replaceAll: the phrase appears in both the §T1 builder and
// the console's own copy, and the marker only fails once every copy is gone.
expectFail('detects the interface lens losing its perceptual routing (R18)',
  d => { const f = join(d, 'claude-code-guide-v2.html'); writeFileSync(f, readFileSync(f, 'utf8').replaceAll('OPERATOR VISUAL CHECKS', 'VISUAL-CHECKS-GONE')); },
  /operator visual checks/i);

// 11) Interface/visual lens (R18): dropping the lens heading from the canonical
// command is caught (the console-side equivalent is additionally --assert-locked).
expectFail('detects the interface lens dropped from the canonical command (R18)',
  d => { const f = join(d, 'CLAUDE.md'); writeFileSync(f, readFileSync(f, 'utf8').replaceAll('INTERFACE & VISUAL LAYER', 'INTERFACE-LAYER-GONE')); },
  /interface & visual layer/i);

// 12) Derived block coverage (F17): a block that the OLD hand-maintained
// WORKFLOW_BLOCKS list did not cover must now fail when dropped from the
// console. PR REVIEW BLOCK is the regression case — it was absent from the
// console for four releases precisely because this check could not see it.
expectFail('detects a previously-unguarded block dropped from CLAUDE.md (F17; the console half left with its lock in v1.53.0)',
  d => { const f = join(d, 'CLAUDE.md'); writeFileSync(f, readFileSync(f, 'utf8').replaceAll('PR REVIEW BLOCK', 'PR-REVIEW-GONE')); },
  /pr review block/i);

// 13) Derived block coverage (F17): the derivation itself must hold. If a block
// is added to the check-output-blocks registry but no console section carries
// it, the guard fails rather than silently covering 7 of 12 again.
expectFail('detects a registry block with no console representation (F17)',
  d => {
    const f = join(d, 'scripts', 'check-output-blocks.mjs');
    writeFileSync(f, readFileSync(f, 'utf8').replace(
      'export const BLOCKS = [',
      "export const BLOCKS = [\n  { name: 'BRAND NEW BLOCK', open: '---BRAND NEW BLOCK---', close: '---END BRAND NEW BLOCK---', producer: null, inFormats: false, fields: [] },"));
  },
  /brand new block/i);

// 14) VERSION↔CHANGELOG consistency (F09): presence alone was a false green —
// VERSION could disagree with the newest CHANGELOG entry and the guard stayed
// silent. This is what made INV-23's "bumped when semantics change" clause
// unverified (proven by the F11 mutation audit).
expectFail('detects VERSION disagreeing with the newest CHANGELOG entry (F09)',
  d => writeFileSync(join(d, 'VERSION'), '9.9.9\n'),
  /does not match the newest CHANGELOG entry/i);

// 15) CI least privilege (F15): dropping the permissions block is caught. §4v
// listed this as a Category D candidate — the block shipped with no assertion,
// so a later edit could silently restore the inherited default.
expectFail('detects the CI workflow losing its least-privilege permissions (F15)',
  d => { const f = join(d, '.github', 'workflows', 'sync-check.yml'); writeFileSync(f, readFileSync(f, 'utf8').replace(/^permissions:\s*\n\s+contents: read\n/m, '')); },
  /permissions/i);

// 16) CI workflow read as STRUCTURE (F31). Each of these passed the old
// raw-text regexes: a commented-out stage, a stage that cannot fail (`|| true`),
// a failure-tolerant or conditional step, and a filtered trigger. The parity
// cases need the live Test Command, so they copy .cycle/config.md in.
const ciEdit = (d, find, repl, withConfig = true) => {
  if (withConfig) { mkdirSync(join(d, '.cycle'), { recursive: true }); copyFileSync(join(repo, '.cycle', 'config.md'), join(d, '.cycle', 'config.md')); }
  const f = join(d, '.github', 'workflows', 'sync-check.yml'), t = readFileSync(f, 'utf8');
  if (!t.includes(find)) throw new Error('fixture rotted: ' + find);
  writeFileSync(f, t.replace(find, repl));
};
expectFail('detects a CI stage commented out behind `echo` (F31)',
  d => ciEdit(d, 'run: node tests/portfolio-status.test.mjs', 'run: echo skipped  # node tests/portfolio-status.test.mjs'),
  /CI never runs: tests\/portfolio-status\.test\.mjs/);
expectFail('detects a CI stage that cannot fail (`|| true`) (F31)',
  d => ciEdit(d, 'run: node tests/mutation-audit.mjs', 'run: node tests/mutation-audit.mjs || true'),
  /is not a bare stage/);
expectFail('detects a failure-tolerant CI step (continue-on-error) (F31)',
  d => ciEdit(d, '        run: node tests/guard.test.mjs\n', '        run: node tests/guard.test.mjs\n        continue-on-error: true\n'),
  /continue-on-error: true/);
expectFail('detects a conditional CI step (if:) (F31)',
  d => ciEdit(d, '      - name: Guard regression test', '      - if: false\n        name: Guard regression test'),
  /if: false/);
expectFail('detects a branch filter on the pull_request trigger (F31)',
  d => ciEdit(d, '  pull_request:\n', '  pull_request:\n    branches: [never-a-real-branch]\n', false),
  /filters its pull_request trigger/);
expectFail('detects an inline filter on the push trigger (F31)',
  d => ciEdit(d, '  push:\n', '  push: {branches: [x]}\n', false),
  /filters its push trigger/);
expectFail('detects `contents: read` surviving only as a comment (F31)',
  d => ciEdit(d, 'permissions:\n  contents: read\n', 'permissions:\n  # contents: read\n  actions: read\n', false),
  /do not grant read-only contents: actions: read$/m);
// Cycle-8 F46: a job-level permissions block replaces the workflow-level one for that job, and
// only the top-level block was read — so both of these passed.
expectFail('detects a job-level permissions block asking for write (Cycle-8 F46)',
  d => ciEdit(d, '  sync-check:\n    runs-on: ubuntu-latest\n', '  sync-check:\n    permissions:\n      contents: write\n    runs-on: ubuntu-latest\n', false),
  /requests write permission below the workflow level \(Cycle-8 F46\): job-level[^\n]*contents: write/);
expectFail('detects an inline job-level `permissions: write-all` (Cycle-8 F46)',
  d => ciEdit(d, '  sync-check:\n    runs-on: ubuntu-latest\n', '  sync-check:\n    permissions: write-all\n    runs-on: ubuntu-latest\n', false),
  /requests write permission below the workflow level \(Cycle-8 F46\): job-level[^\n]*write-all/);
// 17) CSV header parity (F49): a header that drops a MIDDLE column, and a file
// whose headers were all rewritten away, were both invisible to the old
// prefix-only scan.
expectFail('detects a metrics header missing a middle column (F49)',
  d => { const f = join(d, 'CLAUDE.md'); writeFileSync(f, readFileSync(f, 'utf8').replace('axis_b_lowest,notes,defensive_count', 'axis_b_lowest,defensive_count')); },
  /not matching the canonical column list/);
expectFail('detects a file whose metrics headers all disappeared (F49 count floor)',
  d => { const f = join(d, 'CLAUDE.md'); writeFileSync(f, readFileSync(f, 'utf8').replaceAll('date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes,defensive_count', '(see CLAUDE.md)')); },
  /only 0 metrics/);
// 18) F44 (Cycle 7): the permissions block ends where the block ends. Its
// pattern used to match newlines, so the "block" ran to end of file and a
// step NAMED with "write" anywhere below read as a write-scope request — a
// false red (and, the other way round, a comment's `contents: read` a false
// green — case 16). Nothing in the permissions block changed here.
{
  const d = setup();
  try {
    ciEdit(d, '      - name: Guard regression test (fails closed on injected drift)', '      - name: Guard regression test — write-path drift (fails closed on injected drift)', false);
    const r = runGuard(d);
    if (r.code === 0) ok('a later step mentioning "write" does not read as a write permission (F44)');
    else bad('permissions check read past its block (F44): ' + r.out.split('\n').filter(l => l.includes('✗')).join(' | '));
  } catch (e) { bad('F44 case — ' + e.message); } finally { rmSync(d, { recursive: true, force: true }); }
}
// 19) F11 (Cycle 7): command files stand alone — a consuming project copies
// .claude/commands/ and nothing else.
expectFail('detects a command delegating to another command\'s step (F11)',
  d => { const f = join(d, '.claude', 'commands', 'targeted-implement.md'); writeFileSync(f, readFileSync(f, 'utf8').replace('1. RUN TESTS —', '1. RUN TESTS — See `/broad-implement` Step 1. Then:')); },
  /delegates to another command/);
expectFail('detects a command naming a helper script unconditionally (F11)',
  d => { const f = join(d, '.claude', 'commands', 'regression.md'); writeFileSync(f, readFileSync(f, 'utf8') + '\nRun scripts/invariant-check.mjs first.\n'); },
  /names scripts\/invariant-check\.mjs unconditionally/);
// Cycle-8 F43: the metrics-ownership rule was one literal phrase, looked for in the HTML only.
// The scan's own example — rewrite the sentence in BOTH copies — passed every stage.
expectFail('detects the §6a body telling the synthesis row to fill net_score (Cycle-8 F43; the console copy left with its lock in v1.53.0)',
  d => { for (const n of ['CLAUDE.md']) { const f = join(d, n); const s = readFileSync(f, 'utf8'); const find = 'Leave net_score, prod_fixes, new_failure_modes, and defensive_count BLANK'; if (!s.includes(find)) throw new Error('fixture rotted: ' + n); writeFileSync(f, s.split(find).join('Also fill net_score, prod_fixes, new_failure_modes, and defensive_count')); } },
  /metrics-row ownership \(Cycle-8 F43\) — CLAUDE\.md §6a: /);
// Cycle-8 F44: a write with no step heading around it — a bullet under "Rules:" — was not read.
expectFail('detects an ungated cycle-state write that is not shaped like a step (Cycle-8 F44)',
  d => { const f = join(d, '.claude', 'commands', 'implement.md'); const s = readFileSync(f, 'utf8'); const find = '- Check Common Gotchas before each action'; if (!s.includes(find)) throw new Error('fixture rotted: implement.md'); writeFileSync(f, s.replace(find, '- Save your progress to STATE.md after each action\n' + find)); },
  /writes cycle state outside a gated step \(Cycle-8 F44\): implement\.md/);
// Cycle-8 F45: one spelling of a hardcoded floor was matched, in one section of one file.
expectFail('detects a hardcoded policy floor in other words (Cycle-8 F45)',
  d => { const f = join(d, 'CLAUDE.md'); const s = readFileSync(f, 'utf8'); const find = '(d) ABSOLUTE FLOOR — it is at or below `Policy threshold`, regardless of trend.'; if (!s.includes(find)) throw new Error('fixture rotted: ABSOLUTE FLOOR clause'); writeFileSync(f, s.replace(find, '(d) ABSOLUTE FLOOR — it is at or below 5/10 for two cycles running, regardless of trend.')); },
  /a hardcoded policy floor is written into the prose \(Cycle-8 F45\)/);
// Cycle-8 F8: command files had no frontmatter, so the picker listed each by its first body line.
// gen --check compares a file with the generator's own output; these fail the SEPARATE reading.
{
  const edit = (d, rel, fn) => { const f = join(d, ...rel.split('/')); const s = readFileSync(f, 'utf8'); const t = fn(s); if (t === s) throw new Error('fixture rotted: ' + rel); writeFileSync(f, t); };
  expectFail('detects a command file with no frontmatter description (Cycle-8 F8)',
    d => edit(d, '.claude/commands/audit.md', s => s.replace(/^---\n[\s\S]*?\n---\n+/, '')),
    /command descriptions \(Cycle-8 F8\): [^\n]*audit\.md has no frontmatter description/);
  expectFail('detects a command described differently from its Command Index row (Cycle-8 F8)',
    d => edit(d, '.claude/commands/reflect.md', s => s.replace('description: "Post-cycle honest assessment"', 'description: "Reflect"')),
    /command descriptions \(Cycle-8 F8\): [^\n]*reflect\.md is described as "Reflect" but its Command Index row says/);
  expectFail('detects a README command row that says something else (Cycle-8 F8)',
    d => edit(d, 'README.md', s => s.replace('| Post-cycle honest assessment |', '| Look back at the cycle |')),
    /command descriptions \(Cycle-8 F8\): [^\n]*the README lists \/reflect as "Look back at the cycle"/);
  expectFail('detects a command that reads $ARGUMENTS with no argument hint (Cycle-8 F8)',
    d => edit(d, '.claude/commands/audit.md', s => s.replace('argument-hint: "<subsystem-name>"\n', '')),
    /command descriptions \(Cycle-8 F8\): [^\n]*audit\.md reads \$ARGUMENTS and carries no argument hint/);
  expectFail('detects a command with no Command Index row (Cycle-8 F8)',
    d => edit(d, 'CLAUDE.md', s => s.replace(/^\| `\/regression` \|.*\n/m, '')),
    /command descriptions \(Cycle-8 F8\): [^\n]*regression\.md has no Command Index row/);
  expectFail('detects a frontmatter key nobody decided on (Cycle-8 F8)',
    d => edit(d, '.claude/commands/reflect.md', s => s.replace('description: "Post-cycle honest assessment"\n', 'description: "Post-cycle honest assessment"\nallowed-tools: Bash\n')),
    /command descriptions \(Cycle-8 F8\): [^\n]*reflect\.md frontmatter carries a line this check does not know/);
  // A description is a label, not an instruction: the prose scans read the body. The family-parity
  // check must still see a marker missing from the BODY when the description happens to say it.
  expectFail('does not let a description satisfy a body check (Cycle-8 F8)',
    d => edit(d, '.claude/commands/implement.md', s => s.replace(/^description: ".*"$/m, 'description: "Execute the plan, updating test doubles"').replace(/test doubles/g, (m, off) => (off < 120 ? m : 'test stand-ins'))),
    /implement family: shared behavior "test doubles" missing from implement/);
}
// Cycle-8 follow-on to F8: a description is a label the prose scans skip, so the one rule of
// theirs that fits a label is held by check 20 — it names no scripts/ helper.
expectFail('detects a command description that names a scripts/ helper (Cycle-8 F8 follow-on)',
  d => { const f = join(d, 'CLAUDE.md'); const s = readFileSync(f, 'utf8'); const find = '| `/regression` | Post-implementation regression check | — |'; if (!s.includes(find)) throw new Error('fixture rotted: /regression row'); writeFileSync(f, s.replace(find, '| `/regression` | Post-implementation regression check (runs scripts/regress.mjs) | — |')); },
  /command descriptions \(Cycle-8 F8\): [^\n]*the Command Index describes \/regression with a scripts\/ path \(scripts\/regress\.mjs\)/);
// Cycle-8 follow-on to F9: the roadmap said "queued for Cycle 7" through Cycle 8 and named two
// finished items as its bet. Read against the LIVE ROADMAP.md and STATE.md, so a stale roadmap
// in this repo fails here as well as in the guard's own stage.
{
  const withRoadmap = fn => {
    const d = setup();
    try {
      mkdirSync(join(d, '.cycle'), { recursive: true });
      copyFileSync(join(repo, '.cycle', 'STATE.md'), join(d, '.cycle', 'STATE.md'));
      const live = readFileSync(join(repo, 'ROADMAP.md'), 'utf8');
      const text = fn ? fn(live) : live;
      if (fn && text === live) throw new Error('fixture rotted: ROADMAP.md');
      if (text != null) writeFileSync(join(d, 'ROADMAP.md'), text);
      return runGuard(d);
    } finally { rmSync(d, { recursive: true, force: true }); }
  };
  const line = r => (r.out.split('\n').find(l => /roadmap currency|the roadmap does not contradict/.test(l)) || '(no roadmap line)').trim();
  const cycle = Number((readFileSync(join(repo, '.cycle', 'STATE.md'), 'utf8').match(/^Cycle:\s*(\d+)/m) || [])[1]);
  const openItem = /^(- \*\*R24 — [^\n]*)$/m, bet = /^\*\*Current bet:\*\*[^\n]*$/m;
  const problems = [];
  try {
    const live = withRoadmap(null);
    if (live.code !== 0 || !/✓ the roadmap does not contradict the cycle/.test(live.out)) problems.push(`the live ROADMAP.md fails — ${line(live)}`);
    const stale = withRoadmap(t => t.replace(openItem, `$1 (queued for Cycle ${cycle - 1})`));
    if (stale.code === 0 || !new RegExp(`R24 is still "queued for Cycle ${cycle - 1}" and the project is on Cycle ${cycle}`).test(stale.out)) problems.push(`an open item queued for a cycle that has run is not flagged — ${line(stale)}`);
    const current = withRoadmap(t => t.replace(openItem, `$1 (queued for Cycle ${cycle})`));
    if (current.code !== 0) problems.push(`an item queued for the CURRENT cycle is rejected — ${line(current)}`);
    const history = withRoadmap(t => t.replace(openItem, `$1 (it was queued for Cycle ${cycle - 1} and slipped)`));
    if (history.code !== 0) problems.push(`a past-tense "was queued for" is read as a live status — ${line(history)}`);
    const spent = withRoadmap(t => t.replace(bet, '**Current bet:** R1, then R6.'));
    if (spent.code === 0 || !/the strategic bet names R1, which is marked done or dropped/.test(spent.out)) problems.push(`a bet naming a finished item is not flagged — ${line(spent)}`);
    const open = withRoadmap(t => t.replace(bet, '**Current bet:** R24 (persist the scan report).'));
    if (open.code !== 0) problems.push(`a bet naming an open item is rejected — ${line(open)}`);
    const unstated = withRoadmap(t => t.replace(bet, 'The bet is discussed below.'));
    if (unstated.code === 0 || !/has no "\*\*Current bet:\*\*" line/.test(unstated.out)) problems.push(`a roadmap that states no bet is not flagged — ${line(unstated)}`);
    const unknown = withRoadmap(t => t.replace(bet, '**Current bet:** R999.'));
    if (unknown.code === 0 || !/the strategic bet names R999, which is not an item in the roadmap/.test(unknown.out)) problems.push(`a bet naming an unknown item is not flagged — ${line(unknown)}`);
  } catch (e) { problems.push(e.message); }
  if (!problems.length) ok('the roadmap is read against the cycle: stale "queued for" on an open item, and a bet that names finished work (Cycle-8 F9 follow-on)');
  else bad('Cycle-8 F9 follow-on: ' + problems.join('; '));
}
// 20) Cycle-7 follow-on to F05: the re-pull list classifies every release
// since v1.19.0. v1.33.0 sat in neither list for nine releases.
expectFail('detects a release missing from the Operator State Checklist re-pull list (F05 class)',
  d => { mkdirSync(join(d, '.cycle'), { recursive: true }); const t = readFileSync(join(repo, '.cycle', 'config.md'), 'utf8'); if (!t.includes('v1.33.0 changed')) throw new Error('fixture rotted: v1.33.0 changed'); writeFileSync(join(d, '.cycle', 'config.md'), t.replace('v1.33.0 changed', 'v1.33.0 altered')); },
  /in neither list: v1\.33\.0/);
// …and a block-scalar run: with the bare command is still a stage, not a problem.
{
  const d = setup();
  try {
    ciEdit(d, 'run: node tests/guard.test.mjs', 'run: |\n          node tests/guard.test.mjs');
    const r = runGuard(d);
    if (r.code === 0) ok('a block-scalar run: holding the bare command still counts as the stage (F31)');
    else bad('block-scalar bare stage rejected: ' + r.out.split('\n').filter(l => l.includes('✗')).join(' | '));
  } catch (e) { bad('block-scalar case — ' + e.message); } finally { rmSync(d, { recursive: true, force: true }); }
}

// Cycle-8 F7: the FIRST release of a cycle needs a block too (INV-72). The
// floor used to come from the current cycle's own blocks, so a cycle with no
// block yet was skipped and a block-less first release could never be flagged.
// This needs several files to disagree at once (STATE's cycle, the blocks
// directory, the CHANGELOG), which is why it lives here and not in a
// single-file mutation. Versions are taken from the real CHANGELOG, so the case
// follows the repo instead of pinning a release number.
{
  const versions = [...readFileSync(join(repo, 'CHANGELOG.md'), 'utf8').matchAll(/^##\s+(\d+\.\d+\.\d+)\b/gm)].map(m => m[1]);   // newest first
  const [newest, prev, prev2] = versions;
  const state = readFileSync(join(repo, '.cycle', 'STATE.md'), 'utf8').replace(/^Cycle:\s*\d+.*$/m, 'Cycle: 99');
  const withBlocks = names => {
    const d = setup();
    mkdirSync(join(d, '.cycle', 'blocks'), { recursive: true });
    writeFileSync(join(d, '.cycle', 'STATE.md'), state);
    for (const n of names) writeFileSync(join(d, '.cycle', 'blocks', n), 'x\n');
    try { return runGuard(d); } finally { rmSync(d, { recursive: true, force: true }); }
  };
  const line = r => (r.out.split('\n').find(l => /INV-72|release-block coverage/.test(l)) || '(no INV-72 line)').trim();
  const problems = [];
  if (!newest || !prev || !prev2 || !/^Cycle: 99$/m.test(state)) problems.push('fixture could not be derived from CHANGELOG.md / .cycle/STATE.md');
  else {
    const first = withBlocks([`98-${prev}-broad-implement.md`]);
    if (first.code === 0 || !new RegExp('release with no block \\(INV-72\\): cycle 99 shipped ' + newest.replace(/\./g, '\\.')).test(first.out)) problems.push(`the first release of a cycle with no block is not flagged — ${line(first)}`);
    const gap = withBlocks([`98-${prev2}-broad-implement.md`, `99-${newest}-broad-implement.md`]);
    if (gap.code === 0 || !new RegExp('cycle 99 shipped ' + prev.replace(/\./g, '\\.') + ' with nothing').test(gap.out)) problems.push(`an unblocked first release hides once a LATER release of the cycle has a block — ${line(gap)}`);
    const covered = withBlocks([`98-${prev}-broad-implement.md`, `99-${newest}-broad-implement.md`]);
    if (covered.code !== 0 || !/✓ every cycle-99 release from /.test(covered.out)) problems.push(`a fully blocked cycle is rejected — ${line(covered)}`);
    const none = withBlocks([`98-${newest}-broad-implement.md`]);
    if (none.code !== 0 || !/cycle 99 has shipped no release yet/.test(none.out)) problems.push(`a cycle that has shipped nothing is not accepted — ${line(none)}`);
    const empty = withBlocks([]);
    if (empty.code !== 0 || !/release-block coverage skipped/.test(empty.out)) problems.push(`a project with no versioned blocks at all is not skipped — ${line(empty)}`);
  }
  if (!problems.length) ok('the first release of a cycle needs a block: the floor is the first release after the previous cycle\'s last block (Cycle-8 F7)');
  else bad('Cycle-8 F7: ' + problems.join('; '));
}

console.log('Guard regression test (scripts/check-template-sync.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} guard test case(s) failed.`); process.exit(1); }
console.log('\nGuard fails closed on injected drift. ✓');
