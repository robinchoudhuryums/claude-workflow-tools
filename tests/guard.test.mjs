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
  for (const s of ['gen-commands.mjs', 'check-template-sync.mjs', 'check-output-blocks.mjs']) copyFileSync(join(repo, 'scripts', s), join(dir, 'scripts', s));
  cpSync(join(repo, '.claude'), join(dir, '.claude'), { recursive: true });
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
  d => { const f = join(d, 'claude-code-guide-v2.html'); writeFileSync(f, readFileSync(f, 'utf8').replace(',axis_b_lowest,notes,defensive_count', ',axis_b_lowest,notes')); },
  /defensive_count/i);

// 8) Metrics-row ownership (P1): re-introducing "phase=synthesis with the
// overall net_score" (the double-count footgun) is caught.
expectFail('detects the §6a synthesis double-count footgun (net_score on a synthesis row)',
  d => { const f = join(d, 'claude-code-guide-v2.html'); writeFileSync(f, readFileSync(f, 'utf8').replace('Fill phase=synthesis with the Category D ratio', 'Fill phase=synthesis with the overall net_score')); },
  /double-count|net_score/i);

// 9) Dynamic-builder parity (R16): a dropped contract marker in a dynamic
// console builder (here §6a's "TWO-AXIS GRID") is caught.
expectFail('detects dynamic console builder drift (a dropped contract marker)',
  d => { const f = join(d, 'claude-code-guide-v2.html'); writeFileSync(f, readFileSync(f, 'utf8').replace(/TWO-AXIS GRID/i, 'TWO-PLANE GRID')); },
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
expectFail('detects a previously-unguarded block dropped from the console (F17)',
  d => { const f = join(d, 'claude-code-guide-v2.html'); writeFileSync(f, readFileSync(f, 'utf8').replaceAll('PR REVIEW BLOCK', 'PR-REVIEW-GONE')); },
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

console.log('Guard regression test (scripts/check-template-sync.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} guard test case(s) failed.`); process.exit(1); }
console.log('\nGuard fails closed on injected drift. ✓');
