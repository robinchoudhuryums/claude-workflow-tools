#!/usr/bin/env node
// cycle-context.test.mjs — regression test for the SessionStart hook (R6).
// Asserts it surfaces the right substrate when .cycle/ exists and stays
// silent (and exits 0) when it does not.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/cycle-context.mjs', import.meta.url));
const run = cwd => { try { return execFileSync('node', [script], { cwd, encoding: 'utf8' }); } catch (e) { return '__THREW__:' + e.message; } };

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

// Case A: a project with .cycle/STATE.md gets a context block.
const a = mkdtempSync(join(tmpdir(), 'cwt-ctx-a-'));
mkdirSync(join(a, '.cycle'));
writeFileSync(join(a, '.cycle', 'STATE.md'), '# Cycle State\n\n## Current\nCycle: 7\nPhase: implement\n\n## Where I left off\nMid-wave on subsystem X.\n');
writeFileSync(join(a, '.cycle', 'config.md'), 'INV-01 | a | Subsystem: X\nINV-02 | b | Subsystem: Y\n');
const outA = run(a);
if (/WORKFLOW CONTEXT/.test(outA)) ok('emits a context block when .cycle/ exists'); else bad('no context block emitted');
if (/Cycle: 7/.test(outA) && /Mid-wave on subsystem X/.test(outA)) ok('includes STATE.md Current + Where I left off'); else bad('STATE sections missing');
if (/2 invariants/.test(outA)) ok('reports the invariant count from .cycle/config.md'); else bad('invariant count missing');
rmSync(a, { recursive: true, force: true });

// Case B: a project WITHOUT .cycle/ stays silent and exits 0.
const b = mkdtempSync(join(tmpdir(), 'cwt-ctx-b-'));
const outB = run(b);
if (outB === '') ok('stays silent (and exits 0) when .cycle/ is absent'); else bad('expected empty output without .cycle/, got: ' + JSON.stringify(outB.slice(0, 60)));
rmSync(b, { recursive: true, force: true });

console.log('SessionStart hook regression test (scripts/cycle-context.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} cycle-context test(s) failed.`); process.exit(1); }
console.log('\nSessionStart context hook is sound. ✓');
