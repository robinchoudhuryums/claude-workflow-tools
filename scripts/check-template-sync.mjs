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
import { BLOCKS } from './check-output-blocks.mjs';   // single source of truth for the block registry (F17)

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
  { feature: 'Operator actions / deploy (output)', marker: 'operator actions / deploy', files: ['CLAUDE.md', 'claude-code-guide-v2.html'] },
  { feature: 'Configurable Axis B',       marker: 'horizontal (axis b) categories', files: ['CLAUDE.md', 'claude-code-guide-v2.html'] },
  { feature: 'Dynamic Workflows playbook', marker: 'dynamic workflows',          files: ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'] },
  { feature: 'Cycle state directory',     marker: '.cycle/',                     files: ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'] },
  { feature: '/cycle-resume command',     marker: 'cycle-resume',                files: ['CLAUDE.md', 'README.md'] },
  { feature: '/cycle-status command',     marker: 'cycle-status',                files: ['CLAUDE.md', 'README.md'] },
  { feature: 'Executable invariants',     marker: 'test name or code ref',       files: ['CLAUDE.md', 'claude-code-guide-v2.html'] },
  { feature: 'Per-cycle metrics',         marker: 'metrics.csv',                 files: ['CLAUDE.md', 'README.md'] },
  // HTML prompt-behavior parity (F02/F03): pin specific behaviors that
  // diverged between the HTML §-prompts and the canonical CLAUDE.md commands.
  { feature: 'Reflect emits Cycle Summary Block', marker: '---cycle summary block---', files: ['CLAUDE.md', 'claude-code-guide-v2.html'] },
  { feature: 'Regression runs invariant Verify test', marker: 'run its verify test', files: ['CLAUDE.md', 'claude-code-guide-v2.html'] },
  { feature: 'Regression notes deploy-verified risks', marker: 'git-verified vs', files: ['CLAUDE.md', 'claude-code-guide-v2.html'] },
  { feature: '/cycle-init command',        marker: 'cycle-init',                  files: ['CLAUDE.md', 'README.md'] },
  { feature: 'Command versioning / changelog', marker: 'changelog',               files: ['CLAUDE.md', 'README.md'] },
  { feature: 'Estimate calibration log',   marker: 'estimates.csv',               files: ['CLAUDE.md', 'README.md'] },
  { feature: 'SessionStart context hook',  marker: 'sessionstart',                files: ['CLAUDE.md', 'README.md'] },
  { feature: 'Metrics report renderer',    marker: 'render-metrics',              files: ['CLAUDE.md', 'README.md'] },
  { feature: 'Executable invariant runner', marker: 'invariant-check',            files: ['CLAUDE.md', 'README.md'] },
  { feature: 'Portfolio dashboard',        marker: 'portfolio',                   files: ['CLAUDE.md', 'README.md'] },
  { feature: 'File System Access draft (R3)', marker: 'file system access',        files: ['README.md', 'claude-code-guide-v2.html'] },
  { feature: 'Seams audit cadence (P10)',  marker: 'seams audit cadence',         files: ['CLAUDE.md', 'README.md'] },
  { feature: '/pr-review command (R7)',    marker: 'pr-review',                    files: ['CLAUDE.md', 'README.md'] },
  // R18 — the interface/visual audit lens. Pinned across all three artifacts:
  // the canonical /broad-scan Stage 3 body, the console's §T1 builder (which is
  // additionally --assert-locked at 100% coverage), and the operator docs. The
  // (a)/(b) split is the load-bearing part — without the perceptual half the
  // lens invites the agent to guess at things it cannot verify — so the marker
  // pins the routing target, not just the heading.
  { feature: 'Interface & visual layer lens (R18)', marker: 'interface & visual layer', files: ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'] },
  { feature: 'Perceptual checks routed to operator (R18)', marker: 'operator visual checks', files: ['CLAUDE.md', 'README.md', 'claude-code-guide-v2.html'] },
  // R19 — the §4v pack assembler. Script + the .cycle/blocks/ convention it
  // reads; console-independent, so it is pinned in the canonical docs only.
  { feature: 'Verification pack assembler (R19)', marker: 'verification-pack', files: ['CLAUDE.md', 'README.md'] },
];

// Every workflow output block must be representable in BOTH the canonical
// commands and the HTML console, so a console user can produce/consume each.
//
// F17: this was a hand-maintained list of 7 while check-output-blocks.mjs
// registered 12 — a parallel source of truth, the exact Axis B category this
// tool polices. The five it omitted were not an oversight anyone noticed: they
// were hiding a missing /pr-review console section (F03), a missing Tier 1
// implement prompt (F21), and a §T2b that never emitted its summary block
// (F02). DERIVE it instead, so adding a block to the registry automatically
// requires the console to carry it and no future gap can hide here.
const WORKFLOW_BLOCKS = BLOCKS.map(b => b.name.toLowerCase());

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

// ── Structural check 3: every workflow output block appears in both the
// canonical commands (CLAUDE.md) and the HTML console. ──
const blockMissing = WORKFLOW_BLOCKS.filter(b =>
  !contents['CLAUDE.md'].includes(b) || !contents['claude-code-guide-v2.html'].includes(b));
if (blockMissing.length) {
  failures++;
  console.log(`  ✗ Workflow blocks missing from CLAUDE.md or the HTML console: ${blockMissing.join(', ')}`);
} else {
  console.log(`  ✓ All ${WORKFLOW_BLOCKS.length} workflow output blocks present in both CLAUDE.md and the HTML console`);
}

// ── Structural check 4: version + changelog present AND CONSISTENT (R5/F09).
// Presence alone was a false green: VERSION could say 9.9.9 while CHANGELOG's
// top entry said 1.20.0 and the guard stayed silent — proven by mutation, and
// the reason INV-23 ("bumped when semantics change") was only half-verified.
// /sync-commands reports both to consuming repos, so they must agree.
let versionOk = true, versionRaw = '', changelogRaw = '';
try { versionRaw = readFileSync(new URL('VERSION', root), 'utf8').trim(); } catch (e) { versionOk = false; }
try { changelogRaw = readFileSync(new URL('CHANGELOG.md', root), 'utf8'); } catch (e) { versionOk = false; }
if (!versionRaw || !changelogRaw.trim()) versionOk = false;
if (!versionOk) { failures++; console.log('  ✗ VERSION and/or CHANGELOG.md missing or empty (R5 — bump on every template change)'); }
else if (!/^\d+\.\d+\.\d+$/.test(versionRaw)) {
  failures++; console.log(`  ✗ VERSION is not semver: "${versionRaw}"`);
} else {
  const top = (changelogRaw.match(/^##\s+(\d+\.\d+\.\d+)/m) || [])[1];
  if (!top) { failures++; console.log('  ✗ CHANGELOG.md has no "## <semver>" entry heading to compare against VERSION'); }
  else if (top !== versionRaw) {
    failures++;
    console.log(`  ✗ VERSION (${versionRaw}) does not match the newest CHANGELOG entry (${top}) — bump both together (R5)`);
  } else console.log(`  ✓ VERSION and CHANGELOG.md present and consistent (${versionRaw})`);
}

// ── Structural check 5: command-pair parity (P4) — the near-duplicate
// command groups must keep their SHARED behaviors in sync, so updating one
// member can't silently leave the others behind (no factoring; just a guard).
const COMMAND_GROUPS = [
  { name: 'implement family', cmds: ['implement', 'broad-implement', 'targeted-implement'],
    markers: ['run tests', 'test doubles', 'operator actions', 'manual'] },
  { name: 'audit family', cmds: ['audit', 'targeted-audit'],
    markers: ['fire in production this month', 'operator actions surfaced', 'do not flag style preferences'] },
];
const cmdText = name => { try { return readFileSync(new URL(`.claude/commands/${name}.md`, root), 'utf8').toLowerCase(); } catch { return null; } };
let parityFail = 0;
for (const g of COMMAND_GROUPS) {
  const loaded = g.cmds.map(c => [c, cmdText(c)]);
  for (const m of g.markers) {
    const missing = loaded.filter(([, txt]) => !txt || !txt.includes(m)).map(([c]) => c);
    if (missing.length) {
      parityFail++;
      console.log(`  ✗ ${g.name}: shared behavior "${m}" missing from ${missing.join(', ')} (drift across the pair)`);
    }
  }
}
if (parityFail) failures += parityFail;
else console.log(`  ✓ Command-pair parity — shared behaviors consistent across ${COMMAND_GROUPS.length} command groups`);

// ── Structural check 6: metrics-row ownership + schema parity. Guards the
// non-R14-generated HTML §6a synthesis prompt (and CLAUDE.md) against the
// two ways the metrics schema has silently drifted before:
//   (a) every metrics.csv header emitted anywhere must carry the trailing
//       defensive_count column (P11, v1.9.0); and
//   (b) the phase=synthesis row must NOT be told to write net_score —
//       net_score/prod_fixes/new_failure_modes are owned ONLY by phase=reflect
//       rows (P1, v1.6.0), or the render-metrics cumulative trend double-counts.
const htmlRaw = readFileSync(new URL('claude-code-guide-v2.html', root), 'utf8');
const HEADER_PREFIX = 'date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes';
let metricsFail = 0;
for (const [f, raw] of [['CLAUDE.md', claudeRaw], ['claude-code-guide-v2.html', htmlRaw]]) {
  const re = new RegExp(HEADER_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(,defensive_count)?', 'g');
  let m, stale = 0;
  while ((m = re.exec(raw)) !== null) { if (!m[1]) stale++; }
  if (stale) { metricsFail++; console.log(`  ✗ ${f}: ${stale} metrics.csv header(s) missing the trailing defensive_count column (P11)`); }
}
if (/phase=synthesis with the overall net_score/i.test(htmlRaw)) {
  metricsFail++;
  console.log('  ✗ HTML §6a tells the phase=synthesis row to write net_score — owned only by phase=reflect (P1 double-count footgun)');
}
if (metricsFail) failures += metricsFail;
else console.log('  ✓ Metrics-row ownership + defensive_count schema parity (P1 + P11)');

// ── Structural check 7 (R16): per-builder parity for the DYNAMIC console
// prompt builders. ALL NINE are now gated by gen-html-prompts --assert against
// a canonical body in CLAUDE.md (100% line coverage; drift fails CI) — F02/F21
// retired the last report-only builder, so no exemption tier remains. These
// markers are therefore a cheap SECONDARY layer (defense-in-depth + a
// human-readable contract): they pin
// each builder's load-bearing phrases so they must co-occur in BOTH the
// canonical source (CLAUDE.md) and the HTML console, catching gross drift even
// if the --assert lock were bypassed. (Cycle-4 F1 — a §6a drift instance the
// markers alone couldn't see — is now caught by the textual lock.)
const DYNAMIC_BUILDERS = [
  { name: '§6a Health Synthesis (buildP6aText)',      markers: ['two-axis grid', 'policy response'] },
  { name: '§6b Health Pulse (buildP6bText)',          markers: ['investigate first', 'horizontal bug-shape'] },
  { name: '§1s Seams audit (buildSeamsText)',         markers: ['seam inventory', 'invariant validation'] },
  { name: '§4v Verification (buildVerificationText)', markers: ['independent verification', 'category d'] },
  { name: 'Tier 1 Broad Scan (buildTier1Text)',       markers: ['stage 1 — broad pass', 'production readiness assessment', 'effectiveness & strategic review'] },
  { name: 'Tier 2 (buildTier2AuditText/ImplText)',    markers: ['do not touch', 'cross-module risk'] },
  { name: 'Tier 1 Broad Implement (buildTier1ImplText)', markers: ['---broad scan implementation summary---'] },
  { name: 'PR Review (buildPrReviewText)',            markers: ['---pr review block---', 'stay inside the diff'] },
];
let builderFail = 0;
for (const b of DYNAMIC_BUILDERS) {
  const missing = b.markers.filter(m => !contents['CLAUDE.md'].includes(m) || !contents['claude-code-guide-v2.html'].includes(m));
  if (missing.length) {
    builderFail++;
    console.log(`  ✗ ${b.name}: contract marker(s) not in both CLAUDE.md and the HTML console: ${missing.map(m => `"${m}"`).join(', ')}`);
  }
}
if (builderFail) failures += builderFail;
else console.log(`  ✓ Dynamic console builder parity — ${DYNAMIC_BUILDERS.length} builders pinned to their canonical contracts (R16)`);

if (failures) {
  console.error(`\n${failures} issue(s) detected. Add the missing capability/template to the listed file(s),`);
  console.error('regenerate command files, or update CHECKS in scripts/check-template-sync.mjs if a marker was intentionally renamed.');
  process.exit(1);
}
console.log('\nAll tracked features present and command files in sync. ✓');
