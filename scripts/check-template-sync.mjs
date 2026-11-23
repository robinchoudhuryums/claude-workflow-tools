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
  { feature: 'Synthesis pack (R22)',       marker: 'synthesis-pack',              files: ['CLAUDE.md', 'README.md'] },
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
  // Cycle-8 F9: the roadmap said the repo "has never been run through its own cycle" while it
  // was on its eighth, and no command was responsible for noticing. /sync-docs carries the check
  // now; the marker is the step's own numbered heading, so the phrase turning up in a
  // description elsewhere does not satisfy it.
  { feature: 'Roadmap currency check in /sync-docs (Cycle-8 F9)', marker: '6. roadmap currency', files: ['CLAUDE.md'] },
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
// A generated command file is a frontmatter block (its picker description — Cycle-8 F8) and
// then the body. Every prose scan below reads the BODY: a description is a label, not an
// instruction, and check 20 holds it equal to the Command Index in CLAUDE.md, which IS scanned.
const splitCommandFile = raw => { const m = raw.match(/^---\n([\s\S]*?)\n---\n+/); return m ? { front: m[1], body: raw.slice(m[0].length) } : { front: null, body: raw }; };
const commandBodyOf = file => splitCommandFile(readFileSync(new URL('.claude/commands/' + file, root), 'utf8')).body;
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

// ── Structural check 3: every workflow output block appears in the canonical
// commands (CLAUDE.md). Until v1.53.0 it also had to appear in the HTML console;
// the console lock was retired then (frozen subsystem), so the console may fall
// behind and no check holds it to CLAUDE.md. ──
const blockMissing = WORKFLOW_BLOCKS.filter(b => !contents['CLAUDE.md'].includes(b));
if (blockMissing.length) {
  failures++;
  console.log(`  ✗ Workflow blocks missing from CLAUDE.md: ${blockMissing.join(', ')}`);
} else {
  console.log(`  ✓ All ${WORKFLOW_BLOCKS.length} workflow output blocks present in CLAUDE.md`);
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
const cmdText = name => { try { return commandBodyOf(name + '.md').toLowerCase(); } catch { return null; } };
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
const headerSources = [['CLAUDE.md', claudeRaw, 4, 3]];   // the console's copies dropped with its lock (v1.53.0)
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
// Cycle-8 F43: this used to be one literal — "phase=synthesis with the overall net_score",
// looked for in the HTML only. Rewriting both copies to "Also fill net_score…" passed the
// sync guard, the --assert lock and the block checks. The rule is now read out of step 8
// itself, in the canonical body AND the console builder: the step must tell the synthesis row
// to leave the three reflect-owned columns blank, say who owns them, and mention net_score
// nowhere else (the CSV header and that one sentence).
{
  const step8 = raw => { const i = raw.indexOf('8. METRICS (optional'); if (i === -1) return null; const ends = [raw.indexOf('\n```', i), raw.indexOf('`;', i)].filter(n => n !== -1); return raw.slice(i, ends.length ? Math.min(...ends) : undefined).replace(/\s+/g, ' '); };
  for (const [label, raw] of [['CLAUDE.md §6a', claudeRaw]]) {   // the console builder's copy dropped with its lock (v1.53.0)
    const s = step8(raw);
    const problems = [];
    if (s == null) problems.push('step 8 (METRICS) not found — the ownership check would be vacuous');
    else {
      if (!/Leave net_score, prod_fixes, new_failure_modes(?:,? and defensive_count)? BLANK/.test(s)) problems.push('step 8 no longer tells the synthesis row to leave net_score, prod_fixes and new_failure_modes BLANK');
      if (!/owned ONLY by the phase=reflect rows/.test(s)) problems.push('step 8 no longer says those columns are owned only by the phase=reflect rows');
      const mentions = (s.match(/net_score/g) || []).length;
      if (mentions > 2) problems.push(`step 8 mentions net_score ${mentions} times — beyond the CSV header and the leave-blank sentence, something tells the synthesis row what to do with it`);
    }
    if (problems.length) { metricsFail++; console.log(`  ✗ metrics-row ownership (Cycle-8 F43) — ${label}: ${problems.join('; ')}. net_score/prod_fixes/new_failure_modes belong to the phase=reflect row alone (P1 double-count footgun)`); }
  }
}
if (metricsFail) failures += metricsFail;
else console.log(`  ✓ Metrics-row ownership + exact CSV header parity across ${headerSources.length} source(s) (P1 + P11 + F49)`);

// ── Structural check 7 (R16): per-builder parity for the DYNAMIC console
// prompt builders. ALL NINE were gated by gen-html-prompts --assert (until v1.53.0) against
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
// v1.53.0: the console lock is retired, so the markers are read from CLAUDE.md
// only — they now pin the canonical contracts, not the console's copy of them.
let builderFail = 0;
for (const b of DYNAMIC_BUILDERS) {
  const missing = b.markers.filter(m => !contents['CLAUDE.md'].includes(m));
  if (missing.length) {
    builderFail++;
    console.log(`  ✗ ${b.name}: contract marker(s) missing from CLAUDE.md: ${missing.map(m => `"${m}"`).join(', ')}`);
  }
}
if (builderFail) failures += builderFail;
else console.log(`  ✓ ${DYNAMIC_BUILDERS.length} canonical prompt contracts carry their load-bearing markers (the console's copies are no longer held to them — v1.53.0)`);

// ── F31: the CI workflow is read as STRUCTURE, not text. Checks 8 and 14 used
// to regex the raw YAML, so three mutations passed: a step turned into
// `run: echo skipped  # node tests/x.mjs` (the comment still "ran" the stage),
// `run: node tests/mutation-audit.mjs || true` (a stage that can never fail the
// job), and `branches: [never-a-real-branch]` under pull_request (a trigger
// that never fires). Comments are stripped, each step's keys are parsed, and a
// stage counts only when its run: value is the BARE command.
function stripYamlComments(s) { return s.split(/\r?\n/).map(l => l.replace(/(^|\s)#.*$/, '')).join('\n'); }
const indentOf = l => l.match(/^ */)[0].length;
// Every `permissions:` in the workflow — block or inline — with where it sits (Cycle-8 F46).
function ciPermissionBlocks(wf) {
  const lines = stripYamlComments(wf).split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)permissions:[ \t]*(.*)$/);
    if (!m) continue;
    const ind = m[1].length, body = [m[2].trim()];
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].trim()) continue;
      if (indentOf(lines[j]) <= ind) break;
      body.push(lines[j].trim());
    }
    out.push({ level: ind === 0 ? 'workflow' : 'job-level (indent ' + ind + ')', text: body.filter(Boolean).join(', ') });
  }
  return out;
}
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
  else {
    // Cycle-8 F46: a JOB may carry its own permissions block, and a job-level block REPLACES
    // the workflow-level one for that job. Only the top-level block was read, so
    // `jobs.check.permissions: { contents: write }` (or `permissions: write-all`) passed.
    const write = ciPermissionBlocks(wf).filter(b => b.level !== 'workflow' && /write/.test(b.text));
    if (write.length) { failures++; console.log(`  ✗ CI workflow requests write permission below the workflow level (Cycle-8 F46): ${write.map(b => `${b.level} — ${b.text}`).join(' | ')}`); }
    else console.log('  ✓ CI workflow declares least-privilege permissions (contents: read) — no permissions block at any level asks for write');
  }

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
// in two places (three until v1.53.0, when the console's Setup copy left with the lock) — CLAUDE.md's "Cycle Workflow Config" template, CLAUDE.md's
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
  try { for (const f of readdirSync(new URL('.claude/commands/', root)).filter(f => f.endsWith('.md'))) sources.push([f, commandBodyOf(f), f.replace(/\.md$/, '')]); } catch (e) {}
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
  // Cycle-8 F44: the pass above only sees a write shaped like a step — an ALL-CAPS heading whose
  // body uses one of seven verbs. A bullet under "Rules:" saying "update .cycle/STATE.md after
  // each action" has no heading at all, and passed. So every SENTENCE is read as well: one that
  // writes cycle state (a write verb, then .cycle/ or one of its file names) must sit inside a
  // gated step or carry the condition itself. The read-only declaration that opens a command
  // ("Do not make any changes …, other than the optional … in step 8") grants nothing by itself.
  const TARGET = String.raw`(?:\.cycle\/|\bSTATE\.md|\bHISTORY\.md|\bmetrics\.csv|\bestimates\.csv)`;
  const VERB = String.raw`\b(?:creat(?:e|es|ed|ing)|updat(?:e|es|ed|ing)|append(?:s|ed|ing)?|writ(?:e|es|ing|ten)|wrote|increment(?:s|ed|ing)?|reset(?:s|ting)?|sav(?:e|es|ed|ing)|mov(?:e|es|ed|ing)|add(?:s|ed|ing)?|delet(?:e|es|ed|ing)|remov(?:e|es|ed|ing)|record(?:s|ed|ing)?|stor(?:e|es|ed|ing)|persist(?:s|ed|ing)?|roll(?:s|ed|ing)?|rewrit(?:e|es|ing|ten)|stamp(?:s|ed|ing)?|edit(?:s|ed|ing)?|modif(?:y|ies|ied|ying)|set(?:s|ting)?|put(?:s|ting)?|mark(?:s|ed|ing)?)\b`;
  const WRITE_SENTENCE = new RegExp(`${VERB}[^.;]{0,140}?${TARGET}`, 'i');
  const strays = [];
  let writeSentences = 0;
  for (const [label, txt, cmd] of sources) {
    if (txt == null || (cmd && EXEMPT[cmd])) continue;
    const L = txt.split('\n'), bounds = [0];
    L.forEach((l, i) => { if (i && HEAD.test(l)) bounds.push(i); });
    bounds.forEach((b, k) => {
      const gated = GATE.test(L.slice(b, b + 3).join(' '));
      const region = L.slice(b, k + 1 < bounds.length ? bounds[k + 1] : L.length).join('\n');
      for (const s of region.split(/(?<=[.;])\s+|\n\s*\n|\n\s*[-•]\s+/)) {
        const flat = s.replace(/\s+/g, ' ').trim();
        if (!WRITE_SENTENCE.test(flat) || /^do not make any changes\b/i.test(flat)) continue;
        writeSentences++;
        if (!gated && !GATE.test(flat)) strays.push(`${label}: "${flat.slice(0, 90)}${flat.length > 90 ? '…' : ''}"`);
      }
    });
  }
  const problems = [];
  if (missingSections.length) problems.push(`could not locate ${missingSections.join(', ')} — part of the scan would be vacuous`);
  if (!stepCount) problems.push('no .cycle/-writing steps found anywhere — the gating check is vacuous');
  if (!writeSentences) problems.push('no sentence that writes cycle state found anywhere — the sentence scan is vacuous');
  if (strays.length) problems.push(`an instruction writes cycle state outside a gated step (Cycle-8 F44): ${strays.join(' | ')}`);
  if (ungated.length) problems.push(`.cycle/-writing step(s) not gated on the directory existing: ${ungated.join(', ')}`);
  if (unrecognised.length) problems.push(`known .cycle/-writing step(s) no longer read as writing — the derivation lost them: ${unrecognised.join(', ')}`);
  if (problems.length) { failures++; console.log(`  ✗ ${problems.join('; ')} (INV-12/INV-18)`); }
  else console.log(`  ✓ all ${stepCount} .cycle/-writing steps — derived across the commands and the §1s/§6a bodies (${[...kinds].join(', ')}) — are gated on .cycle/ existing, and all ${writeSentences} sentences that write cycle state sit inside one; exempt by design: ${Object.keys(EXEMPT).join(', ')} (INV-12/INV-18)`);
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
// The ceiling is VERSION. The FLOOR is derived, never hard-coded, so the rule
// does not reach back into cycles that predate the convention:
//   F7 (Cycle 8): it is the first release AFTER the newest version any EARLIER
//   cycle has a block for. It used to be "the lowest version this cycle already
//   has a block for" — so a cycle with no block yet had no floor and the check
//   was skipped, and a floor taken from the cycle's own blocks can never sit
//   below its first block. The first release(s) of every cycle were unguarded:
//   exactly the v1.30.1 case, whenever it opened a cycle. This cycle's own
//   lowest block is kept only as a fallback for a project's first blocked cycle.
{
  const semver = v => v.split('.').map(Number);
  const cmp = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
  let stateRaw = null, blockNames = [];
  try { stateRaw = readFileSync(new URL('.cycle/STATE.md', root), 'utf8'); } catch (e) {}
  try { blockNames = readdirSync(new URL('.cycle/blocks', root)); } catch (e) {}
  const cycle = stateRaw && (stateRaw.match(/^Cycle:\s*(\d+)/m) || [])[1];
  const versioned = blockNames
    .map(n => n.match(/^0*(\d+)-(\d+\.\d+\.\d+)-/)).filter(Boolean)
    .map(m => ({ cycle: Number(m[1]), v: m[2] }));
  const blocked = versioned.filter(x => x.cycle === Number(cycle)).map(x => x.v).sort(cmp);
  const earlier = versioned.filter(x => x.cycle < Number(cycle)).map(x => x.v).sort(cmp);
  const released = [...changelogRaw.matchAll(/^##\s+(\d+\.\d+\.\d+)\b/gm)].map(m => m[1]).sort(cmp);
  const upTo = v => !versionRaw || cmp(v, versionRaw) <= 0;
  if (!stateRaw || !cycle) console.log('  · no .cycle/STATE.md cycle number — release-block coverage skipped (optional per project)');
  else if (!earlier.length && !blocked.length) console.log('  · no versioned blocks in .cycle/blocks/ yet — release-block coverage skipped (nothing to derive a floor from)');
  else {
    const prevMax = earlier.length ? earlier[earlier.length - 1] : null;
    const afterPrev = prevMax ? released.find(v => cmp(v, prevMax) > 0 && upTo(v)) : null;
    const floor = [afterPrev, blocked[0]].filter(Boolean).sort(cmp)[0] || null;
    if (!floor) console.log(`  ✓ cycle ${cycle} has shipped no release yet — nothing after ${prevMax}, the last release an earlier cycle has a block for (INV-72)`);
    else {
      const inCycle = released.filter(v => cmp(v, floor) >= 0 && upTo(v));
      const orphans = inCycle.filter(v => !blocked.includes(v));
      if (orphans.length) {
        failures++;
        console.log(`  ✗ release with no block (INV-72): cycle ${cycle} shipped ${orphans.join(', ')} with nothing in .cycle/blocks/${prevMax ? ` (every release after ${prevMax}, the last one an earlier cycle has a block for, belongs to this cycle)` : ''}. §4v and §6a read that directory and nothing else, so those releases are invisible to verification and synthesis. Write the summary block to .cycle/blocks/${String(cycle).padStart(2, '0')}-<version>-<command>.md.`);
      } else console.log(`  ✓ every cycle-${cycle} release from ${floor} to ${versionRaw || blocked[blocked.length - 1]} has a block in .cycle/blocks/ — ${inCycle.length} release(s) (INV-72)`);
    }
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
    // Cycle-8 F45: "both fields appear somewhere in the section" let a clause stop reading its
    // field while another kept the name alive. Each clause is tied to the field it turns on.
    // (SHARP DROP is the one fixed magnitude, by design.)
    const clauseText = letter => { const m = body.match(new RegExp('^\\(' + letter + '\\) [\\s\\S]*?(?=^\\([a-z]\\) |^\\s*$)', 'm')); return m ? m[0] : ''; };
    for (const [letter, name, field] of [['a', 'DECLINE', '`Consecutive cycles`'], ['c', 'PERSISTENT LAGGARD', '`Consecutive cycles`'], ['d', 'ABSOLUTE FLOOR', '`Policy threshold`']])
      if (body.includes('(' + letter + ') ' + name) && !clauseText(letter).includes(field)) problems.push(`the ${name} clause no longer reads ${field} — its number would be a literal in the prompt`);
  }
  // The regression to guard against: a literal floor back in the prose. One spelling was
  // matched ("≤N/10 for N consecutive"), in the canonical body only — "at or below 5/10 for
  // two cycles running" passed (F45). Now: any sentence, in CLAUDE.md, the README or a command
  // file, that carries a literal N/10 score AND a count of cycles. The config's own
  // `Policy threshold: N/10` line is where the number belongs and is left out. The console is
  // not scanned: it is a frozen subsystem and its Best Practices tip still states the retired
  // floor (Cycle-8 F39, dropped with the freeze).
  {
    const SCORE = /(?<![\w[X.])\d+(?:\.\d+)?\s*\/\s*10\b/;
    const COUNT = /\b(?:\d+|two|three|four|five)\s+(?:consecutive\s+|straight\s+|successive\s+)?(?:synthesis\s+)?cycles?\b(?!\s+since)|\bcycles?\s+(?:running|in a row|straight)\b|\bconsecutive(?:ly)?\b/i;
    const prose = [['CLAUDE.md', claudeRaw], ['README.md', readmeRaw]];
    try { for (const f of readdirSync(new URL('.claude/commands/', root)).filter(f => f.endsWith('.md'))) prose.push([f, commandBodyOf(f)]); } catch (e) {}
    const floors = [];
    for (const [label, raw] of prose) {
      const text = raw.split('\n').filter(l => !/^\s*Policy threshold:/.test(l)).join('\n');
      for (const s of text.split(/(?<=[.;])\s+|\n\s*\n|\n\s*[-•*]\s+/)) {
        const flat = s.replace(/\s+/g, ' ').trim();
        if (SCORE.test(flat) && COUNT.test(flat)) floors.push(`${label}: "${flat.slice(0, 100)}${flat.length > 100 ? '…' : ''}"`);
      }
    }
    if (floors.length) problems.push(`a hardcoded policy floor is written into the prose (Cycle-8 F45) — ${[...new Set(floors)].join(' | ')} — the config field would be decorative again`);
  }
  if (problems.length) {
    failures++;
    console.log(`  ✗ relative policy trigger (INV-75): ${problems.join('; ')}. A fixed floor never fires on a healthy project — the primary trigger must be relative.`);
  } else console.log('  ✓ the §6a policy trigger is relative and parameterised — four clauses, each tied to its config field, no hardcoded floor in CLAUDE.md, the README or any command (INV-75)');
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
    const body = commandBodyOf(f);
    const deleg = body.match(/\bsee\s+`?\/[a-z][\w-]*`?\s+step\b/i);
    if (deleg) problems.push(`${f} delegates to another command (${JSON.stringify(deleg[0])})`);
    for (const m of body.matchAll(/\bscripts\/[\w.-]+/g)) {
      const before = body.slice(Math.max(0, m.index - 160), m.index).replace(/\s+/g, ' ');
      if (!/if the project has|where the project uses/i.test(before)) problems.push(`${f} names ${m[0]} unconditionally — a project that copied only .claude/commands/ may not have it`);
    }
  }
  // Cycle-8 E2: a command that INCLUDES a canonical section must carry that section's whole body.
  // gen-commands --check compares a file with the generator's own output, so a generator that left
  // the marker in place, or expanded it to nothing, would agree with itself. Measured here against
  // CLAUDE.md directly, with a separate extraction.
  let included = 0;
  for (const m of claudeRaw.matchAll(/^### \/([a-z0-9-]+)\n+```\n([\s\S]*?)\n```/gm)) {
    for (const inc of m[2].matchAll(/^\{\{include: (.+)\}\}$/gm)) {
      included++;
      const heading = inc[1].trim();
      const at = claudeRaw.indexOf('### ' + heading + '\n');
      const open = at === -1 ? -1 : claudeRaw.indexOf('```\n', at);
      const body = open === -1 ? null : claudeRaw.slice(open + 4, claudeRaw.indexOf('\n```', open + 4)).trim();
      let file = null;
      try { file = commandBodyOf(m[1] + '.md'); } catch (e) {}
      if (body == null || !body) problems.push(`/${m[1]} includes "${heading}", which has no fenced body in CLAUDE.md`);
      else if (file == null) problems.push(`/${m[1]} includes "${heading}" but has no command file`);
      else if (!file.includes(body)) problems.push(`${m[1]}.md does not carry the body of "${heading}" — a command that includes a section must hold its full text`);
    }
  }
  for (const f of files) {
    if (/^\{\{include: /m.test(commandBodyOf(f))) problems.push(`${f} still contains an unexpanded include marker`);
  }
  if (!files.length) { failures++; console.log('  ✗ standalone commands (F11): no .claude/commands/*.md found — the check would be vacuous'); }
  else if (problems.length) { failures++; console.log(`  ✗ standalone commands (F11): ${problems.join('; ')}`); }
  else console.log(`  ✓ every command file stands alone — no cross-command step delegation, every scripts/ mention conditional, ${included} included section bod${included === 1 ? 'y' : 'ies'} carried in full (${files.length} files, F11)`);
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

// ── Structural check 19 (Cycle-8 F1/F4/F5/F12; INV-65): the cycle LIFECYCLE is
// closed. STATE.md's Phase field is read by /cycle-status, /cycle-resume and the
// portfolio board to pick the next action, so it has to be a state machine and
// not a suggestion. Until v1.47.0 the template offered seven values, commands
// set three of them, and nothing ever returned the field to "idle" — a finished
// cycle read "in progress" until someone edited it by hand. Three properties,
// all derived from the text:
//   (a) every Phase value the template offers is SET by some step, and no step
//       sets a value the template does not offer (/cycle-init only seeds it);
//   (b) the step that opens a cycle is the same text in every audit that has
//       one — it decides whether the number moves, so two wordings are two
//       numbering rules;
//   (c) every implement CHECKPOINT that writes a block also rolls the previous
//       cycle's STATE sections and refuses to overwrite a block;
//   (d) invariant candidates have an OWNER (F6): the command /reflect names as
//       proposing their promotion exists and has a step that does it. /reflect
//       minted INV-76…82 in Cycle 7 and no command was responsible for what
//       happened to them next.
{
  const tmpl = claudeRaw.match(/`\.cycle\/STATE\.md` template:\s*\n+```\n([\s\S]*?)\n```/);
  const phaseLine = tmpl ? tmpl[1].match(/^Phase: \[([^\]\n]+)\]/m) : null;
  const offered = phaseLine ? phaseLine[1].split('—')[0].split('|').map(v => v.trim().toLowerCase()).filter(Boolean) : [];
  const fenced = h => { const i = claudeRaw.indexOf('### ' + h + '\n'); if (i === -1) return null; const a = claudeRaw.indexOf('```\n', i); return a === -1 ? null : claudeRaw.slice(a + 4, claudeRaw.indexOf('\n```', a + 4)); };
  const sources = [];
  try { for (const f of readdirSync(new URL('.claude/commands/', root)).filter(f => f.endsWith('.md'))) sources.push([f.replace(/\.md$/, ''), commandBodyOf(f)]); } catch (e) {}
  const commandCount = sources.length;
  sources.push(['§6a', fenced('Health Synthesis (Section 6a in HTML tool)') || ''], ['§1s', fenced('Seams & Invariants Audit (Section 1s in HTML tool)') || '']);
  const problems = [];
  if (!offered.length) problems.push('could not read the Phase values from the STATE.md template — the lifecycle check would be vacuous');
  if (!commandCount) problems.push('no command files found — the lifecycle check would be vacuous');

  // (a) who sets what
  const setters = new Map();
  for (const [name, txt] of sources) {
    if (name === 'cycle-init') continue;
    for (const m of txt.replace(/\s+/g, ' ').matchAll(/\bsets? Phase: ([a-z]+)/gi)) {
      const v = m[1].toLowerCase();
      if (!setters.has(v)) setters.set(v, new Set());
      setters.get(v).add(name);
    }
  }
  const unset = offered.filter(v => !setters.has(v));
  const unoffered = [...setters.keys()].filter(v => !offered.includes(v));
  if (unset.length) problems.push(`the STATE template offers Phase value(s) no step sets: ${unset.join(', ')} — a phase nothing writes is never reached, and one nothing leaves sticks`);
  if (unoffered.length) problems.push(`a step sets a Phase value the STATE template does not offer: ${unoffered.map(v => `${v} (${[...setters.get(v)].join(', ')})`).join('; ')}`);

  // (b) one CYCLE OPEN text
  const openStep = txt => { const m = txt.match(/^CYCLE OPEN \([\s\S]*?^Skip if \.cycle\/STATE\.md does not exist\.$/m); return m ? m[0].replace(/\s+/g, ' ') : null; };
  const openers = sources.filter(([, txt]) => /^CYCLE OPEN \(/m.test(txt)).map(([name, txt]) => [name, openStep(txt)]);
  const AUDITS = ['broad-scan', 'audit', 'targeted-audit'];
  const noOpen = AUDITS.filter(a => !openers.some(([n]) => n === a));
  if (commandCount && noOpen.length) problems.push(`audit command(s) with no CYCLE OPEN step: ${noOpen.join(', ')} — that audit cannot open a cycle`);
  const unreadable = openers.filter(([, t]) => t == null).map(([n]) => n);
  if (unreadable.length) problems.push(`CYCLE OPEN step has no closing "Skip if .cycle/STATE.md does not exist." line in: ${unreadable.join(', ')}`);
  const texts = [...new Set(openers.map(([, t]) => t).filter(Boolean))];
  if (texts.length > 1) problems.push(`the CYCLE OPEN step differs between ${openers.map(([n]) => n).join(', ')} — one cycle-numbering rule, one text`);

  // (c) every block-writing CHECKPOINT rolls and never overwrites
  const checkpointers = sources.filter(([, txt]) => /CHECKPOINT \(optional/.test(txt) && /\.cycle\/blocks\/<cycle>-/.test(txt));
  const noRoll = checkpointers.filter(([, txt]) => !/\.cycle\/HISTORY\.md/.test(txt)).map(([n]) => n);
  const clobber = checkpointers.filter(([, txt]) => !/Never overwrite a block/.test(txt)).map(([n]) => n);
  if (commandCount && checkpointers.length < 3) problems.push(`only ${checkpointers.length} block-writing CHECKPOINT step(s) found — expected the three implement commands`);
  if (noRoll.length) problems.push(`CHECKPOINT does not roll the previous cycle's STATE sections into .cycle/HISTORY.md: ${noRoll.join(', ')}`);
  if (clobber.length) problems.push(`CHECKPOINT may overwrite an existing block: ${clobber.join(', ')}`);

  // (d) candidates are handed to a command that takes them
  const reflectTxt = (sources.find(([n]) => n === 'reflect') || [, ''])[1].replace(/\s+/g, ' ');
  const owner = (reflectTxt.match(/\/([a-z-]+) proposes their promotion/) || [])[1];
  const ownerTxt = owner ? (sources.find(([n]) => n === owner) || [, null])[1] : null;
  if (commandCount && !owner) problems.push('/reflect assigns invariant candidate IDs and names no command that proposes their promotion — candidates have no owner');
  else if (owner && (ownerTxt == null || !/Invariant candidates/.test(ownerTxt) || !/Invariant Library/.test(ownerTxt))) problems.push(`/reflect hands invariant candidates to /${owner}, which has no step that proposes adding them to the Invariant Library`);

  if (problems.length) { failures++; console.log(`  ✗ cycle lifecycle (Cycle-8 F1): ${problems.join('; ')}`); }
  else console.log(`  ✓ the cycle lifecycle is closed — ${offered.length} Phase values, each set by a step (${offered.map(v => `${v}: ${[...setters.get(v)].join('/')}`).join('; ')}); one CYCLE OPEN text across ${openers.length} audits; ${checkpointers.length} CHECKPOINTs roll STATE and never overwrite a block; invariant candidates go to /${owner} (Cycle-8 F1)`);
}

// ── Structural check 20 (Cycle-8 F8): every command is listed by what it does.
// The generated files had no frontmatter, so the picker showed each command's
// first body line — for a third of them "If $ARGUMENTS is empty or missing…",
// which tells an operator choosing a command nothing. gen-commands.mjs now
// writes a description (and an argument hint) from the Command Index table in
// CLAUDE.md. gen --check compares each file with the generator's own output, so
// a generator that dropped the block would agree with itself; this reads the
// table and the files separately:
//   (a) every command file opens with frontmatter whose description is its
//       Command Index row, and carries no key this check does not know;
//   (b) a file has an argument hint exactly when its body reads $ARGUMENTS;
//   (c) no two commands share a description, and none is the body's first line;
//   (d) the README's command table says the same thing — one wording, two
//       places, held equal rather than left to drift.
{
  const problems = [];
  const sec = claudeRaw.match(/\n## Command Index\n([\s\S]*?)(?=\n## |$)/);
  const index = new Map();
  if (sec) for (const m of sec[1].matchAll(/^\| `\/([a-z0-9-]+)` \| (.*?) \| (.*?) \|$/gm)) index.set(m[1], { description: m[2].replace(/`/g, '').trim(), hint: /^(?:—|-|)$/.test(m[3].trim()) ? '' : m[3].replace(/`/g, '').trim() });
  let files = [];
  try { files = readdirSync(new URL('.claude/commands/', root)).filter(f => f.endsWith('.md')); } catch (e) {}
  if (!index.size) problems.push('CLAUDE.md has no readable "## Command Index" table — the check would be vacuous');
  if (!files.length) problems.push('no command files found — the check would be vacuous');
  const quoted = (front, key) => { const m = front.match(new RegExp('^' + key + ': (".*")$', 'm')); if (!m) return null; try { return JSON.parse(m[1]); } catch (e) { return undefined; } };
  const seen = new Map();
  for (const f of index.size ? files : []) {
    const name = f.replace(/\.md$/, ''), row = index.get(name);
    const { front, body } = splitCommandFile(readFileSync(new URL('.claude/commands/' + f, root), 'utf8'));
    if (!row) { problems.push(`${f} has no Command Index row`); continue; }
    if (front == null) { problems.push(`${f} has no frontmatter description — the picker would show its first body line`); continue; }
    const extra = front.split('\n').filter(l => l.trim() && !/^(?:description|argument-hint): /.test(l));
    if (extra.length) problems.push(`${f} frontmatter carries a line this check does not know (${JSON.stringify(extra[0].slice(0, 40))})`);
    const description = quoted(front, 'description'), hint = quoted(front, 'argument-hint');
    if (!description) problems.push(`${f} has no frontmatter description — the picker would show its first body line`);
    else if (description !== row.description) problems.push(`${f} is described as ${JSON.stringify(description)} but its Command Index row says ${JSON.stringify(row.description)}`);
    else if (description === (body.split('\n').find(l => l.trim()) || '').trim()) problems.push(`${f} is described by its own first body line`);
    if (description) { if (seen.has(description)) problems.push(`${f} and ${seen.get(description)} share one description`); else seen.set(description, f); }
    const takesArgs = /\$ARGUMENTS/.test(body);
    if (takesArgs && !hint) problems.push(`${f} reads $ARGUMENTS and carries no argument hint`);
    else if (!takesArgs && hint) problems.push(`${f} carries an argument hint and never reads $ARGUMENTS`);
    else if (hint && hint !== row.hint) problems.push(`${f} hints its arguments as ${JSON.stringify(hint)} but its Command Index row says ${JSON.stringify(row.hint)}`);
  }
  for (const name of index.keys()) if (!files.includes(name + '.md')) problems.push(`the Command Index lists /${name}, which has no command file`);
  // (e) A description is a label and the prose scans above do not read it — so the one rule of
  // theirs that applies to a label is held here: it names no scripts/ helper (check 17 allows a
  // body to name one conditionally; a one-line label has no room for the condition). A label MAY
  // describe a write to .cycle/ — /cycle-init and /cycle-close do — which is why check 10 is not
  // run over it.
  for (const [name, row] of index) {
    const script = (row.description + ' ' + row.hint).match(/\bscripts\/[\w.-]+/);
    if (script) problems.push(`the Command Index describes /${name} with a scripts/ path (${script[0]}) — a project that copied only the commands may not have it`);
  }
  // (d) the README table
  const readmeRows = new Map([...readmeRaw.matchAll(/^\| `\/([a-z0-9-]+)` \|[^|\n]*\|[^|\n]*\| (.*?) \|$/gm)].map(m => [m[1], m[2].replace(/`/g, '').trim()]));
  if (index.size && !readmeRows.size) problems.push('the README has no readable command table — its descriptions would go unchecked');
  for (const [name, row] of index) {
    if (!readmeRows.size) break;
    if (!readmeRows.has(name)) problems.push(`the README command table has no row for /${name}`);
    else if (readmeRows.get(name) !== row.description) problems.push(`the README lists /${name} as ${JSON.stringify(readmeRows.get(name))} but the Command Index says ${JSON.stringify(row.description)}`);
  }
  if (problems.length) { failures++; console.log(`  ✗ command descriptions (Cycle-8 F8): ${problems.join('; ')}`); }
  else console.log(`  ✓ every command is listed by what it does — ${files.length} files open with their Command Index description, an argument hint exactly where the body reads $ARGUMENTS (${[...index.values()].filter(r => r.hint).length}), and the README table says the same (F8)`);
}

// ── Structural check 21 (Cycle-8 follow-on to F9): the roadmap does not
// contradict the cycle it is read in. ROADMAP.md said "queued for Cycle 7"
// through Cycle 8 and named two finished items as its one strategic bet, and
// nothing failed. Most of a roadmap is judgment and stays with /sync-docs'
// roadmap-currency check; two things are mechanical:
//   (a) an item not marked done or dropped must not still be "queued for
//       Cycle N" once the project's Cycle (.cycle/STATE.md) has passed N —
//       past tense ("was queued for") is history and is left alone;
//   (b) the "Current bet:" line under the strategic-bet heading names only
//       items that are still open, or says none is chosen.
// Skipped when the project keeps no ROADMAP.md; (a) needs .cycle/STATE.md.
{
  let roadmap = null, state = null;
  try { roadmap = readFileSync(new URL('ROADMAP.md', root), 'utf8'); } catch (e) {}
  try { state = readFileSync(new URL('.cycle/STATE.md', root), 'utf8'); } catch (e) {}
  if (roadmap == null) console.log('  ✓ roadmap currency skipped — this project keeps no ROADMAP.md');
  else {
    const problems = [];
    const L = roadmap.split('\n');
    const items = [];
    L.forEach((l, i) => {
      const m = l.match(/^- \*\*(R\d+) — /);
      if (m) items.push({ id: m[1], start: i, closed: /✅ DONE|✗ DROPPED/.test(l) });
    });
    items.forEach((it, k) => {
      let end = k + 1 < items.length ? items[k + 1].start : L.length;
      for (let j = it.start + 1; j < end; j++) if (/^## /.test(L[j])) { end = j; break; }
      it.text = L.slice(it.start, end).join(' ').replace(/\s+/g, ' ');
    });
    if (!items.length) problems.push('no "- **R<n> — …" items found — the check would be vacuous');
    const dup = items.map(i => i.id).filter((id, k, a) => a.indexOf(id) !== k);
    if (dup.length) problems.push(`item ID used twice: ${[...new Set(dup)].join(', ')}`);
    // (a)
    const cycle = state ? Number((state.match(/^Cycle:\s*(\d+)/m) || [])[1]) : NaN;
    if (Number.isFinite(cycle)) for (const it of items.filter(i => !i.closed)) {
      for (const m of it.text.matchAll(/(?<!\b(?:was|were|been) )queued for Cycle (\d+)/gi)) {
        if (Number(m[1]) < cycle) problems.push(`${it.id} is still "queued for Cycle ${m[1]}" and the project is on Cycle ${cycle} — mark it done, re-queue it, or say what happened`);
      }
    }
    // (b)
    const betAt = L.findIndex(l => /^## The one strategic bet\s*$/.test(l));
    const betLine = betAt === -1 ? null : L.slice(betAt + 1).find(l => /^\*\*Current bet:\*\*/.test(l));
    if (betAt === -1) problems.push('no "## The one strategic bet" section');
    else if (betLine == null) problems.push('the strategic-bet section has no "**Current bet:**" line — nothing states what the bet is');
    else {
      const named = [...betLine.matchAll(/\bR\d+\b/g)].map(m => m[0]);
      if (!named.length && !/\bnone\b/i.test(betLine)) problems.push('the "Current bet:" line names no item and does not say none is chosen');
      for (const id of named) {
        const it = items.find(i => i.id === id);
        if (!it) problems.push(`the strategic bet names ${id}, which is not an item in the roadmap`);
        else if (it.closed) problems.push(`the strategic bet names ${id}, which is marked done or dropped`);
      }
    }
    if (problems.length) { failures++; console.log(`  ✗ roadmap currency (Cycle-8 F9): ${problems.join('; ')}`); }
    else console.log(`  ✓ the roadmap does not contradict the cycle — ${items.length} items (${items.filter(i => !i.closed).length} open), none queued for a cycle that has run${Number.isFinite(cycle) ? '' : ' (not checked: no .cycle/STATE.md)'}, and the stated bet names only open items (F9)`);
  }
}

// ── Structural check 22 (v1.52.0; INV-90): every follow-on item is TRACKED to a
// disposition. Until v1.52.0 a follow-on was a free-text bullet: the implement
// commands printed it, the CHECKPOINT copied it into STATE.md, /cycle-close kept
// whatever was "still live", and no command ever acted on one. This repo's
// STATE.md held 22 — one already done, one a regression no count included. The
// rule is now one FOLLOW-ON IDS text in every command that reports follow-ons,
// and one FOLLOW-ON REVIEW text in every audit. Each copy's CONTENT is asserted,
// not only that the copies agree: Cycle-8 §4v found three fixes whose rule could
// be deleted from every copy at once because a check proved identity alone.
//   (a) the reporters are DERIVED — a body with a FOLLOW-ON ITEMS field, a
//       FOLLOW-ON AUDIT ITEMS block, or "record it as a follow-on item" — and
//       each carries the FOLLOW-ON IDS rule, one text;
//   (b) that rule names the ID shape, all five dispositions, refuses "noted",
//       and records open items in STATE.md and removes finished ones;
//   (c) each reporter's item placeholder is an FO ID plus the disposition list;
//   (d) every audit with a CYCLE OPEN step carries the FOLLOW-ON REVIEW step,
//       one text, with its three outcomes and the lead-not-finding rule;
//   (e) /broad-implement takes FO items by ID; /cycle-close owes a new
//       disposition for any left "this cycle"; the STATE template shows the line;
//   (f) the LIVE .cycle/STATE.md: every item under "Open follow-on items" has a
//       unique FO ID and an open disposition (skipped with no .cycle/STATE.md).
{
  const problems = [];
  const flat = t => t.replace(/\s+/g, ' ').trim();
  const DISPOSITIONS = ['this cycle —', 'next audit —', 'roadmap —', 'decision —', "won't do (reason) —"];
  const ITEM_DISP = "→ [this cycle | next audit | roadmap | decision | won't do (reason)]";
  let files = [];
  try { files = readdirSync(new URL('.claude/commands/', root)).filter(f => f.endsWith('.md')); } catch (e) {}
  const bodies = new Map(files.map(f => [f.replace(/\.md$/, ''), commandBodyOf(f)]));
  const idsRule = t => { const m = t.match(/^FOLLOW-ON IDS \([\s\S]*?finding this session implemented\.$/m); return m ? flat(m[0]) : null; };
  const reviewStep = t => { const m = t.match(/^FOLLOW-ON REVIEW \([\s\S]*?^to close\. Skip this step if \.cycle\/STATE\.md does not exist\.$/m) || t.match(/^FOLLOW-ON REVIEW \([\s\S]*?Skip this step if \.cycle\/STATE\.md does not exist\./m); return m ? flat(m[0]) : null; };
  // (a)
  const reporters = [...bodies].filter(([, b]) => /^FOLLOW-ON ITEMS/m.test(b) || /^---FOLLOW-ON AUDIT ITEMS---$/m.test(b) || /record it as a follow-on item/.test(b)).map(([n]) => n);
  if (reporters.length < 4) problems.push(`only ${reporters.length} command(s) read as reporting follow-on items (${reporters.join(', ') || 'none'}) — the derivation would be vacuous`);
  const rules = reporters.map(n => [n, idsRule(bodies.get(n))]);
  const noRule = rules.filter(([, r]) => !r).map(([n]) => n);
  if (noRule.length) problems.push(`reports follow-on items with no FOLLOW-ON IDS rule: ${noRule.join(', ')} — its items get no ID and no disposition`);
  if (new Set(rules.map(([, r]) => r).filter(Boolean)).size > 1) problems.push(`the FOLLOW-ON IDS rule differs between ${rules.filter(([, r]) => r).map(([n]) => n).join(', ')} — one numbering and disposition rule, one text`);
  // (b)
  for (const [n, r] of rules) {
    if (!r) continue;
    const lacks = [];
    if (!r.includes('FO-<cycle>-<n>')) lacks.push('the FO-<cycle>-<n> ID');
    for (const d of DISPOSITIONS) if (!r.includes(d)) lacks.push(`the "${d.replace(' —', '')}" disposition`);
    if (!/"Noted" is not a disposition/.test(r)) lacks.push('the refusal of "noted"');
    if (!/to the "Open follow-on items" in \.cycle\/STATE\.md/.test(r)) lacks.push('the STATE.md record');
    if (!/remove each open item this session finished or closed/.test(r)) lacks.push('removing finished items');
    if (lacks.length) problems.push(`${n}'s FOLLOW-ON IDS rule lacks ${lacks.join(', ')}`);
  }
  // (c)
  for (const n of reporters) {
    const b = bodies.get(n);
    if (!/^FOLLOW-ON ITEMS|^---FOLLOW-ON AUDIT ITEMS---$/m.test(b)) continue;   // /cycle-resume emits the implement command's block
    const line = (b.match(/^(?:FOLLOW-ON ITEMS[^\n]*|---FOLLOW-ON AUDIT ITEMS---)\n(- [^\n]*)/m) || [])[1] || '';
    if (!line.startsWith('- FO-[cycle]-[n] | ') || !line.endsWith(ITEM_DISP)) problems.push(`${n}'s follow-on item line is not an FO ID plus the disposition list (${JSON.stringify(line.slice(0, 60))})`);
  }
  // (d)
  const auditors = [...bodies].filter(([, b]) => /^CYCLE OPEN \(/m.test(b)).map(([n]) => n);
  const reviews = auditors.map(n => [n, reviewStep(bodies.get(n))]);
  const noReview = reviews.filter(([, r]) => !r).map(([n]) => n);
  if (noReview.length) problems.push(`audit(s) with a CYCLE OPEN step and no FOLLOW-ON REVIEW step: ${noReview.join(', ')} — "next audit" items would never be re-checked`);
  if (new Set(reviews.map(([, r]) => r).filter(Boolean)).size > 1) problems.push(`the FOLLOW-ON REVIEW step differs between ${reviews.filter(([, r]) => r).map(([n]) => n).join(', ')}`);
  for (const [n, r] of reviews) {
    if (!r) continue;
    const lacks = ['marked "next audit"', 'is a LEAD, not a finding', '- confirmed:', '- already fixed:', '- still open:', 'confirmed as <finding ID>', 'to .cycle/HISTORY.md with what you checked'].filter(p => !r.includes(p));
    if (lacks.length) problems.push(`${n}'s FOLLOW-ON REVIEW lacks ${lacks.map(p => JSON.stringify(p)).join(', ')}`);
  }
  // (e)
  if (!/^- FO-<cycle>-<n> items \(follow-on items/m.test(bodies.get('broad-implement') || '')) problems.push('/broad-implement does not take FO items by ID — a "this cycle" disposition would have no command');
  const close = flat(bodies.get('cycle-close') || '');
  if (!close.includes('Follow-on items — every line under "Open follow-on items"') || !close.includes('marked "this cycle" is OWED')) problems.push('/cycle-close does not check follow-on dispositions — an item marked "this cycle" would outlive its cycle');
  const tmpl = (claudeRaw.match(/`\.cycle\/STATE\.md` template:\s*\n+```\n([\s\S]*?)\n```/) || [])[1] || '';
  if (!/^## Open follow-on items\n- FO-\[cycle\]-\[n\] \| .* \| → \[this cycle \| next audit \| roadmap \| decision \| confirmed as /m.test(tmpl)) problems.push('the STATE.md template\'s follow-on line does not show an FO ID and the open dispositions');
  // (f)
  let state = null, open = [];
  try { state = readFileSync(new URL('.cycle/STATE.md', root), 'utf8'); } catch (e) {}
  if (state != null) {
    const sec = state.match(/\n## Open follow-on items\n([\s\S]*?)(?=\n## |$)/);
    if (!sec) problems.push('.cycle/STATE.md has no "## Open follow-on items" section');
    else {
      const items = [];
      for (const l of sec[1].split('\n')) {
        if (!l.trim()) continue;
        if (l.startsWith('- ')) items.push(l);
        else if (/^\s+\S/.test(l) && items.length) items[items.length - 1] += ' ' + l.trim();
        else if (!/^\(?none\)?\.?$/i.test(l.trim())) problems.push(`.cycle/STATE.md: a line under "Open follow-on items" that is not an item: ${JSON.stringify(l.slice(0, 60))}`);
      }
      const seen = new Set();
      for (const it of items) {
        const m = it.match(/^- (FO-\d+-\d+) \| .+ \| → (this cycle|next audit|roadmap|decision|confirmed as \S.*)$/);
        if (!m) { problems.push(`.cycle/STATE.md: follow-on item with no FO ID or no open disposition: ${JSON.stringify(it.slice(0, 70))}`); continue; }
        if (seen.has(m[1])) problems.push(`.cycle/STATE.md: ${m[1]} is used twice`);
        seen.add(m[1]); open.push(m[2].split(' ')[0]);
      }
    }
  }
  if (problems.length) { failures++; console.log(`  ✗ follow-on tracking (v1.52.0): ${problems.join('; ')}`); }
  else console.log(`  ✓ every follow-on item is tracked to a disposition — ${reporters.length} reporting commands share one FOLLOW-ON IDS rule, ${auditors.length} audits one FOLLOW-ON REVIEW step${state != null ? `, and ${open.length} open item(s) in .cycle/STATE.md each carry an FO ID and an open disposition` : ' (live STATE not checked: no .cycle/STATE.md)'} (INV-90)`);
}

// ── Structural check 23 (v1.53.0; INV-86, INV-87, INV-88): the CONTENT of the
// cycle-lifecycle rules Cycle 8 fixed. Check 19 proves the CYCLE OPEN step is
// one text across the audits and that each Phase value has a writer — not what
// the text says. Cycle-8 §4v deleted F4's report, F5's 7-day bound and F6's
// numbering source from every copy at once and only the console's --assert lock
// noticed; v1.53.0 retires that lock, so the rules are asserted here, per copy.
{
  const flat = t => (t || '').replace(/\s+/g, ' ');
  let files = [];
  try { files = readdirSync(new URL('.claude/commands/', root)).filter(f => f.endsWith('.md')); } catch (e) {}
  const bodies = new Map(files.map(f => [f.replace(/\.md$/, ''), flat(commandBodyOf(f))]));
  const fenced = h => { const i = claudeRaw.indexOf('### ' + h + '\n'); if (i === -1) return null; const a = claudeRaw.indexOf('```\n', i); return a === -1 ? null : claudeRaw.slice(a + 4, claudeRaw.indexOf('\n```', a + 4)); };
  const report = (label, inv, problems, okText, ver = 'v1.53.0') => {
    if (problems.length) { failures++; console.log(`  ✗ ${label} (${ver}, ${inv}): ${problems.join('; ')}`); }
    else console.log(`  ✓ ${okText} (${inv})`);
  };
  // INV-86 — CYCLE OPEN content, in every audit that has the step
  {
    const RULES = [
      ['the 7-day same-round bound (F5)', 'Phase is already "audit" and Updated is within the last 7 days'],
      ['an old "Phase: audit" not holding the number (F5)', 'An older "Phase: audit" is an audit that led to no implementation; it does not hold the number — increment past it.'],
      ['the Scope marker over another cycle\'s sections (F5)', 'end the Scope line with "(sections below still describe Cycle N)"'],
      ['the reflected-but-unsynthesized report (F4)', 'was reflected but never verified or synthesized'],
      ['the request by cycle number (F4)', 'its verification inputs must now be requested for cycle N by number'],
    ];
    const problems = [];
    const openers = [...bodies].filter(([, b]) => /CYCLE OPEN \(optional/.test(b));
    if (openers.length < 3) problems.push(`only ${openers.length} command(s) carry a CYCLE OPEN step — the check would be vacuous`);
    for (const [n, b] of openers) {
      const step = (b.match(/CYCLE OPEN \(optional[\s\S]*?Skip if \.cycle\/STATE\.md does not exist\./) || [''])[0];
      const lacks = RULES.filter(([, p]) => !step.includes(p)).map(([l]) => l);
      if (lacks.length) problems.push(`${n}'s CYCLE OPEN lacks ${lacks.join(', ')}`);
    }
    report('CYCLE OPEN content', 'INV-86', problems, `every CYCLE OPEN step carries its five rules — the 7-day round, an old audit not holding the number, the Scope marker, the unsynthesized-cycle report and the request by number — in ${openers.length} audits`);
  }
  // INV-87 — §6a step 8 sets idle only for the cycle it synthesized
  {
    const problems = [];
    const copies = [['§6a body', fenced('Health Synthesis (Section 6a in HTML tool)')], ['health-synthesis.md', bodies.get('health-synthesis')]];
    for (const [n, t] of copies) {
      const f = flat(t);
      if (!f) { problems.push(`${n} not found`); continue; }
      if (!f.includes("set Phase: idle and Updated in .cycle/STATE.md — a synthesized cycle is closed — but only if STATE.md's Cycle is the cycle you synthesized")) problems.push(`${n}'s step 8 does not limit Phase: idle to the cycle it synthesized`);
      if (!f.includes('If an audit has already opened a later cycle, leave Phase alone and say so.')) problems.push(`${n}'s step 8 does not leave a later cycle's Phase alone`);
    }
    report('conditional idle', 'INV-87', problems, 'Health Synthesis sets Phase: idle only when STATE.md\'s Cycle is the cycle it synthesized, in the §6a body and /health-synthesis');
  }
  // INV-88 — candidate numbers count unpromoted candidates
  {
    const problems = [];
    const r = bodies.get('reflect') || '';
    if (!r.includes('highest INV-N in the library OR in any earlier "Invariant candidates" line under .cycle/blocks/')) problems.push('/reflect numbers candidates from the library alone, not above unpromoted candidates in .cycle/blocks/');
    const s = bodies.get('seams-audit') || '';
    if (!s.includes('above the highest INV-N in the library or in any earlier "Invariant candidates" or "Proposed additions" line under .cycle/blocks/')) problems.push('/seams-audit numbers proposed invariants from the library alone');
    report('candidate numbering', 'INV-88', problems, '/reflect and /seams-audit number new candidates above unpromoted ones in .cycle/blocks/, not from the library alone');
  }
  // INV-73 — the Seams audit asks about the project's configured Axis B categories
  {
    const problems = [];
    for (const [n, t] of [['§1s body', fenced('Seams & Invariants Audit (Section 1s in HTML tool)')], ['seams-audit.md', bodies.get('seams-audit')]]) {
      const f = flat(t);
      if (!f) { problems.push(`${n} not found`); continue; }
      if (!f.includes("Provide cross-cutting observations for each of the project's Axis B categories — the Horizontal (Axis B) Categories in the Cycle Workflow Config")) problems.push(`${n}'s Part 4 does not ask about the project's configured Axis B categories`);
      if (!f.includes('HORIZONTAL OBSERVATIONS (evidence for next Axis B scoring — one line per Axis B category in the Cycle Workflow Config')) problems.push(`${n}'s output block does not take one line per configured Axis B category`);
      if (/relevant to the five Axis B categories/.test(f)) problems.push(`${n} still names "the five Axis B categories" as the set to report on`);
    }
    report('configured Axis B in the Seams audit', 'INV-73', problems, 'the Seams audit reports on the project\'s configured Axis B categories, in the §1s body and /seams-audit');
  }
  // INV-91 — one dead-code lens in every audit (R21, decided 2026-11-23)
  {
    const problems = [];
    const audits = [...bodies].filter(([, b]) => /CYCLE OPEN \(optional/.test(b)).map(([n]) => n);
    const lenses = audits.map(n => [n, (bodies.get(n).match(/Dead or superseded artifacts — [\s\S]*?never removals\./) || [null])[0]]);
    const none = lenses.filter(([, l]) => !l).map(([n]) => n);
    if (none.length) problems.push(`audit(s) with no dead/superseded-artifact lens: ${none.join(', ')}`);
    if (new Set(lenses.map(([, l]) => l).filter(Boolean)).size > 1) problems.push(`the dead-code lens differs between ${lenses.filter(([, l]) => l).map(([n]) => n).join(', ')} — one lens, one text`);
    const PARTS = ['ONLY where the thing is actively misleading', 'Volume is not a finding; concealment is.', 'SAFE (mechanically verified', 'PROPOSE (looks unused', 'PROPOSE items are questions for the operator, never removals.'];
    for (const [n, l] of lenses) if (l) { const lacks = PARTS.filter(p => !l.includes(p)); if (lacks.length) problems.push(`${n}'s dead-code lens lacks ${lacks.map(p => JSON.stringify(p)).join(', ')}`); }
    for (const n of audits) if (!bodies.get(n).includes('Removing something is a change like any other and needs the same evidence a fix needs. If you cannot name the check that proves nothing references it, it is a PROPOSE, not a finding.')) problems.push(`${n} lacks the rule that a removal needs a fix's evidence`);
    report('dead-code lens', 'INV-91', problems, `the three audits share one dead/superseded-artifact lens (SAFE / PROPOSE, never a removal on a guess) and the removal-needs-evidence rule — ${audits.length} audits`);
  }  // INV-92 — /verify and /health-synthesis stop on a cycle with no reflect block; the verification block has a fixed name
  {
    const problems = [];
    for (const n of ['verify', 'health-synthesis']) {
      const b = bodies.get(n) || '';
      if (!b) { problems.push(`${n}.md not found`); continue; }
      if (!b.includes("NO REFLECT BLOCK — if none of that cycle's files is a …-reflect.md block")) problems.push(`/${n} does not check for the cycle's reflect block`);
      if (!b.includes('ask the operator whether to') || !b.includes('Do not go on until they answer.')) problems.push(`/${n} does not stop and ask when the reflect block is missing`);
    }
    const v = bodies.get('verify') || '';
    if (!v.includes('.cycle/blocks/<cycle>-verification.md — a fixed name, taking no letter')) problems.push('/verify does not write its block under the fixed name <cycle>-verification.md');
    if (/<cycle>-<letter>-verification\.md/.test(v)) problems.push('/verify still names its block with a letter — a parallel /reflect can take the same one');
    report('verification inputs', 'INV-92', problems, '/verify and /health-synthesis stop and ask when the cycle has no reflect block, and /verify writes <cycle>-verification.md under a fixed name', 'v1.54.0');
  }
  // INV-96 — every audit saves its report under a fixed name, and the commands that need it read it back (R24)
  {
    const problems = [];
    const audits = [...bodies].filter(([, b]) => /CYCLE OPEN \(optional/.test(b)).map(([n]) => n);
    const steps = audits.map(n => [n, (bodies.get(n).match(/SAVE REPORT \(optional — only if \.cycle\/STATE\.md exists\)[\s\S]*?Skip this step if \.cycle\/STATE\.md does not exist\./) || [null])[0]]);
    const none = steps.filter(([, s]) => !s).map(([n]) => n);
    if (audits.length < 3) problems.push(`only ${audits.length} audit(s) found — the check would be vacuous`);
    if (none.length) problems.push(`audit(s) that do not save their report: ${none.join(', ')}`);
    if (new Set(steps.map(([, s]) => s).filter(Boolean)).size > 1) problems.push(`the SAVE REPORT step differs between ${steps.filter(([, s]) => s).map(([n]) => n).join(', ')} — one step, one text`);
    const PARTS = ['write all of it VERBATIM to .cycle/blocks/', '<cycle>-scan.md for /broad-scan', '<cycle>-audit-<subsystem>.md for /audit', '<cycle>-targeted-audit-<subsystem>.md for /targeted-audit', 'add -2 (then -3, …) before .md; never overwrite a block', 'security findings included', 'public repository'];
    for (const [n, s] of steps) if (s) { const lacks = PARTS.filter(p => !s.includes(p)); if (lacks.length) problems.push(`${n}'s SAVE REPORT lacks ${lacks.map(p => JSON.stringify(p)).join(', ')}`); }
    for (const n of audits) {
      const b = bodies.get(n);
      if (!b.includes('FOLLOW-ON REVIEW and SAVE REPORT steps below')) problems.push(`${n}'s opening rule does not permit the SAVE REPORT write`);
      if (!b.includes("one of the session's three permitted file writes (the others are FOLLOW-ON REVIEW and SAVE REPORT, below)")) problems.push(`${n}'s CYCLE OPEN does not count SAVE REPORT among the permitted writes`);
    }
    const READERS = [
      ['broad-implement', '.cycle/blocks/<cycle>-scan.md', 'a batch from the saved scan report'],
      ['plan', '.cycle/blocks/<cycle>-audit-<subsystem>.md', 'the handoff from the saved /audit report'],
      ['targeted-implement', '.cycle/blocks/<cycle>-targeted-audit-<subsystem>.md', 'the handoff from the saved /targeted-audit report'],
      ['health-synthesis', '…-scan.md for a Tier 1 cycle (its FINAL REPORT and batch plan stand in for the Session Handoff Block)', 'the saved audit report'],
    ];
    for (const [n, p, what] of READERS) if (!(bodies.get(n) || '').includes(p)) problems.push(`/${n} does not read ${what}`);
    if (!(bodies.get('verify') || '').includes("The audit's saved report (…-scan.md, …-audit-<subsystem>.md, …-targeted-audit-<subsystem>.md) is not an input either")) problems.push('/verify does not leave the saved audit report out of its inputs');
    report('saved audit report', 'INV-96', problems, `the three audits save their report verbatim under a fixed name, and /broad-implement, /plan, /targeted-implement and /health-synthesis read it back — ${audits.length} audits`, 'v1.56.0');
  }

}

if (failures) {
  console.error(`\n${failures} issue(s) detected. Add the missing capability/template to the listed file(s),`);
  console.error('regenerate command files, or update CHECKS in scripts/check-template-sync.mjs if a marker was intentionally renamed.');
  process.exit(1);
}
console.log('\nAll tracked features present and command files in sync. ✓');
