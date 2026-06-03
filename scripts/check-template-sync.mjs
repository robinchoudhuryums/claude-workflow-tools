#!/usr/bin/env node
// check-template-sync.mjs
//
// Guards against drift between the two artifacts in this repo:
//   - CLAUDE.md                  (canonical command semantics / templates)
//   - claude-code-guide-v2.html  (the interactive prompt console)
//   - README.md                  (operator-facing documentation)
//
// They are intentionally NOT byte-identical: the HTML inlines per-project
// config while CLAUDE.md commands read it. So instead of diffing text, this
// script checks FEATURE-MARKER PARITY — every capability that should exist
// across artifacts must leave a marker in each. When a feature is added to
// one file, this fails until the others catch up.
//
// Usage:  node scripts/check-template-sync.mjs
// Exit 0 = in sync, exit 1 = drift detected.

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const FILES = ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'];

const contents = {};
for (const f of FILES) {
  try {
    contents[f] = readFileSync(new URL(f, root), 'utf8').toLowerCase();
  } catch (e) {
    console.error(`ERROR: could not read ${f}: ${e.message}`);
    process.exit(1);
  }
}

// Each capability must appear (case-insensitive substring) in every listed file.
const CHECKS = [
  { feature: 'Manual test mode',          marker: 'no programmatic test runner', files: ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'] },
  { feature: 'Regression Scenarios',      marker: 'regression scenario',         files: ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'] },
  { feature: 'Frozen Subsystems',         marker: 'frozen subsystem',            files: ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'] },
  { feature: 'Deploy Command (config)',   marker: 'deploy command',              files: ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'] },
  { feature: 'Deploy Step (output)',      marker: 'deploy step',                 files: ['CLAUDE.md', 'claude-code-guide-v2.html'] },
  { feature: 'Configurable Axis B',       marker: 'horizontal (axis b) categories', files: ['CLAUDE.md', 'claude-code-guide-v2.html'] },
  { feature: 'Dynamic Workflows playbook', marker: 'dynamic workflows',          files: ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'] },
  { feature: 'Cycle state directory',     marker: '.cycle/',                     files: ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'] },
  { feature: '/cycle-resume command',     marker: 'cycle-resume',                files: ['CLAUDE.md', 'README.md'] },
  { feature: '/cycle-status command',     marker: 'cycle-status',                files: ['CLAUDE.md', 'README.md'] },
  { feature: 'Executable invariants',     marker: 'test name or code ref',       files: ['CLAUDE.md', 'claude-code-guide-v2.html'] },
  { feature: 'Per-cycle metrics',         marker: 'metrics.csv',                 files: ['CLAUDE.md', 'README.md'] },
];

let failures = 0;
const lines = [];
for (const c of CHECKS) {
  const missing = c.files.filter(f => !contents[f].includes(c.marker));
  if (missing.length) {
    failures++;
    lines.push(`  ✗ ${c.feature}  —  marker "${c.marker}" missing from: ${missing.join(', ')}`);
  } else {
    lines.push(`  ✓ ${c.feature}`);
  }
}

console.log('Template sync check (CLAUDE.md ↔ HTML ↔ README):\n');
console.log(lines.join('\n'));

// ── Structural check 1: every command in the README slash-command table
// has a fenced template in CLAUDE.md (so /sync-commands can manage it). ──
const claudeRaw = readFileSync(new URL('CLAUDE.md', root), 'utf8');
const readmeRaw = readFileSync(new URL('README.md', root), 'utf8');
const tableCmds = [...new Set([...readmeRaw.matchAll(/`\/([a-z0-9-]+)`/g)].map(m => m[1]))];
const cmdMissing = tableCmds.filter(n => !new RegExp('### /' + n + '\\n+```').test(claudeRaw));
if (cmdMissing.length) {
  failures++;
  console.log(`  ✗ README commands without a CLAUDE.md template: ${cmdMissing.join(', ')}`);
} else {
  console.log(`  ✓ All README-referenced commands have a CLAUDE.md template (${tableCmds.length})`);
}

// ── Structural check 2: .claude/commands/ is in sync with CLAUDE.md. ──
try {
  execSync('node ' + fileURLToPath(new URL('gen-commands.mjs', import.meta.url)) + ' --check', { stdio: 'pipe' });
  console.log('  ✓ .claude/commands/ is current with CLAUDE.md');
} catch (e) {
  failures++;
  const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  console.log('  ✗ .claude/commands/ is stale — run: node scripts/gen-commands.mjs');
  if (out.trim()) console.log('    ' + out.trim().replace(/\n/g, '\n    '));
}

if (failures) {
  console.error(`\n${failures} issue(s) detected. Add the missing capability/template to the listed file(s),`);
  console.error('regenerate command files, or update CHECKS in scripts/check-template-sync.mjs if a marker was intentionally renamed.');
  process.exit(1);
}
console.log('\nAll tracked features present and command files in sync. ✓');
