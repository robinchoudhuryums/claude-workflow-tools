#!/usr/bin/env node
// synthesis-pack.test.mjs — regression test for scripts/synthesis-pack.mjs (ROADMAP R22).
//
// The fixtures are Cycle 8's real numbers, frozen here so the test does not move
// when the live blocks and PROJECT_HEALTH.md do: eight release blocks summing to
// 10 − 2, a reflect row corrected to 6 − 2, a verification of 10 − 3, three
// releases shipped after both — and a Score History whose Cycle 8 entry fires
// Silent Prompt Degradation on DECLINE and Guard / Test Coverage Quality as a
// PERSISTENT LAGGARD. Every assertion names what it would mean if it failed.

import { parseNet, blockKind, reconcile, parseHistory, triggers, triggerThresholds, synthesisGaps, axisBNames, policyConfig, consistency } from '../scripts/synthesis-pack.mjs';

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── R22-1: parsing and reconciliation ──
{
  const cases = [
    ['NET SCORE: 4 − 1 = 3 (x)', { fixes: 4, nfm: 1, net: 3 }],
    ['NET SCORE: 0 − 1 = −1', { fixes: 0, nfm: 1, net: -1 }],
    ['Net score: 10 - 3 = 7', { fixes: 10, nfm: 3, net: 7 }],
    ['no score here', null],
  ];
  const wrong = cases.filter(([t, want]) => !eq(parseNet(t), want));
  if (!wrong.length) ok('parseNet reads NET SCORE and Net score lines, either minus sign, negative nets, and none');
  else bad(`R22-1 parseNet misread: ${wrong.map(([t]) => JSON.stringify(t)).join(', ')}`);
  const kinds = ['08-1.44.0-broad-implement.md', '08-1.44.0-2-broad-implement.md', '08-a-reflect.md', '08-b-verification.md', '08-verification.md', '08-verification-2.md', '06-c-seams.md', '08-notes.md'].map(blockKind);
  if (eq(kinds, ['release', 'release', 'reflect', 'verification', 'verification', 'verification', 'seams', 'other'])) ok('blockKind tells release, reflect, verification (lettered, fixed, -N), seams and other blocks apart');
  else bad('R22-1 blockKind misclassified: ' + JSON.stringify(kinds));
}

const REL = [['1.44.0', 4, 0], ['1.45.0', 0, 1], ['1.46.0', 0, 0], ['1.47.0', 4, 1], ['1.48.0', 1, 0], ['1.49.0', 0, 0], ['1.50.0', 1, 0], ['1.51.0', 0, 0], ['1.52.0', 1, 0], ['1.53.0', 1, 2], ['1.54.0', 2, 0]];
const releaseBlocks = REL.map(([v, f, n]) => ({ name: `08-${v}-broad-implement.md`, text: `---BROAD SCAN IMPLEMENTATION SUMMARY---\nNET SCORE: ${f} − ${n} = ${f - n}\n` }));
const reflectBlock = { name: '08-a-reflect.md', text: 'Scope: broad | Cycle: 8\nCovers v1.44.0 through v1.51.0.\nNet score: 6 − 2 = 4 (CORRECTED)' };
const verifBlock = { name: '08-b-verification.md', text: 'Verified: v1.44.0–v1.51.0\nRegressions found: 3\nNet score: 10 − 3 = 7' };
const HEADER = 'date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes,defensive_count\n';
const metrics = HEADER + '2026-11-20,8,all,reflect,4,6,2,,,"CORRECTION: the batch summaries self-reported 10 production fixes; re-derived 6.",28\n';
{
  const r = reconcile({ blocks: [...releaseBlocks, reflectBlock, verifBlock], metricsCsv: metrics, cycle: '8' });
  const kinds = r.findings.map(f => f.kind);
  if (eq(r.sum, { fixes: 10, nfm: 2, net: 8 }) && r.reflectMax === '1.51.0') ok('the release blocks the reflection covers sum to 10 − 2 = 8, through v1.51.0 (Cycle 8)');
  else bad(`R22-1 reconciliation sum wrong: ${JSON.stringify(r.sum)} through ${r.reflectMax}, expected 10 − 2 = 8 through 1.51.0`);
  const differ = r.findings.find(f => f.kind === 'reflect-differs');
  if (differ && /6 − 2 = 4/.test(differ.text) && /CORRECTION/.test(differ.text)) ok('the reflect row\'s 6 − 2 is set against the blocks\' 10 − 2, with the recorded CORRECTION as its cause');
  else bad('R22-1 reconciliation did not report the reflect row disagreeing with its recorded CORRECTION as the cause');
  const after = r.findings.find(f => f.kind === 'after-reflect');
  if (after && /1\.52\.0 \(1 − 0\), 1\.53\.0 \(1 − 2\), 1\.54\.0 \(2 − 0\)/.test(after.text)) ok('releases shipped after the reflection are named with their scores (1.52.0–1.54.0)');
  else bad('R22-1 reconciliation did not name the releases shipped after the reflection');
  const v = r.findings.find(f => f.kind === 'verification-differs');
  if (v && /3 regression\(s\)/.test(v.text) && /2 new failure mode/.test(v.text)) ok('the verification\'s 10 − 3 is set against the blocks\' 10 − 2: 3 regressions vs 2 self-reported');
  else bad('R22-1 reconciliation did not report the verification finding more regressions than the self-reports');
  if (kinds.includes('after-verification')) ok('releases no verification covers are named');
  else bad('R22-1 reconciliation did not name the releases no verification covers');
}
{
  const r = reconcile({ blocks: [...releaseBlocks.slice(0, 2), reflectBlock], metricsCsv: metrics, cycle: '8' });
  if (r.findings.some(f => f.kind === 'no-verification' && /Low confidence/.test(f.text))) ok('a cycle with no Verification Block is flagged with §6a\'s Low-confidence rule');
  else bad('R22-1 reconciliation did not flag a cycle with no Verification Block');
  const r2 = reconcile({ blocks: [{ name: '08-1.44.0-broad-implement.md', text: 'no score' }, { name: '08-1.45.0-broad-implement.md', text: 'NET SCORE: 3 − 1 = 1' }], metricsCsv: HEADER, cycle: '8' });
  const k2 = r2.findings.map(f => f.kind);
  if (k2.includes('no-net-line') && k2.includes('arithmetic') && k2.includes('no-reflect')) ok('a block with no NET SCORE line, a line whose arithmetic is wrong, and a cycle with no reflect row are each reported');
  else bad('R22-1 reconciliation missed a block with no NET SCORE line, bad arithmetic, or a missing reflect row: ' + JSON.stringify(k2));
  const r3 = reconcile({ blocks: [...releaseBlocks.slice(0, 8), reflectBlock, verifBlock, { name: '08-verification.md', text: 'v1.51.0\nRegressions found: 2\nNet score: 10 − 2 = 8' }, { name: '08-verification-2.md', text: 'v1.51.0\nRegressions found: 2\nNet score: 10 − 2 = 8' }], metricsCsv: metrics, cycle: '8' });
  if (r3.verification.name === '08-verification-2.md' && r3.findings.some(f => f.kind === 'superseded')) ok('the newest verification is the input (-2 over the fixed name over a lettered block); the others are named superseded');
  else bad('R22-1 reconciliation picked ' + (r3.verification && r3.verification.name) + ' as the newest verification, or did not name the superseded ones');
}

// ── R22-2: Score History, triggers, thresholds ──
const CFG = `### Horizontal (Axis B) Categories
Cross-Artifact Drift | a
Silent Prompt Degradation | b
Generated-Artifact Staleness | c
Backward-Compatibility Breakage | d
Guard / Test Coverage Quality | e

### Policy Configuration
Policy threshold: 4/10
Consecutive cycles: 2
`;
const entry = (c, b, extra = '') => `### Cycle ${c} — 2026-0${c}-01 — Synthesis

AXIS A — VERTICAL (Subsystem Health):
Overall: 9.0/10 | Guard & Tooling Coverage: 8.0/10

AXIS B — HORIZONTAL (Bug-Shape Posture):
${b}

${extra}
`;
const HISTORY = `# Project Health

## Current Standing
Last synthesis: 2026-11-20 (Cycle 8)
Overall (weighted avg): 8.9/10
One-line summary: x
Top vertical priority: Guard & Tooling Coverage (8.0, ↓ from 8.5) — prose
Top horizontal priority: Guard / Test Coverage Quality (7.5, ↓ from 8.0) — prose

## Score History

${entry(8, 'Cross-Artifact Drift: 9.5/10 (Stable)\nSilent Prompt Degradation: 8.0/10 (Degrading)\nGenerated-Artifact Staleness: 9.0/10 (Stable)\nBackward-Compatibility Breakage: 8.5/10 (Degrading)\nGuard / Test Coverage Quality: 7.5/10 (Degrading)', 'Overall (weighted avg): 8.9/10 (equal weights)\nCategory D ratio: 40%\nPolicy responses triggered: Guard / Test Coverage Quality (persistent laggard); Silent Prompt Degradation (decline)')}
${entry(6, 'Cross-Artifact Drift: 9.5/10 (Stable)\nSilent Prompt Degradation: 8.5/10 (Degrading)\nGenerated-Artifact Staleness: 9.0/10 (Stable)\nBackward-Compatibility Breakage: 9.0/10 (Stable)\nGuard / Test Coverage Quality: 8.0/10 (Improving)', 'Overall (weighted avg): 9.2/10\nCategory D ratio: 16%\nPolicy: none triggered')}
${entry(5, 'Cross-Artifact Drift: 9.5/10 (↑)\nSilent Prompt Degradation: 9.0/10 (↑)\nGenerated-Artifact Staleness: 9.0/10 (stable) | Backward-Compatibility Breakage: 9.0/10 (stable)\nGuard / Test Coverage Quality: 7.0/10 (↓)', 'Overall (weighted avg): 9.0/10\nCategory D ratio: 20%\nPolicy: none triggered')}
${entry(1, 'Cross-Artifact Drift: 7/10 [first measurement] | Silent Prompt Degradation: 7.5/10 [first]\nGenerated-Artifact Staleness: 8.5/10 [first] | Backward-Compatibility Breakage: 8.5/10 [first]\nGuard / Test Coverage Quality: 6.5/10 [first]', 'Overall (weighted avg): 7.9/10\nCategory D ratio: ~33%\nPolicy: none')}
## Pulse Check Log
`;
const names = axisBNames(CFG), pol = policyConfig(CFG);
{
  if (names.length === 5 && names[4] === 'Guard / Test Coverage Quality' && pol.threshold === 4 && pol.consecutive === 2) ok('the configured Axis B categories and policy settings are read from the config');
  else bad('R22-2 config read wrong: ' + JSON.stringify({ names, pol }));
  if (axisBNames('').length === 5 && axisBNames('')[0] === 'Silent Degradation Posture') ok('a config with no Axis B categories falls back to the five defaults');
  else bad('R22-2 config with no Axis B categories did not fall back to the defaults');
  const h = parseHistory(HISTORY);
  const c1 = h.find(e => e.cycle === 1), c5 = h.find(e => e.cycle === 5);
  if (eq(h.map(e => e.cycle), [8, 6, 5, 1]) && c1.axisB['Guard / Test Coverage Quality'] === 6.5 && c5.axisB['Backward-Compatibility Breakage'] === 9 && c1.categoryD === 33 && h[0].overall === 8.9) ok('parseHistory reads every entry format — one score per line, several joined by " | ", "[first]" tags, "~33%"');
  else bad('R22-2 parseHistory misread the Score History: ' + JSON.stringify(h.map(e => [e.cycle, e.axisB, e.categoryD])));
  const series = [...h].sort((a, b) => a.cycle - b.cycle);
  const t = triggers(series, pol, names);
  if (eq(t.map(x => [x.name, x.clauses]), [['Silent Prompt Degradation', ['decline']], ['Guard / Test Coverage Quality', ['persistent laggard']]])) ok('triggers reproduce Cycle 8: Silent Prompt Degradation on DECLINE, Guard / Test Coverage Quality as a PERSISTENT LAGGARD, nothing else');
  else bad('R22-2 triggers did not reproduce Cycle 8\'s two policy responses: ' + JSON.stringify(t));
  const mk = (...rows) => rows.map((b, i) => ({ cycle: i + 1, axisB: b }));
  const sharp = triggers(mk({ A: 9, B: 6 }, { A: 7, B: 8 }), pol, ['A', 'B']);
  const floor = triggers(mk({ A: 9, B: 5 }, { A: 9, B: 4 }), pol, ['A', 'B']);
  const recovering = triggers(mk({ A: 9, B: 6 }, { A: 9, B: 7 }), pol, ['A', 'B']);
  const oneDecline = triggers(mk({ A: 9, B: 7 }, { A: 8.5, B: 7.5 }), pol, ['A', 'B']);
  if (eq(sharp.map(x => [x.name, x.clauses]), [['A', ['sharp drop']]])) ok('a fall of 1.5 or more in one cycle fires SHARP DROP');
  else bad('R22-2 sharp drop clause wrong: ' + JSON.stringify(sharp));
  if (floor.some(x => x.name === 'B' && x.clauses.includes('absolute floor') && x.clauses.includes('persistent laggard'))) ok('a score at the threshold fires ABSOLUTE FLOOR (and a non-improving laggard fires too)');
  else bad('R22-2 absolute floor clause wrong: ' + JSON.stringify(floor));
  if (!recovering.length) ok('a lowest category that is RECOVERING does not fire persistent laggard');
  else bad('R22-2 persistent laggard fired on a recovering category: ' + JSON.stringify(recovering));
  if (!oneDecline.length) ok('one decline is not a DECLINE trigger when Consecutive cycles is 2');
  else bad('R22-2 decline fired on a single fall: ' + JSON.stringify(oneDecline));
  const th = triggerThresholds(series.filter(e => e.cycle < 8), pol, names);
  const spd = th.find(x => x.name === 'Silent Prompt Degradation'), guard = th.find(x => x.name === 'Guard / Test Coverage Quality'), drift = th.find(x => x.name === 'Cross-Artifact Drift');
  if (spd.decline === 'any score below 8.5' && guard.laggard === 'lowest this cycle at 8 or below' && drift.decline === null && guard.sharpDrop === '6.5 or below') ok('thresholds for Cycle 8 say where each clause fires: SPD below 8.5, Guard lowest at 8 or below, Drift cannot decline-trigger');
  else bad('R22-2 trigger thresholds wrong: ' + JSON.stringify({ spd, guard, drift }));
  if (eq(synthesisGaps(series.filter(e => e.cycle < 8), 8), [2, 3, 4, 7])) ok('cycles with no synthesis are named, up to the cycle being synthesized');
  else bad('R22-2 synthesis gaps wrong: ' + JSON.stringify(synthesisGaps(series.filter(e => e.cycle < 8), 8)));
}

// ── R22-3: the three artifacts a synthesis writes agree in value ──
const SYN = HEADER + '2026-11-20,8,all,synthesis,,,,40%,Guard / Test Coverage Quality (7.5),"x",\n';
{
  const good = consistency({ healthMd: HISTORY, metricsCsv: SYN, cfg: CFG });
  if (!good.problems.length) ok('a consistent synthesis passes: cycle, lowest Axis B, Category D, Overall and the recomputed triggers all agree');
  else bad('R22-3 consistency failed a consistent synthesis: ' + good.problems.join(' | '));
  const cases = [
    ['the metrics row names another lowest category', HISTORY, SYN.replace('Guard / Test Coverage Quality (7.5)', 'Silent Prompt Degradation (8.0)'), /axis_b_lowest is Silent Prompt Degradation/],
    ['Current Standing gives another score', HISTORY.replace('(7.5, ↓ from 8.0) — prose', '(7.0, ↓ from 8.0) — prose'), SYN, /top horizontal priority/],
    ['Category D differs', HISTORY, SYN.replace('40%', '30%'), /Category D: the metrics row says 30%/],
    ['Overall differs', HISTORY.replace('Overall (weighted avg): 8.9/10\nOne-line', 'Overall (weighted avg): 9.1/10\nOne-line'), SYN, /Overall: Current Standing says 9\.1/],
    ['the cycle numbers differ', HISTORY.replace('2026-11-20 (Cycle 8)', '2026-11-20 (Cycle 7)'), SYN, /not one cycle/],
    ['the entry omits a trigger', HISTORY.replace('; Silent Prompt Degradation (decline)', ''), SYN, /Silent Prompt Degradation fires \(decline\) but the Cycle 8 entry does not list it/],
    ['the entry names a trigger that does not fire', HISTORY.replace('(decline)', '(decline); Cross-Artifact Drift (decline)'), SYN, /lists Cross-Artifact Drift as triggered/],
  ];
  for (const [label, h, m, re] of cases) {
    const r = consistency({ healthMd: h, metricsCsv: m, cfg: CFG });
    if (r.problems.some(p => re.test(p))) ok(`R22-3 catches it when ${label}`);
    else bad(`R22-3 consistency missed it when ${label}: ${JSON.stringify(r.problems)}`);
  }
  const none = consistency({ healthMd: '# Project Health\n\n## Current Standing\nLast synthesis: none yet\n\n## Score History\n', metricsCsv: HEADER, cfg: CFG });
  if (none.skipped && !none.problems.length) ok('a project that has never synthesized is skipped, not failed');
  else bad('R22-3 consistency did not skip a project with no synthesis');
}

console.log('Synthesis pack regression test (scripts/synthesis-pack.mjs, ROADMAP R22):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} synthesis-pack test(s) failed.`); process.exitCode = 1; }
else console.log('\nThe synthesis pack reconciles, recomputes and cross-checks what a synthesis carries. ✓');
