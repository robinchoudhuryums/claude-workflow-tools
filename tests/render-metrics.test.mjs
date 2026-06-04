#!/usr/bin/env node
// render-metrics.test.mjs — regression test for scripts/render-metrics.mjs (R2).
// Runs the renderer against a fixture metrics file and asserts the report
// contains the table, a sparkline, and a correct cumulative summary.

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/render-metrics.mjs', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'cwt-metrics-'));
const csv = join(dir, 'metrics.csv');
writeFileSync(csv,
  'date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes\n' +
  '2026-01-01,1,Core,reflect,3,3,0,,,"fix, with comma"\n' +
  '2026-01-02,1,Core,synthesis,3,3,0,40%,Test Coverage (5),"scored"\n' +
  '2026-01-03,2,Core,reflect,-1,1,2,,,"a regression"\n');

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

let out = '';
try { out = execFileSync('node', [script, csv], { encoding: 'utf8' }); }
catch (e) { bad('renderer threw: ' + (e.message || e)); }

if (/\| date \| cycle \| phase \|/.test(out)) ok('renders the per-row table'); else bad('table header missing');
if (/net score\s+[▁-█]/.test(out)) ok('renders a net-score sparkline'); else bad('sparkline missing');
// Cumulative net = 3 + 3 + (-1) = 5; prod = 3+3+1 = 7; nfm = 0+0+2 = 2
if (/Cumulative net score: \*\*5\*\*/.test(out)) ok('cumulative net score correct (5)'); else bad('cumulative net score wrong');
if (/7 production fixes − 2 new failure modes/.test(out)) ok('fix/failure totals correct'); else bad('fix/failure totals wrong');
if (/Latest synthesis: net 3, Category D 40%/.test(out)) ok('surfaces the latest synthesis'); else bad('latest synthesis line missing/wrong');
if (/fix, with comma/.test(out)) ok('quoted CSV fields with commas parse correctly'); else bad('quoted-field parsing broke');

rmSync(dir, { recursive: true, force: true });

console.log('render-metrics regression test:\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} render-metrics test(s) failed.`); process.exit(1); }
console.log('\nMetrics renderer is sound. ✓');
