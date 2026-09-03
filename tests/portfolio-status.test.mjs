#!/usr/bin/env node
// portfolio-status.test.mjs — regression test for scripts/portfolio-status.mjs (R15).
// Builds fixture projects (PROJECT_HEALTH.md + .cycle/STATE.md + metrics.csv)
// and asserts the status board joins health with development status: phase,
// in-progress, net-score trend, seams-DUE, ranking, and graceful "—" for a
// project that has no .cycle/ directory.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/portfolio-status.mjs', import.meta.url));
const root = mkdtempSync(join(tmpdir(), 'cwt-pfs-'));

function project(name, standing, { state, metrics, config } = {}) {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'PROJECT_HEALTH.md'), `# Project Health\n\n## Current Standing\n${standing}\n\n## Score History\n`);
  if (state || metrics || config) mkdirSync(join(dir, '.cycle'), { recursive: true });
  if (state) writeFileSync(join(dir, '.cycle', 'STATE.md'), state);
  if (metrics) writeFileSync(join(dir, '.cycle', 'metrics.csv'), metrics);
  if (config) writeFileSync(join(dir, '.cycle', 'config.md'), config);
  return join(dir, 'PROJECT_HEALTH.md');
}

const H = 'date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes,defensive_count';

// alpha: healthy, idle, seams 1/3 (cadence 3 via config), net trend ↑ (1 → 2).
const alpha = project('alpha',
  'Last synthesis: 2026-06-02\nOverall (weighted avg): 8.5/10\nOne-line summary: solid',
  {
    state: '# Cycle State\n## Current\nCycle: 2\nPhase: idle (synthesized)\nSubsystem cycles since last Seams audit: 1\nUpdated: 2026-06-02\n',
    // F03: a quoted comma-bearing subsystem must still be read (it used to be skipped).
    metrics: `${H}\n2026-06-01,1,"Auth, Security & HIPAA",reflect,1,1,0,,,"note",0\n2026-06-02,2,"Auth, Security & HIPAA",reflect,2,2,0,,,"note",0\n`,
    config: '### Seams Audit Cadence\nevery 3 subsystem cycles\n',
  });

// beta: shaky, mid-implement, seams 4/4 DUE (default cadence 4), trend ↓ (2 → 0),
// and a comma inside a quoted note to prove the naive split stays column-safe.
const beta = project('beta',
  'Last synthesis: 2026-06-02\nOverall (weighted avg): 5.0/10\nOne-line summary: shaky',
  {
    state: '# Cycle State\n## Current\nCycle: 3\nPhase: implement (3 actions pending)\nSubsystem cycles since last Seams audit: 4\nUpdated: 2026-06-15\n',
    metrics: `${H}\n2026-06-01,1,X,reflect,2,2,0,,,"fix a, b",0\n2026-06-02,2,X,reflect,0,0,0,,,"note",0\n`,
  });

// gamma: scored but NO .cycle/ — status columns must degrade to "—".
const gamma = project('gamma', 'Last synthesis: 2026-06-03\nOverall (weighted avg): 7.0/10\nOne-line summary: no cycle dir');

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };
const row = (out, name) => (out.split('\n').find(l => l.startsWith(`| ${name} |`)) || '');

let out = '';
try { out = execFileSync('node', [script, alpha, beta, gamma], { encoding: 'utf8' }); }
catch (e) { bad('renderer threw: ' + (e.message || e)); }

for (const n of ['alpha', 'beta', 'gamma']) { if (row(out, n)) ok(`lists project ${n}`); else bad(`missing project ${n}`); }
if (out.indexOf('| beta |') !== -1 && out.indexOf('| beta |') < out.indexOf('| alpha |')) ok('ranks lowest overall first'); else bad('ranking wrong');
if (/Audit next: beta/.test(out)) ok('flags lowest-overall to audit next (beta)'); else bad('did not flag beta to audit');

// beta development status
const betaRow = row(out, 'beta');
if (/\bimplement\b/.test(betaRow)) ok('beta phase = implement'); else bad('beta phase missing');
if (/\|\s*yes\s*\|/.test(betaRow)) ok('beta in-progress = yes'); else bad('beta in-progress wrong');
if (/4\/4 DUE/.test(betaRow)) ok('beta seams = 4/4 DUE (default cadence 4)'); else bad('beta seams-DUE wrong');
if (betaRow.includes('↓')) ok('beta net trend = ↓ (2 → 0, comma-in-notes safe)'); else bad('beta trend wrong');
if (/In progress \(resume\): beta \(implement\)/.test(out)) ok('Read: flags beta to /cycle-resume'); else bad('did not flag beta in-progress in Read');
if (/Seams audit DUE: beta/.test(out)) ok('Read: flags beta seams DUE'); else bad('did not flag beta seams DUE');

// alpha: idle, not due, trend ↑
const alphaRow = row(out, 'alpha');
if (/\|\s*idle\s*\|\s*no\s*\|/.test(alphaRow)) ok('alpha idle → in-progress no'); else bad('alpha idle/in-progress wrong');
if (/1\/3/.test(alphaRow) && !/DUE/.test(alphaRow)) ok('alpha seams = 1/3 (cadence 3 from config, not due)'); else bad('alpha seams/cadence wrong');
if (alphaRow.includes('↑')) ok('alpha net trend = ↑ (1 → 2, comma-bearing subsystem rows read — F03)'); else bad('alpha trend wrong (comma-bearing subsystem rows skipped?)');

// gamma: no .cycle/ → status columns are "—"
const gammaRow = row(out, 'gamma');
if (/\|\s*—\s*\|\s*—\s*\|\s*—\s*\|\s*—\s*\|/.test(gammaRow)) ok('gamma (no .cycle/) → status columns degrade to —'); else bad('gamma degradation wrong');

if (/average overall: \*\*6\.8\/10\*\* across 3 scored/.test(out)) ok('averages all 3 scored projects (6.8)'); else bad('average wrong');

rmSync(root, { recursive: true, force: true });

console.log('portfolio status board regression test (scripts/portfolio-status.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} portfolio-status test(s) failed.`); process.exit(1); }
console.log('\nPortfolio status board is sound. ✓');
