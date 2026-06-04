#!/usr/bin/env node
// invariant-check.test.mjs — regression test for the invariant runner (R9).
// Runs scripts/invariant-check.mjs against a fixture library and asserts it
// runs command Verify fields (incl. annotated ones), fails on a failing
// command, classifies prose Verify as MANUAL, and dedupes identical commands.

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/invariant-check.mjs', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'cwt-inv-'));
const src = join(dir, 'config.md');
writeFileSync(src, [
  'INV-01 | always passes | Subsystem: X | Verify: node -e "process.exit(0)"',
  'INV-02 | always fails | Subsystem: X | Verify: node -e "process.exit(1)"',
  'INV-03 | manual prose | Subsystem: X | Verify: code read of the thing',
  'INV-04 | annotated pass | Subsystem: X | Verify: node -e "process.exit(0)" (smoke note)',
  ''].join('\n'));

function run(extra) {
  try { return { code: 0, out: execFileSync('node', [script, '--source', src, ...extra], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; }
  catch (e) { return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }; }
}

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

const r = run([]);
if (r.code === 1) ok('exits non-zero when a runnable invariant fails'); else bad(`expected exit 1, got ${r.code}`);
if (/INV-01 PASS/.test(r.out)) ok('runs a passing command Verify (INV-01 PASS)'); else bad('INV-01 not PASS');
if (/INV-02 FAIL/.test(r.out)) ok('marks a failing command FAIL (INV-02)'); else bad('INV-02 not FAIL');
if (/INV-04 PASS/.test(r.out)) ok('strips a trailing "(annotation)" before running (INV-04 PASS)'); else bad('INV-04 not PASS');
if (/INV-03 MANUAL/.test(r.out)) ok('classifies prose Verify as MANUAL (INV-03)'); else bad('INV-03 not MANUAL');
if (/Passed 2 \| Failed 1 \| Manual 1/.test(r.out)) ok('summary counts correct (2/1/1, identical commands deduped)'); else bad('summary counts wrong');

const l = run(['--list']);
if (l.code === 0 && /\[run\]/.test(l.out) && /\[manual\]/.test(l.out)) ok('--list enumerates runnable + manual and exits 0'); else bad('--list output wrong');

rmSync(dir, { recursive: true, force: true });

console.log('invariant runner regression test (scripts/invariant-check.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} invariant-runner test(s) failed.`); process.exit(1); }
console.log('\nInvariant runner is sound. ✓');
