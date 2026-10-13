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

import { readFileSync, readdirSync } from 'node:fs';
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
  { feature: 'Invariant mutation audit',    marker: 'mutation-audit',              files: ['CLAUDE.md', 'README.md'] },
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
// F49 (Cycle 7): find EVERY header, not just the ones with the exact prefix.
// The old scan only counted headers that matched the first ten columns
// verbatim, so a header that dropped or renamed a MIDDLE column (notes, say)
// matched nothing and was never checked — and with no count floor, deleting
// every header passed too. Now every `date,cycle,…` run must be exactly the
// metrics or the estimates header, and each file must still carry its floor.
const METRICS_HEADER = 'date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes,defensive_count';
const ESTIMATES_HEADER = 'date,cycle,action,estimate,estimated_hours,actual_hours,calibration_note';
let metricsFail = 0;
const liveCsv = f => { try { return readFileSync(new URL(f, root), 'utf8').split(/\r?\n/)[0]; } catch (e) { return null; } };
const headerSources = [['CLAUDE.md', claudeRaw, 4, 3], ['claude-code-guide-v2.html', htmlRaw, 2, 1]];
for (const [f, floorKind] of [['.cycle/metrics.csv', 'm'], ['.cycle/estimates.csv', 'e']]) {
  const h = liveCsv(f); if (h != null) headerSources.push([f, h, floorKind === 'm' ? 1 : 0, floorKind === 'e' ? 1 : 0]);
}
for (const [f, raw, mFloor, eFloor] of headerSources) {
  const found = [...raw.matchAll(/\bdate,cycle(?:,[a-z_]+)*/g)].map(m => m[0]);
  const bad = found.filter(h => h !== METRICS_HEADER && h !== ESTIMATES_HEADER);
  const nM = found.filter(h => h === METRICS_HEADER).length, nE = found.filter(h => h === ESTIMATES_HEADER).length;
  // Name what differs against whichever canonical header it is closest to.
  const diff = h => {
    const cols = h.split(','), share = c => c.split(',').filter(x => cols.includes(x)).length;
    const canon = (share(METRICS_HEADER) >= share(ESTIMATES_HEADER) ? METRICS_HEADER : ESTIMATES_HEADER).split(',');
    const miss = canon.filter(x => !cols.includes(x)), extra = cols.filter(x => !canon.includes(x));
    return `${JSON.stringify(h)} (${[miss.length && 'missing ' + miss.join('/'), extra.length && 'unexpected ' + extra.join('/'), !miss.length && !extra.length && 'columns out of order'].filter(Boolean).join('; ')})`;
  };
  if (bad.length) { metricsFail++; console.log(`  ✗ ${f}: ${bad.length} CSV header(s) not matching the canonical column list (P11/F49): ${[...new Set(bad)].map(diff).join(', ')}`); }
  if (nM < mFloor || nE < eFloor) { metricsFail++; console.log(`  ✗ ${f}: only ${nM} metrics / ${nE} estimates header(s) found, expected at least ${mFloor} / ${eFloor} — a header was deleted or rewritten out of recognition (F49)`); }
}
if (/phase=synthesis with the overall net_score/i.test(htmlRaw)) {
  metricsFail++;
  console.log('  ✗ HTML §6a tells the phase=synthesis row to write net_score — owned only by phase=reflect (P1 double-count footgun)');
}
if (metricsFail) failures += metricsFail;
else console.log(`  ✓ Metrics-row ownership + exact CSV header parity across ${headerSources.length} source(s) (P1 + P11 + F49)`);

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

// ── F31: the CI workflow is read as STRUCTURE, not text. Checks 8 and 14 used
// to regex the raw YAML, so three mutations passed: a step turned into
// `run: echo skipped  # node tests/x.mjs` (the comment still "ran" the stage),
// `run: node tests/mutation-audit.mjs || true` (a stage that can never fail the
// job), and `branches: [never-a-real-branch]` under pull_request (a trigger
// that never fires). Comments are stripped, each step's keys are parsed, and a
// stage counts only when its run: value is the BARE command.
function stripYamlComments(s) { return s.split(/\r?\n/).map(l => l.replace(/(^|\s)#.*$/, '')).join('\n'); }
const indentOf = l => l.match(/^ */)[0].length;
function ciSteps(wf) {
  const lines = stripYamlComments(wf).split('\n');
  const raw = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*steps:\s*$/.test(lines[i])) continue;
    const base = indentOf(lines[i]);
    let cur = null, dashInd = -1, j = i + 1;
    for (; j < lines.length; j++) {
      const l = lines[j]; if (!l.trim()) continue;
      const ind = indentOf(l), dash = l.match(/^ *-\s+(.*)$/);
      if (dash && (dashInd === -1 ? ind >= base : ind === dashInd)) { dashInd = ind; cur = [' '.repeat(ind + 2) + dash[1]]; raw.push(cur); continue; }
      if (ind <= base || (dashInd !== -1 && ind <= dashInd)) break;
      if (cur) cur.push(l);
    }
    i = j - 1;
  }
  return raw.map(st => {
    const keyInd = indentOf(st[0]), keys = {};
    for (let k = 0; k < st.length; k++) {
      if (indentOf(st[k]) !== keyInd) continue;
      const m = st[k].match(/^\s*([\w-]+):\s*(.*)$/); if (!m) continue;
      let v = m[2].trim();
      if (/^[|>][-+]?$/.test(v)) { const body = []; while (k + 1 < st.length && indentOf(st[k + 1]) > keyInd) body.push(st[++k].trim()); v = body.join('\n'); }
      keys[m[1]] = v.replace(/^(['"])(.*)\1$/, '$2');
    }
    return keys;
  });
}
const STAGE_RE = /^node\s+((?:scripts|tests)\/[\w.-]+\.mjs(?:\s+--[\w-]+)?)$/;
// Stages in run order, plus every reason a stage could pass without running.
function ciStages(wf) {
  const stages = [], problems = [], text = stripYamlComments(wf);
  const gate = text.match(/^\s*(?:-\s+)?(if|continue-on-error)\s*:.*$/m);
  if (gate) problems.push(`\`${gate[0].trim()}\` — a conditional or failure-tolerant job/step can skip or swallow a stage`);
  for (const st of ciSteps(wf)) {
    if (st.run == null) continue;
    const m = st.run.match(STAGE_RE);
    if (m) stages.push(m[1].replace(/\s+/g, ' '));
    else if (/node\s+(?:scripts|tests)\//.test(st.run)) problems.push(`\`run: ${st.run.replace(/\n/g, ' ⏎ ')}\` is not a bare stage — chained, piped or \`|| true\` commands can pass without the stage passing`);
  }
  return { stages, problems };
}
// A trigger with any filter (branches, paths, types, …) fires on some pushes or
// PRs, not all — `branches: [never-a-real-branch]` passed the old text check.
function ciTriggerProblems(wf) {
  const lines = stripYamlComments(wf).split('\n');
  const at = lines.findIndex(l => /^["']?on["']?:\s*$/.test(l));
  if (at === -1) return { missing: ['push', 'pull_request'], filtered: [] };
  const found = {}, filtered = [];
  for (let j = at + 1; j < lines.length; j++) {
    const l = lines[j]; if (!l.trim()) continue;
    if (indentOf(l) === 0) break;
    const m = l.match(/^(\s+)(push|pull_request)\s*:\s*(.*)$/); if (!m) continue;
    found[m[2]] = true;
    const next = lines.slice(j + 1).find(x => x.trim());
    if (!/^(|\{\s*\}|null|~)$/.test(m[3].trim()) || (next && indentOf(next) > m[1].length)) filtered.push(m[2]);
  }
  return { missing: ['push', 'pull_request'].filter(t => !found[t]), filtered };
}

// ── Structural check 8 (F15): the CI workflow declares least privilege. Every
// step only reads the checkout — no step posts, pushes or publishes — so
// without an explicit block the job inherits whatever the repository default
// grants. §4v flagged this as a Category D candidate: the permissions block
// shipped in v1.21.0 with no test asserting it, so a later edit could drop it
// silently.
try {
  const wf = readFileSync(new URL('.github/workflows/sync-check.yml', root), 'utf8');
  // Blank and comment-only lines are dropped first, and the body is bounded by
  // [ \t]+ — the old `\s+` matched newlines, so the "block" ran to EOF and a
  // `contents: read` anywhere below (or in a comment) satisfied it (F31).
  const perms = stripYamlComments(wf).split('\n').filter(l => l.trim()).join('\n').concat('\n').match(/^permissions:[ \t]*\n((?:[ \t]+\S.*\n)+)/m);
  if (!perms) { failures++; console.log('  ✗ CI workflow declares no permissions: block — the job inherits the repo default (F15)'); }
  else if (!/contents:\s*read/.test(perms[1])) { failures++; console.log(`  ✗ CI workflow permissions do not grant read-only contents: ${perms[1].trim().replace(/\n/g, ', ')}`); }
  else if (/write/.test(perms[1])) { failures++; console.log(`  ✗ CI workflow requests write permission it does not need: ${perms[1].trim().replace(/\n/g, ', ')}`); }
  else console.log('  ✓ CI workflow declares least-privilege permissions (contents: read)');

  // INV-14 — the workflow must actually RUN the guard, on both triggers. The
  // invariant said "CI runs check-template-sync.mjs on push and PR" and its
  // Verify field pointed at the YAML file as prose, so nothing asserted it: the
  // trigger list or the step could have been dropped and only INV-57's
  // permissions clause was being read out of this file.
  const trig = ciTriggerProblems(wf);
  if (trig.missing.length) { failures++; console.log(`  ✗ CI workflow does not trigger on: ${trig.missing.join(', ')} (INV-14)`); }
  else if (trig.filtered.length) { failures++; console.log(`  ✗ CI workflow filters its ${trig.filtered.join(' and ')} trigger (branches/paths/types) — it must fire on every push and PR (INV-14, F31)`); }
  else if (!ciStages(wf).stages.includes('scripts/check-template-sync.mjs')) {
    failures++; console.log('  ✗ CI workflow has no step running scripts/check-template-sync.mjs (INV-14)');
  } else console.log('  ✓ CI runs check-template-sync.mjs on push and pull_request (INV-14)');
} catch (e) { failures++; console.log('  ✗ could not read .github/workflows/sync-check.yml: ' + e.message); }

// ── Structural check 9 (INV-16): the /setup-cycle config SCHEMA is written out
// in three places — CLAUDE.md's "Cycle Workflow Config" template, CLAUDE.md's
// /setup-cycle OUTPUT 1, and the console's Setup <pre>. INV-16 claimed they
// "list the same optional sections" and its Verify field pointed at the
// capability markers above, which only prove a phrase appears SOMEWHERE in each
// file. That was a false green: the console's schema was missing
// `### Seams Audit Cadence` entirely and its Invariant Library line omitted the
// `| Verify:` field — so an operator who ran §Setup from the console got a
// config whose invariants could never become executable, while the marker for
// "test name or code ref" passed because the phrase appears elsewhere in the
// HTML. Compare the actual section lists, derived from each copy.
{
  const sections = (text, startRe, endRe) => {
    const s = text.search(startRe);
    if (s === -1) return null;
    const rest = text.slice(s + 1);
    const e = rest.search(endRe);
    const body = e === -1 ? rest : rest.slice(0, e);
    return { set: new Set([...body.matchAll(/^###\s+(.+)$/gm)].map(m => m[1].split('←')[0].trim().toLowerCase())), body };
  };
  const COPIES = [
    ['CLAUDE.md config template', sections(claudeRaw, /^## Cycle Workflow Config$/m, /^```/m)],
    ['CLAUDE.md /setup-cycle OUTPUT 1', sections(claudeRaw, /OUTPUT 1 — CYCLE WORKFLOW CONFIG/, /OUTPUT 2 —/)],
    ['console Setup <pre>', sections(htmlRaw, /^## Cycle Workflow Config$/m, /OUTPUT 2 —/)],
  ];
  const unreadable = COPIES.filter(([, r]) => !r || !r.set.size).map(([n]) => n);
  if (unreadable.length) {
    failures++;
    console.log(`  ✗ could not extract the config schema from: ${unreadable.join(', ')} — the parity check would be vacuous (INV-16)`);
  } else {
    const union = new Set(COPIES.flatMap(([, r]) => [...r.set]));
    const drift = [];
    for (const name of union) {
      const absent = COPIES.filter(([, r]) => !r.set.has(name)).map(([n]) => n);
      if (absent.length) drift.push(`"${name}" missing from ${absent.join(' + ')}`);
    }
    // The `| Verify:` field is what makes an invariant executable
    // (invariant-check.mjs). A schema that omits it teaches operators to write
    // libraries that can never run, so it is pinned as well as the headings.
    const noVerify = COPIES.filter(([, r]) => !/^INV-\S+ \|.*\| Verify:/m.test(r.body)).map(([n]) => n);
    if (noVerify.length) drift.push(`Invariant Library line has no "| Verify:" field in ${noVerify.join(' + ')}`);
    if (drift.length) { failures++; console.log(`  ✗ /setup-cycle config schema drift (INV-16): ${drift.join('; ')}`); }
    else console.log(`  ✓ /setup-cycle config schema identical across all 3 copies — ${union.size} sections + the Verify field (INV-16)`);
  }
}

// ── Structural check 10 (INV-12 / INV-18): every step that writes to .cycle/
// must be gated on .cycle/ existing. This is what makes the state directory
// OPTIONAL — deleting it returns a consuming project to the pure copy-paste
// workflow with no loss. Both invariants' Verify fields read "code read of
// command text", i.e. nothing was checking it; an ungated CHECKPOINT would
// silently make .cycle/ mandatory for every consumer.
//
// Cycle-7 follow-on: the step set is DERIVED, not listed. A step heading
// (an ALL-CAPS label such as "6. CHECKPOINT (" or "SEAM COUNTER (") whose body
// writes to .cycle/ is a writing step, wherever it lives — every command file,
// AND the §1s and §6a section bodies, which carry writes of their own (the
// SEAM COUNTER reset and the step-8 METRICS append) and sat outside the old
// hand-listed scan. The old names stay as a FLOOR: a heading with one of them
// must still be recognised as writing, so the derivation cannot quietly drop
// a step whose wording changed.
{
  const HEAD = /^\s*(?:\d+\.\s*)?([A-Z][A-Z0-9 &/-]{2,}[A-Z])(?=\s*(?:\(|:|—|$))/;
  const WRITE = /\b(creat\w*|updat\w*|append\w*|writ\w*|increment\w*|reset\w*|set)\b[^.]{0,160}?\.cycle\/|\.cycle\/[\s\S]{0,240}?\b(file write|increment|reset|append)\b/i;
  const GATE = /optional\s*—\s*only if|if a \.cycle\/ directory exists|skip if no \.cycle\//i;
  const KNOWN = ['CHECKPOINT', 'METRICS', 'ESTIMATE CALIBRATION', 'BLOCKS', 'SEAM COUNTER', 'CYCLE OPEN'];
  // Commands whose whole premise is the directory: /cycle-init creates it, and
  // /cycle-resume stops at its first step when .cycle/STATE.md is absent.
  const EXEMPT = { 'cycle-init': 'creates .cycle/ — its whole job', 'cycle-resume': 'stops first if .cycle/STATE.md is absent' };
  const fencedSection = h => { const i = claudeRaw.indexOf('### ' + h + '\n'); if (i === -1) return null; const a = claudeRaw.indexOf('```\n', i); return a === -1 ? null : claudeRaw.slice(a + 4, claudeRaw.indexOf('\n```', a + 4)); };
  const sources = [];
  try { for (const f of readdirSync(new URL('.claude/commands/', root)).filter(f => f.endsWith('.md'))) sources.push([f, readFileSync(new URL('.claude/commands/' + f, root), 'utf8'), f.replace(/\.md$/, '')]); } catch (e) {}
  for (const [label, h] of [['§1s Seams audit', 'Seams & Invariants Audit (Section 1s in HTML tool)'], ['§6a Health Synthesis', 'Health Synthesis (Section 6a in HTML tool)']]) sources.push([label, fencedSection(h), null]);
  const ungated = [], unrecognised = [], missingSections = [];
  const kinds = new Set();
  let stepCount = 0;
  for (const [label, txt, cmd] of sources) {
    if (txt == null) { missingSections.push(label); continue; }
    if (cmd && EXEMPT[cmd]) continue;
    const L = txt.split('\n'), heads = [];
    L.forEach((l, i) => { if (HEAD.test(l)) heads.push(i); });
    heads.forEach((h, k) => {
      const name = L[h].match(HEAD)[1];
      const body = L.slice(h, k + 1 < heads.length ? heads[k + 1] : L.length).join(' ').replace(/\s+/g, ' ');
      const writes = WRITE.test(body);
      const known = KNOWN.find(n => name === n);
      if (known && !writes) unrecognised.push(`${label}: "${name}"`);
      if (!writes && !known) return;
      stepCount++; kinds.add(name);
      if (!GATE.test(L.slice(h, h + 3).join(' '))) ungated.push(`${label}: "${name}"`);
    });
  }
  const problems = [];
  if (missingSections.length) problems.push(`could not locate ${missingSections.join(', ')} — part of the scan would be vacuous`);
  if (!stepCount) problems.push('no .cycle/-writing steps found anywhere — the gating check is vacuous');
  if (ungated.length) problems.push(`.cycle/-writing step(s) not gated on the directory existing: ${ungated.join(', ')}`);
  if (unrecognised.length) problems.push(`known .cycle/-writing step(s) no longer read as writing — the derivation lost them: ${unrecognised.join(', ')}`);
  if (problems.length) { failures++; console.log(`  ✗ ${problems.join('; ')} (INV-12/INV-18)`); }
  else console.log(`  ✓ all ${stepCount} .cycle/-writing steps — derived across the commands and the §1s/§6a bodies (${[...kinds].join(', ')}) — are gated on .cycle/ existing; exempt by design: ${Object.keys(EXEMPT).join(', ')} (INV-12/INV-18)`);
}

// ── Structural check 11 (F15): .cycle/STATE.md must keep the SHAPE its own
// template defines. STATE.md is the rolling "where am I now" file that
// /cycle-resume and the SessionStart hook read; over five cycles it had grown
// to 24 sections and 347 lines with TWO "Decisions made" and TWO "Where I left
// off", so the substrate a new session loads was buried in narrative history.
// The template lives in CLAUDE.md ("Cycle State & Memory"), so derive the
// expected headings from it rather than listing them here. Skipped when there
// is no .cycle/ (a consuming project may not use one, and the guard's own
// regression test copies only the tracked artifacts).
{
  const tmpl = claudeRaw.match(/`\.cycle\/STATE\.md` template:\s*\n+```\n([\s\S]*?)\n```/);
  let stateRaw = null;
  try { stateRaw = readFileSync(new URL('.cycle/STATE.md', root), 'utf8'); } catch (e) {}
  if (!tmpl) { failures++; console.log('  ✗ could not find the .cycle/STATE.md template in CLAUDE.md — the state-shape check would be vacuous (F15)'); }
  else if (stateRaw === null) console.log('  · no .cycle/STATE.md in this tree — state-shape check skipped (optional per project)');
  else {
    const heads = t => [...t.matchAll(/^##\s+(.+)$/gm)].map(m => m[1].trim());
    const want = heads(tmpl[1]), have = heads(stateRaw);
    const extra = have.filter(h => !want.includes(h));
    const missing = want.filter(h => !have.includes(h));
    const dupes = have.filter((h, i) => have.indexOf(h) !== i);
    if (!want.length) { failures++; console.log('  ✗ the STATE.md template block defines no sections (F15)'); }
    else if (extra.length || missing.length || dupes.length) {
      failures++;
      const bits = [];
      if (extra.length) bits.push(`section(s) the template does not define: ${extra.map(h => JSON.stringify(h.slice(0, 40))).join(', ')}`);
      if (missing.length) bits.push(`template section(s) missing: ${missing.map(h => JSON.stringify(h.slice(0, 40))).join(', ')}`);
      if (dupes.length) bits.push(`duplicated section(s): ${[...new Set(dupes)].map(h => JSON.stringify(h.slice(0, 40))).join(', ')}`);
      console.log(`  ✗ .cycle/STATE.md has drifted from its template (F15) — ${bits.join('; ')}. Narrative history belongs in .cycle/HISTORY.md.`);
    } else console.log(`  ✓ .cycle/STATE.md matches its template — ${want.length} sections, no extras, no duplicates (F15)`);
  }
}

// ── Structural check 12 (INV-68): the invariant library's PARSE FLOOR.
// TWO parsers read the same library file and they disagreed: invariant-check's
// `^(INV-\d+)\s*\|` has no `\s*` before the anchor, while verification-pack
// trims each line first. So a rule written with ONE leading space vanished from
// invariant-check AND from the mutation audit (which derives its set from that
// same parse, so no case was orphaned and nothing failed) while the §4v pack
// still showed the verifier a library one rule longer. Both tools reported
// "67/67 … Every runnable invariant fails closed ✓" against a 68-rule file.
// A derivation needs a floor or it can silently cover less than it claims —
// INV-58 gives the mutation-case dimension one; this is the same floor a level
// up, on the parse itself. Skipped when there is no .cycle/ library (a
// consuming project may keep its invariants in CLAUDE.md, and the guard's own
// regression sandbox copies neither .cycle/ nor these modules).
{
  let libRaw = null;
  try { libRaw = readFileSync(new URL('.cycle/config.md', root), 'utf8'); } catch (e) {}
  if (libRaw === null) console.log('  · no .cycle/config.md in this tree — invariant-library parse floor skipped (optional per project)');
  else {
    // Imported dynamically and defensively: a consuming project may have copied
    // this guard and kept a .cycle/ library WITHOUT the two reader modules. The
    // .cycle/ helpers are additive by design, so a missing module degrades to a
    // reported skip — it must never crash a guard the project runs in CI.
    let parseInvariants, readInvariants;
    try {
      ({ parseInvariants } = await import('./invariant-check.mjs'));
      ({ readInvariants } = await import('./verification-pack.mjs'));
    } catch (e) {
      console.log(`  · invariant-library parse floor skipped — a reader module is not present in this tree (${e.code || e.message})`);
    }
    if (!parseInvariants || !readInvariants) { /* skipped above */ } else {
    // PERMISSIVE on purpose — this is the ground truth the parsers are measured
    // against, so it must see a line neither of them may.
    const rawIds = [...libRaw.matchAll(/^[ \t]*(INV-\d+)\s*\|/gm)].map(m => m[1]);
    const strictIds = parseInvariants(libRaw).map(i => i.id);
    const packIds = readInvariants(libRaw).map(l => l.split('|')[0].trim());
    const diff = (a, b) => a.filter(x => !b.includes(x));
    const bits = [];
    if (JSON.stringify(strictIds) !== JSON.stringify(rawIds))
      bits.push(`invariant-check sees ${strictIds.length} of ${rawIds.length} (dropped: ${diff(rawIds, strictIds).join(', ') || 'none — order differs'})`);
    if (JSON.stringify(packIds) !== JSON.stringify(rawIds))
      bits.push(`verification-pack sees ${packIds.length} of ${rawIds.length} (dropped: ${diff(rawIds, packIds).join(', ') || 'none — order differs'})`);
    if (JSON.stringify(strictIds) !== JSON.stringify(packIds))
      bits.push(`the two parsers disagree: only-in-check ${diff(strictIds, packIds).join(', ') || '—'} / only-in-pack ${diff(packIds, strictIds).join(', ') || '—'}`);
    if (!rawIds.length) { failures++; console.log('  ✗ invariant-library parse floor: the library file contains no INV- lines — this check would be vacuous (INV-68)'); }
    else if (bits.length) {
      failures++;
      console.log(`  ✗ invariant-library parse floor (INV-68): ${bits.join('; ')}. A rule that parses in one reader and not the other leaves the proven set silently — check the line's leading whitespace and its "INV-N |" shape.`);
    } else console.log(`  ✓ invariant-library parse floor: all ${rawIds.length} INV- lines parse identically in invariant-check and verification-pack (INV-68)`);
    }
  }
}

// ── Structural check 13 (INV-71): PROJECT_HEALTH.md's "Current Standing" label
// contract. Five labels were hard-coded independently in four artifacts. They
// matched, and nothing asserted it. The failure mode is silent by construction:
// a label that drifts on one side makes every reader fall back to "—", so the
// portfolio board, the status board and the console Dashboard all render the
// project as UNSCORED rather than erroring — a wrong answer about live status.
// The two script readers now import the list; the copies that cannot import it
// (the self-contained console, the CLAUDE.md skeleton, the generated command)
// are checked against it here.
{
  // Guarded like check 12: a project may have copied this guard without the
  // shared module, and the guard's own regression sandbox copies neither.
  let HEALTH_LABELS, HEALTH_SECTION;
  try { ({ HEALTH_LABELS, HEALTH_SECTION } = await import('./health-fields.mjs')); }
  catch (e) { console.log(`  · health-field contract skipped — scripts/health-fields.mjs not present in this tree (${e.code || e.message})`); }
  if (HEALTH_LABELS) {
  // Each label is checked inside the SPAN THAT WRITES IT, never against the
  // whole file: every one of these labels appears twice per artifact (the writer
  // and the §7 template), so a file-global `includes` would pass with the
  // skeleton broken — the exact marker gotcha this repo already documented. An
  // anchor that stops matching FAILS rather than silently checking nothing.
  // The CONSOLE is absent from this list on purpose: parseHealth matches a loose
  // pattern rather than spelling the labels, so it is verified by behaviour in
  // check-html (build a block from these labels, require every field to parse).
  const spans = [
    ['CLAUDE.md', /If PROJECT_HEALTH\.md does not exist[\s\S]*?Keep the field labels/, '/cycle-init step 5 skeleton'],
    ['.claude/commands/cycle-init.md', /If PROJECT_HEALTH\.md does not exist[\s\S]*?Keep the field labels/, '/cycle-init step 5 skeleton'],
    ['PROJECT_HEALTH.md', /##\s+Current Standing[\s\S]*?(?=\n##\s)/, 'the live Current Standing block'],
  ];
  // FLOOR: a shrinking list would make this check pass by covering less.
  if (HEALTH_LABELS.length < 5) {
    failures++;
    console.log(`  ✗ health-field contract: HEALTH_FIELDS defines only ${HEALTH_LABELS.length} label(s) — the Current Standing block has five, so this check would cover less than it claims (INV-71)`);
  } else {
    const problems = [], absentFiles = [];
    for (const [file, anchor, what] of spans) {
      let raw;
      try { raw = readFileSync(new URL(file, root), 'utf8'); }
      catch (e) { absentFiles.push(file); continue; }
      const span = (raw.match(anchor) || [])[0];
      if (!span) { problems.push(`${file}: could not locate ${what} — this check would be vacuous`); continue; }
      const missingLabels = HEALTH_LABELS.filter(l => !span.includes(l));
      if (missingLabels.length) problems.push(`${file} ${what} does not carry ${missingLabels.map(l => JSON.stringify(l)).join(', ')}`);
      if (!span.includes(HEALTH_SECTION))
        problems.push(`${file} ${what} does not name the "${HEALTH_SECTION}" section`);
    }
    if (problems.length) {
      failures++;
      console.log(`  ✗ health-field contract (INV-71): ${problems.join('; ')}. A label that drifts on one side does not error — every reader silently falls back to "—" and the project renders as unscored.`);
    } else console.log(`  ✓ health-field contract: all ${HEALTH_LABELS.length} Current Standing labels present in every artifact that reads or writes them${absentFiles.length ? ` (${absentFiles.length} not in this tree: ${absentFiles.join(', ')})` : ''} (INV-71)`);
  }
  }
}

// ── Structural check 14 (INV-74): CI must run EVERY stage of the documented Test
// Command, in order. INV-14 only asserted that CI runs check-template-sync, so a
// stage added to the Test Command and forgotten in the workflow would be run by
// every developer and by nothing in CI. Parity is exact today; this keeps it.
// Skipped where either side is absent, or where the Test Command names no
// script stages (a consuming project running `npm test` has nothing to compare).
{
  let ciRaw = null, libRaw = null;
  try { ciRaw = readFileSync(new URL('.github/workflows/sync-check.yml', root), 'utf8'); } catch (e) {}
  try { libRaw = readFileSync(new URL('.cycle/config.md', root), 'utf8'); } catch (e) { libRaw = claudeRaw; }
  const tc = (libRaw.match(/^###\s+Test Command\s*\n([\s\S]*?)(?=\n###\s|\n##\s)/m) || [])[1] || '';
  const want = [...tc.matchAll(/node\s+((?:scripts|tests)\/[\w.-]+\.mjs(?:\s+--[\w-]+)?)/g)].map(m => m[1].replace(/\s+/g, ' ').trim());
  const ci = ciRaw ? ciStages(ciRaw) : { stages: [], problems: [] }, have = ci.stages;
  if (!ciRaw) console.log('  · no .github/workflows/sync-check.yml — CI/Test-Command parity skipped (optional per project)');
  else if (!want.length) console.log('  · the Test Command names no script stages — CI/Test-Command parity skipped (nothing to compare)');
  else if (ci.problems.length) {
    failures++;
    for (const p of ci.problems) console.log(`  ✗ CI/Test-Command parity (INV-74, F31): ${p}`);
  }
  else if (JSON.stringify(want) !== JSON.stringify(have)) {
    failures++;
    const missing = want.filter(s => !have.includes(s));
    const extra = have.filter(s => !want.includes(s));
    const bits = [];
    if (missing.length) bits.push(`CI never runs: ${missing.join(', ')}`);
    if (extra.length) bits.push(`CI runs stages the Test Command omits: ${extra.join(', ')}`);
    if (!missing.length && !extra.length) bits.push('same stages, different ORDER — a stage that depends on an earlier one would run first');
    console.log(`  ✗ CI/Test-Command parity (INV-74): ${bits.join('; ')}. A stage in one and not the other is a stage nobody runs, or one no contributor can reproduce.`);
  } else console.log(`  ✓ CI runs every stage of the documented Test Command, in order — ${want.length} stages (INV-74)`);
}

// ── Structural check 15 (INV-72): every release of the CURRENT cycle has a
// summary block in .cycle/blocks/. §4v and §6a read that directory and nothing
// else — not the CHANGELOG, not the commit log — so a release that ships without
// a block is invisible to verification and synthesis BY CONSTRUCTION. v1.30.1
// changed the console and had no block; §4v found it only by fetching origin.
// The floor is DERIVED (the lowest version this cycle already has a block for)
// rather than hard-coded, so the rule never reaches back into cycles that
// predate the convention, and the ceiling is VERSION.
{
  const semver = v => v.split('.').map(Number);
  const cmp = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
  let stateRaw = null, blockNames = [];
  try { stateRaw = readFileSync(new URL('.cycle/STATE.md', root), 'utf8'); } catch (e) {}
  try { blockNames = readdirSync(new URL('.cycle/blocks', root)); } catch (e) {}
  const cycle = stateRaw && (stateRaw.match(/^Cycle:\s*(\d+)/m) || [])[1];
  const blocked = blockNames
    .map(n => (n.match(new RegExp('^0?' + cycle + '-(\\d+\\.\\d+\\.\\d+)-')) || [])[1])
    .filter(Boolean).sort(cmp);
  if (!stateRaw || !cycle) console.log('  · no .cycle/STATE.md cycle number — release-block coverage skipped (optional per project)');
  else if (!blocked.length) console.log(`  · no versioned blocks for cycle ${cycle} yet — release-block coverage skipped (nothing to derive a floor from)`);
  else {
    const floor = blocked[0];
    const released = [...changelogRaw.matchAll(/^##\s+(\d+\.\d+\.\d+)\b/gm)].map(m => m[1]);
    const inCycle = released.filter(v => cmp(v, floor) >= 0 && (!versionRaw || cmp(v, versionRaw) <= 0));
    const orphans = inCycle.filter(v => !blocked.includes(v));
    if (orphans.length) {
      failures++;
      console.log(`  ✗ release with no block (INV-72): cycle ${cycle} shipped ${orphans.join(', ')} with nothing in .cycle/blocks/. §4v and §6a read that directory and nothing else, so those releases are invisible to verification and synthesis.`);
    } else console.log(`  ✓ every cycle-${cycle} release from ${floor} to ${versionRaw || blocked[blocked.length - 1]} has a block in .cycle/blocks/ — ${inCycle.length} release(s) (INV-72)`);
  }
}

// ── Structural check 16 (INV-75): the §6a policy trigger must stay RELATIVE and
// PARAMETERISED. It was a fixed floor ("≤5/10 for 2 consecutive cycles") written
// as a literal INSIDE the canonical body, while the Cycle Workflow Config
// carried a `Policy threshold` field the body never read — a parallel source of
// truth in which the config value was decorative. Worse, a fixed floor cannot
// fire on a healthy project: across six cycles of this repo, scores sat between
// 7 and 9.5 and the mechanism never engaged ONCE, including the cycle where
// Guard / Test Coverage Quality fell 9.0 → 7.0. The rule now names three clauses
// and reads both config fields by name.
{
  const start = claudeRaw.indexOf('### Health Synthesis');
  const body = start === -1 ? '' : claudeRaw.slice(start, claudeRaw.indexOf('\n---', start));
  const problems = [];
  if (!body) problems.push('could not locate the §6a "Health Synthesis" section — this check would be vacuous');
  else {
    for (const clause of ['DECLINE —', 'SHARP DROP —', 'PERSISTENT LAGGARD —', 'ABSOLUTE FLOOR —'])
      if (!body.includes(clause)) problems.push(`the §6a policy rule no longer names the ${JSON.stringify(clause.replace(' —', ''))} clause`);
    for (const field of ['`Policy threshold`', '`Consecutive cycles`'])
      if (!body.includes(field)) problems.push(`the §6a policy rule does not read ${field} from the Cycle Workflow Config`);
    // The regression to guard against: a literal score back in the canonical body.
    const hard = body.match(/≤\s*\d+\s*\/\s*10\s+for\s+\d+\s+consecutive/i);
    if (hard) problems.push(`a hardcoded policy floor is back in the canonical body (${JSON.stringify(hard[0])}) — the config field would be decorative again`);
  }
  if (problems.length) {
    failures++;
    console.log(`  ✗ relative policy trigger (INV-75): ${problems.join('; ')}. A fixed floor never fires on a healthy project — the primary trigger must be relative.`);
  } else console.log('  ✓ the §6a policy trigger is relative and parameterised — four clauses, both config fields read by name, no hardcoded floor (INV-75)');
}

// ── Structural check 17 (Cycle-7 F11): every command file STANDS ALONE. A
// consuming project copies .claude/commands/ and nothing else, so a body that
// says "See /broad-implement Step 1" only works if the agent opens a second
// command, and one that names scripts/… names a file the project may not have.
// No cross-command step delegation; every scripts/ mention is conditional.
{
  const problems = [];
  let files = [];
  try { files = readdirSync(new URL('.claude/commands/', root)).filter(f => f.endsWith('.md')); } catch (e) {}
  for (const f of files) {
    const body = readFileSync(new URL('.claude/commands/' + f, root), 'utf8');
    const deleg = body.match(/\bsee\s+`?\/[a-z][\w-]*`?\s+step\b/i);
    if (deleg) problems.push(`${f} delegates to another command (${JSON.stringify(deleg[0])})`);
    for (const m of body.matchAll(/\bscripts\/[\w.-]+/g)) {
      const before = body.slice(Math.max(0, m.index - 160), m.index).replace(/\s+/g, ' ');
      if (!/if the project has|where the project uses/i.test(before)) problems.push(`${f} names ${m[0]} unconditionally — a project that copied only .claude/commands/ may not have it`);
    }
  }
  if (!files.length) { failures++; console.log('  ✗ standalone commands (F11): no .claude/commands/*.md found — the check would be vacuous'); }
  else if (problems.length) { failures++; console.log(`  ✗ standalone commands (F11): ${problems.join('; ')}`); }
  else console.log(`  ✓ every command file stands alone — no cross-command step delegation, every scripts/ mention conditional (${files.length} files, F11)`);
}

// ── Structural check 18 (Cycle-7 follow-on to F05): the Operator State
// Checklist's re-pull paragraph classifies EVERY release since v1.19.0 — either
// "vX changed /cmd" or inside the "… changed none" list (ranges expanded
// against the CHANGELOG). v1.33.0 changed /setup-cycle and sat in neither list
// for nine releases; this repo's maintainer missed it while editing that very
// line. CI checks out a shallow clone, so the CHANGELOG is the ground truth,
// not git history. The NEWEST release must also match what its own entry says.
{
  let cfg = null;
  try { cfg = readFileSync(new URL('.cycle/config.md', root), 'utf8'); } catch (e) {}
  let changelog = '';
  try { changelog = readFileSync(new URL('CHANGELOG.md', root), 'utf8'); } catch (e) {}
  const start = cfg ? cfg.indexOf('**Run `/sync-commands` in consuming projects**') : -1;
  if (!cfg) console.log('  · no .cycle/config.md — re-pull list check skipped (this repo only)');
  else if (start === -1) { failures++; console.log('  ✗ re-pull list: the Operator State Checklist has no "Run `/sync-commands` in consuming projects" paragraph'); }
  else {
    const end = cfg.indexOf('\n- **', start + 10);
    const para = cfg.slice(start, end === -1 ? undefined : end).replace(/\s+/g, ' ');
    const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };
    const entries = [...changelog.matchAll(/^## (\d+\.\d+\.\d+) — [^\n]*\n([\s\S]*?)(?=^## \d|(?![\s\S]))/gm)].map(m => ({ v: m[1], body: m[2] }));
    const versions = entries.map(e => e.v).filter(v => cmp(v, '1.19.0') >= 0).sort(cmp);
    const changed = new Set([...para.matchAll(/\bv(\d+\.\d+\.\d+) changed\b(?! none)/g)].map(m => m[1]));
    const noneM = para.match(/((?:v\d+\.\d+\.\d+(?:–v\d+\.\d+\.\d+)?(?:,| and|,? and)?\s*)+)changed none/);
    const none = new Set();
    if (noneM) for (const t of noneM[1].matchAll(/v(\d+\.\d+\.\d+)(?:–v(\d+\.\d+\.\d+))?/g)) {
      if (!t[2]) none.add(t[1]);
      else versions.filter(v => cmp(v, t[1]) >= 0 && cmp(v, t[2]) <= 0).forEach(v => none.add(v));
    }
    const problems = [];
    if (!versions.length) problems.push('no CHANGELOG releases since v1.19.0 found — the check would be vacuous');
    if (!noneM) problems.push('no "… changed none." list found in the paragraph');
    const missing = versions.filter(v => !changed.has(v) && !none.has(v));
    const both = versions.filter(v => changed.has(v) && none.has(v));
    if (missing.length) problems.push(`release(s) in neither list: ${missing.map(v => 'v' + v).join(', ')} — say whether they changed a command body`);
    if (both.length) problems.push(`release(s) listed as both changed and changed-none: ${both.map(v => 'v' + v).join(', ')}`);
    const newest = entries[0];
    if (newest) {
      const saysNo = /no (?:command-body|`?\/sync-commands`? re-pull)/i.test(newest.body);
      const saysYes = /run `\/sync-commands`|command bodies changed/i.test(newest.body);
      if (saysNo && changed.has(newest.v)) problems.push(`v${newest.v}'s CHANGELOG says no re-pull, but the checklist lists it as changed`);
      if (saysYes && !saysNo && none.has(newest.v)) problems.push(`v${newest.v}'s CHANGELOG asks for a re-pull, but the checklist lists it as changed none`);
    }
    if (problems.length) { failures++; console.log(`  ✗ re-pull list (Operator State Checklist): ${problems.join('; ')}`); }
    else console.log(`  ✓ the re-pull list classifies every release since v1.19.0 exactly once — ${changed.size} changed, ${none.size} changed none — and the newest matches its CHANGELOG entry`);
  }
}

if (failures) {
  console.error(`\n${failures} issue(s) detected. Add the missing capability/template to the listed file(s),`);
  console.error('regenerate command files, or update CHECKS in scripts/check-template-sync.mjs if a marker was intentionally renamed.');
  process.exit(1);
}
console.log('\nAll tracked features present and command files in sync. ✓');
