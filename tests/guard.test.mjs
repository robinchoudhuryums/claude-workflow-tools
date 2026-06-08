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
  for (const s of ['gen-commands.mjs', 'check-template-sync.mjs']) copyFileSync(join(repo, 'scripts', s), join(dir, 'scripts', s));
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

console.log('Guard regression test (scripts/check-template-sync.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} guard test case(s) failed.`); process.exit(1); }
console.log('\nGuard fails closed on injected drift. ✓');
