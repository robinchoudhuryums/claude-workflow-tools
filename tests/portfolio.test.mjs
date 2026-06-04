#!/usr/bin/env node
// portfolio.test.mjs — regression test for scripts/portfolio.mjs (R8).
// Builds fixture PROJECT_HEALTH.md files in named dirs and asserts the
// board lists each project, ranks the lowest overall first, computes the
// average, and flags an unscored project.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/portfolio.mjs', import.meta.url));
const root = mkdtempSync(join(tmpdir(), 'cwt-pf-'));

function project(name, standing) {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  const p = join(dir, 'PROJECT_HEALTH.md');
  writeFileSync(p, `# Project Health\n\n## Current Standing\n${standing}\n\n## Score History\n`);
  return p;
}
const high = project('alpha', 'Last synthesis: 2026-06-01\nOverall (weighted avg): 8.5/10\nOne-line summary: solid\nTop vertical priority: Security\nTop horizontal priority: Drift');
const low = project('beta', 'Last synthesis: 2026-06-02\nOverall (weighted avg): 5.0/10\nOne-line summary: shaky\nTop vertical priority: Storage\nTop horizontal priority: Silent Degradation');
const none = project('gamma', 'Last synthesis: n/a\nOne-line summary: not yet scored\nTop vertical priority: —\nTop horizontal priority: —');

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

let out = '';
try { out = execFileSync('node', [script, high, low, none], { encoding: 'utf8' }); }
catch (e) { bad('renderer threw: ' + (e.message || e)); }

for (const n of ['alpha', 'beta', 'gamma']) { if (out.includes(`| ${n} |`)) ok(`lists project ${n}`); else bad(`missing project ${n}`); }
// beta (5.0) should rank before alpha (8.5) in the table body.
if (out.indexOf('| beta |') < out.indexOf('| alpha |')) ok('ranks lowest overall first'); else bad('ranking wrong');
if (/Audit next: beta/.test(out)) ok('flags the lowest-scoring project to audit next'); else bad('did not flag beta');
// Average of scored projects = (8.5 + 5.0) / 2 = 6.8 (gamma unscored, excluded).
if (/average overall: \*\*6\.8\/10\*\* across 2 scored/.test(out)) ok('averages only scored projects (6.8 across 2)'); else bad('average wrong');
if (/No synthesis score yet: gamma/.test(out)) ok('flags the unscored project'); else bad('did not flag unscored gamma');

rmSync(root, { recursive: true, force: true });

console.log('portfolio dashboard regression test (scripts/portfolio.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} portfolio test(s) failed.`); process.exit(1); }
console.log('\nPortfolio dashboard is sound. ✓');
