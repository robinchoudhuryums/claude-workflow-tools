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

// ── Structural check 8 (F15): the CI workflow declares least privilege. Every
// step only reads the checkout — no step posts, pushes or publishes — so
// without an explicit block the job inherits whatever the repository default
// grants. §4v flagged this as a Category D candidate: the permissions block
// shipped in v1.21.0 with no test asserting it, so a later edit could drop it
// silently.
try {
  const wf = readFileSync(new URL('.github/workflows/sync-check.yml', root), 'utf8');
  const perms = wf.match(/^permissions:\s*\n((?:\s+\S.*\n)+)/m);
  if (!perms) { failures++; console.log('  ✗ CI workflow declares no permissions: block — the job inherits the repo default (F15)'); }
  else if (!/contents:\s*read/.test(perms[1])) { failures++; console.log(`  ✗ CI workflow permissions do not grant read-only contents: ${perms[1].trim().replace(/\n/g, ', ')}`); }
  else if (/write/.test(perms[1])) { failures++; console.log(`  ✗ CI workflow requests write permission it does not need: ${perms[1].trim().replace(/\n/g, ', ')}`); }
  else console.log('  ✓ CI workflow declares least-privilege permissions (contents: read)');

  // INV-14 — the workflow must actually RUN the guard, on both triggers. The
  // invariant said "CI runs check-template-sync.mjs on push and PR" and its
  // Verify field pointed at the YAML file as prose, so nothing asserted it: the
  // trigger list or the step could have been dropped and only INV-57's
  // permissions clause was being read out of this file.
  const on = wf.match(/^on:\s*\n((?:\s+\S.*\n)+)/m);
  const triggers = on ? on[1] : '';
  const missingTrigger = ['push', 'pull_request'].filter(t => !new RegExp(`^\\s+${t}\\s*:`, 'm').test(triggers));
  if (missingTrigger.length) { failures++; console.log(`  ✗ CI workflow does not trigger on: ${missingTrigger.join(', ')} (INV-14)`); }
  else if (!/run:\s*node scripts\/check-template-sync\.mjs/.test(wf)) {
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
{
  const STEP = /^(?:\d+\.\s*)?(CHECKPOINT|METRICS|ESTIMATE CALIBRATION|BLOCKS|SEAM COUNTER)\b(.*)$/;
  const GATE = /optional\s*—\s*only if|if a \.cycle\/ directory exists|skip if no \.cycle\//i;
  const ungated = [];
  let stepCount = 0;
  for (const name of tableCmds) {
    const txt = (() => { try { return readFileSync(new URL(`.claude/commands/${name}.md`, root), 'utf8'); } catch { return null; } })();
    if (!txt) continue;
    const lines = txt.split('\n');
    lines.forEach((line, i) => {
      const m = line.match(STEP);
      if (!m) return;
      stepCount++;
      // The gate may sit on the heading line or the sentence immediately under it.
      if (!GATE.test(lines.slice(i, i + 3).join(' '))) ungated.push(`${name}.md: "${m[1]}"`);
    });
  }
  if (!stepCount) { failures++; console.log('  ✗ no .cycle/-writing steps found in any command — the gating check is vacuous (INV-12)'); }
  else if (ungated.length) { failures++; console.log(`  ✗ .cycle/-writing step(s) not gated on the directory existing: ${ungated.join(', ')} (INV-12/INV-18)`); }
  else console.log(`  ✓ all ${stepCount} .cycle/-writing command steps are gated on .cycle/ existing (INV-12/INV-18)`);
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

if (failures) {
  console.error(`\n${failures} issue(s) detected. Add the missing capability/template to the listed file(s),`);
  console.error('regenerate command files, or update CHECKS in scripts/check-template-sync.mjs if a marker was intentionally renamed.');
  process.exit(1);
}
console.log('\nAll tracked features present and command files in sync. ✓');
