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
const run = csv => { try { return execFileSync('node', [script, csv], { encoding: 'utf8' }); } catch (e) { return '__THREW__:' + (e.message || e); } };

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

// New schema: defensive_count appended as the last column (after quoted notes).
const csv = join(dir, 'metrics.csv');
writeFileSync(csv,
  'date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes,defensive_count\n' +
  '2026-01-01,1,Core,reflect,3,3,0,,,"fix, with comma",4\n' +
  '2026-01-02,1,Core,synthesis,3,3,0,40%,Test Coverage (5),"scored",\n' +
  '2026-01-03,2,Core,reflect,-1,1,2,,,"a regression",7\n');
const out = run(csv);

if (/\| date \| cycle \| phase \|/.test(out)) ok('renders the per-row table'); else bad('table header missing');
if (/net score\s+[▁-█]/.test(out)) ok('renders a net-score sparkline'); else bad('sparkline missing');
// Cumulative net = 3 + 3 + (-1) = 5; prod = 3+3+1 = 7; nfm = 0+0+2 = 2
if (/Cumulative net score: \*\*5\*\*/.test(out)) ok('cumulative net score correct (5)'); else bad('cumulative net score wrong');
if (/7 production fixes − 2 new failure modes/.test(out)) ok('fix/failure totals correct'); else bad('fix/failure totals wrong');
if (/Latest synthesis \(cycle 1\): Category D 40%/.test(out)) ok('surfaces the latest synthesis'); else bad('latest synthesis line missing/wrong');
if (/fix, with comma/.test(out)) ok('quoted CSV fields with commas parse correctly'); else bad('quoted-field parsing broke');
// P11: defensive_count column + secondary cumulative (4 + 0 + 7 = 11) when the column is present.
if (/\bdef\b/.test(out)) ok('shows the def column when defensive_count is present'); else bad('def column missing');
if (/Defensive\/structural items \(secondary[^)]*\): \*\*11\*\*/.test(out)) ok('cumulative defensive total correct (11), flagged secondary'); else bad('defensive cumulative wrong/missing');

// Backward-compat: an OLD file without defensive_count must still render, no def column, no crash.
const oldCsv = join(dir, 'old.csv');
writeFileSync(oldCsv,
  'date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes\n' +
  '2026-01-01,1,Core,reflect,2,2,0,,,"old row"\n');
const oldOut = run(oldCsv);
if (!oldOut.startsWith('__THREW__') && /Cumulative net score: \*\*2\*\*/.test(oldOut)) ok('old (pre-defensive_count) file still renders'); else bad('backward-compat render failed');
if (!/\bdef\b/.test(oldOut) && !/Defensive\/structural items/.test(oldOut)) ok('no def column/summary for an old file (graceful)'); else bad('def shown for an old file');

// F12: a P1-compliant file — the synthesis row's net_score is BLANK by rule
// (owned only by phase=reflect). The summary line used to render "net ," for
// every real project. It must now report the columns a synthesis row owns and
// source that cycle's net from its reflect rows.
const p1csv = join(dir, 'p1.csv');
writeFileSync(p1csv,
  'date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes,defensive_count\n' +
  '2026-02-01,7,Core,reflect,2,2,0,,,"a",1\n' +
  '2026-02-02,7,Core,reflect,3,3,0,,,"b",0\n' +
  '2026-02-03,7,all,synthesis,,,,0%,Silent Degradation (6),"scored",\n');
const p1out = run(p1csv);
if (!/net\s*,/.test(p1out)) ok('no blank "net ," in the synthesis summary line (F12)');
else bad('F12: synthesis line still renders a blank net field');
if (/Latest synthesis \(cycle 7\).*that cycle's net 5 \(summed from its reflect rows\)/.test(p1out))
  ok("synthesis line sources that cycle's net from its reflect rows (F12)");
else bad('F12: synthesis line did not sum the cycle net from reflect rows');

rmSync(dir, { recursive: true, force: true });

console.log('render-metrics regression test:\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} render-metrics test(s) failed.`); process.exit(1); }
console.log('\nMetrics renderer is sound. ✓');
