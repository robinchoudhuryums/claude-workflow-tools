#!/usr/bin/env node
// synthesis-pack.mjs — derive Health Synthesis inputs instead of carrying them
// by hand (ROADMAP R22; the §6a sibling of verification-pack.mjs).
//
// /health-synthesis reads a cycle's blocks, the prior scores and the config,
// and until v1.55.0 it then did the arithmetic by eye. Cycle 8 showed what that
// costs: its eight release blocks summed to 10 − 2, /reflect corrected that to
// 6 − 2, verification found 10 − 3, the operator adopted 10 — and the metrics
// row still said 4, while three releases shipped after the synthesis and no
// synthesis covered them. Each figure was right where it was written; nothing
// put them side by side. This script does three things:
//
//   1. RECONCILE (R22-1) — sums the NET SCORE lines of the cycle's release
//      blocks and lays them beside the phase=reflect row and the Verification
//      Block, naming every disagreement with its likely cause: a recorded
//      CORRECTION, a release the reflection or the verification does not
//      cover, a block with no NET SCORE line, a line whose arithmetic is wrong,
//      a verification that found regressions the self-reports did not. A
//      disagreement is REPORTED, not failed: reflection and verification may
//      legitimately differ, and the operator settles it (decision, 2026-11-23).
//   2. PRIOR SCORES + TRIGGERS (R22-2) — reads PROJECT_HEALTH.md's Score
//      History into a series per Axis B category and per dimension, and turns
//      the four relative policy-trigger clauses into numbers: for each category,
//      the score at which each clause would fire this cycle.
//   3. CONSISTENCY (R22-3, --check) — a synthesis writes the same facts three
//      times (the metrics row, Current Standing, the Score History entry).
//      INV-71 guards their LABELS; this checks their VALUES agree, and that the
//      entry's "Policy responses triggered" line matches the clauses recomputed
//      from the series. Exits 1 on a disagreement; skips a project that has not
//      synthesized.
//
//   node scripts/synthesis-pack.mjs [--cycle N] [--root DIR] [--out FILE]
//   node scripts/synthesis-pack.mjs --check [--root DIR]
//
// Importable: no CLI side effects on import (the INV-28 rule for every script).

import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBlocks, cycleTotals, metricsRows, pendingCloseOut, sameCycle, isAuditReport } from './verification-pack.mjs';
import { HEALTH_FIELDS, HEALTH_SECTION } from './health-fields.mjs';

const read = p => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
const num = s => Number(String(s).replace('−', '-'));

// ── R22-1: net-score reconciliation ─────────────────────────

// "NET SCORE: 4 − 1 = 3" (implement blocks) or "Net score: 10 − 3 = 7"
// (reflect / verification blocks). Both minus signs are accepted.
export function parseNet(text) {
  const m = String(text || '').match(/^(?:NET SCORE|Net score):\s*([−-]?\d+(?:\.\d+)?)\s*[−-]\s*([−-]?\d+(?:\.\d+)?)\s*=\s*([−-]?\d+(?:\.\d+)?)/m);
  if (!m) return null;
  return { fixes: num(m[1]), nfm: num(m[2]), net: num(m[3]) };
}

// What a block is, from its name alone (the blocks directory's naming rules).
export function blockKind(name) {
  if (isAuditReport(name)) return 'report';
  if (/^0*\d+-\d+\.\d+\.\d+(?:-\d+)?-[a-z-]+\.md$/.test(name)) return 'release';
  if (/-reflect\.md$/.test(name)) return 'reflect';
  if (/-verification(?:-\d+)?\.md$/.test(name)) return 'verification';
  if (/-seams\.md$/.test(name)) return 'seams';
  return 'other';
}
export const versionOf = name => (String(name).match(/^0*\d+-(\d+\.\d+\.\d+)/) || [])[1] || null;
export function semverCmp(a, b) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}
// The newest version a text mentions — how far a reflection or a verification
// reaches. A release above it was shipped after that block was written.
export function maxVersionMentioned(text) {
  let max = null;
  for (const m of String(text || '').matchAll(/\bv?(\d+\.\d+\.\d+)\b/g)) if (!max || semverCmp(m[1], max) > 0) max = m[1];
  return max;
}
// Lettered verification blocks predate v1.54.0's fixed name; -N is a re-run.
function verificationRank(name) {
  const m = name.match(/-verification(?:-(\d+))?\.md$/);
  if (/^0*\d+-[a-z]-verification\.md$/.test(name)) return 0;
  return m && m[1] ? Number(m[1]) : 1;
}

export function reconcile({ blocks, metricsCsv, cycle }) {
  const findings = [];
  const releases = blocks.filter(b => blockKind(b.name) === 'release')
    .map(b => ({ name: b.name, version: versionOf(b.name), score: parseNet(b.text) }))
    .sort((a, b) => semverCmp(a.version, b.version) || a.name.localeCompare(b.name));
  for (const r of releases) {
    if (!r.score) findings.push({ kind: 'no-net-line', text: `${r.name} has no NET SCORE line — its fixes and failure modes are in no total` });
    else if (r.score.fixes - r.score.nfm !== r.score.net) findings.push({ kind: 'arithmetic', text: `${r.name}: ${r.score.fixes} − ${r.score.nfm} is not ${r.score.net}` });
  }
  const reflectBlocks = blocks.filter(b => blockKind(b.name) === 'reflect');
  const totals = cycleTotals(metricsCsv, cycle);
  const { rows, at } = metricsRows(metricsCsv);
  const reflectNotes = rows.filter(c => sameCycle(at(c, 'cycle'), cycle) && at(c, 'phase') === 'reflect').map(c => at(c, 'notes')).join('\n');
  const reflectMax = maxVersionMentioned(reflectBlocks.map(b => b.text).join('\n') + '\n' + reflectNotes);
  const verifs = blocks.filter(b => blockKind(b.name) === 'verification').sort((a, b) => verificationRank(a.name) - verificationRank(b.name));
  const verif = verifs.length ? verifs[verifs.length - 1] : null;
  const verifScore = verif ? parseNet(verif.text) : null;
  const verifRegressions = verif ? (verif.text.match(/^Regressions found:\s*(\d+)/m) || [])[1] : undefined;
  const verifMax = verif ? maxVersionMentioned(verif.text) : null;
  const within = (r, max) => !!(max && r.version && semverCmp(r.version, max) <= 0);

  const covered = reflectMax ? releases.filter(r => within(r, reflectMax)) : releases;
  const sum = covered.reduce((s, r) => r.score ? { fixes: s.fixes + r.score.fixes, nfm: s.nfm + r.score.nfm, net: s.net + r.score.net } : s, { fixes: 0, nfm: 0, net: 0 });
  const afterReflect = reflectMax ? releases.filter(r => !within(r, reflectMax)) : [];
  const afterVerif = verif && verifMax ? releases.filter(r => !within(r, verifMax)) : [];

  if (!totals.rows) findings.push({ kind: 'no-reflect', text: `no phase=reflect row for cycle ${cycle} — /reflect has not run, so there is nothing to reconcile the release blocks against` });
  else if (totals.fixes !== sum.fixes || totals.nfm !== sum.nfm || totals.net !== sum.net) {
    const cause = totals.corrections.length ? `the reflect row records a CORRECTION: "${totals.corrections[0].slice(0, 160)}…"` : 'no correction is recorded — read the reflect block for why';
    findings.push({ kind: 'reflect-differs', text: `the release blocks the reflection covers sum to ${sum.fixes} − ${sum.nfm} = ${sum.net}; the reflect row says ${totals.fixes} − ${totals.nfm} = ${totals.net}. Cause: ${cause}` });
  }
  if (afterReflect.length) findings.push({ kind: 'after-reflect', text: `${afterReflect.length} release(s) shipped after the reflection (newest it mentions: v${reflectMax}) and are in no reflect row: ${afterReflect.map(r => `${r.version} (${r.score ? `${r.score.fixes} − ${r.score.nfm}` : 'no NET SCORE'})`).join(', ')}` });
  if (!verif) findings.push({ kind: 'no-verification', text: 'no Verification Block for this cycle — §6a scores Axis B at Low confidence ("no independent verification") and says so' });
  else {
    if (verifs.length > 1) findings.push({ kind: 'superseded', text: `${verifs.length} verification blocks; ${verif.name} is the newest and the input, ${verifs.slice(0, -1).map(v => v.name).join(', ')} superseded` });
    if (!verifScore) findings.push({ kind: 'no-net-line', text: `${verif.name} has no "Net score:" line` });
    else if (verifScore.fixes !== sum.fixes || verifScore.nfm !== sum.nfm) {
      const why = verifRegressions != null && Number(verifRegressions) !== sum.nfm ? `the verification counted ${verifRegressions} regression(s) where the release blocks self-reported ${sum.nfm} new failure mode(s)` : 'read both blocks for the reason';
      findings.push({ kind: 'verification-differs', text: `${verif.name} says ${verifScore.fixes} − ${verifScore.nfm} = ${verifScore.net} against the release blocks' ${sum.fixes} − ${sum.nfm} = ${sum.net}: ${why}. §6a gives the verification precedence` });
    }
    if (afterVerif.length) findings.push({ kind: 'after-verification', text: `${afterVerif.length} release(s) shipped after the verification (newest it mentions: v${verifMax}) — no independent check covers them: ${afterVerif.map(r => r.version).join(', ')}` });
  }
  // R24-2: an implement command whose audit saved no report. The report is
  // §6a's Session Handoff Block (for Tier 1, the FINAL REPORT and batch plan),
  // and without it the batch plan cannot be checked against what shipped.
  const reports = blocks.filter(b => blockKind(b.name) === 'report').map(b => b.name);
  for (const [cmd, want, label] of TIERS) {
    const by = releases.filter(r => new RegExp(`-${cmd}\\.md$`).test(r.name) && !(cmd === 'implement' && /-(?:broad|targeted)-implement\.md$/.test(r.name)));
    if (by.length && !reports.some(n => want.test(n))) findings.push({ kind: 'no-report', text: `${by.length} /${cmd} release(s) and no saved ${label} for this cycle — §6a has no ${cmd === 'broad-implement' ? 'FINAL REPORT or batch plan' : 'Session Handoff Block'} from the blocks, and nothing to check what shipped against (audits save it from v1.56.0)` });
  }
  return { reports, releases, covered, sum, reflect: totals, reflectMax, verification: verif ? { name: verif.name, score: verifScore, regressions: verifRegressions == null ? null : Number(verifRegressions), max: verifMax } : null, afterReflect, afterVerif, findings };
}

const TIERS = [
  ['broad-implement', /^0*\d+-scan(?:-\d+)?\.md$/, 'scan report (<cycle>-scan.md)'],
  ['targeted-implement', /^0*\d+-targeted-audit-/, 'targeted-audit report (<cycle>-targeted-audit-<subsystem>.md)'],
  ['implement', /^0*\d+-audit-/, 'audit report (<cycle>-audit-<subsystem>.md)'],
];

// ── R24-3: the scan's batch plan against what shipped ───────

// The newest saved scan report of the cycle (a re-run adds -2, -3).
export function newestScan(blocks) {
  const scans = blocks.filter(b => /^0*\d+-scan(?:-\d+)?\.md$/.test(b.name));
  const n = b => Number((b.name.match(/-scan-(\d+)\.md$/) || [0, 1])[1]);
  return scans.sort((a, b) => n(a) - n(b)).pop() || null;
}
const PLAN_ID = String.raw`(?:F|G|ST)\d+`;
// Parse the IMPLEMENTATION BATCH PLAN and the EXPANSION PLAN of a /broad-scan
// report: each batch's items, and the items set aside under "Deferred" / "Not
// batched". An item line is indented and opens with its ID (or "GAP: G1" /
// "STRATEGIC: ST2") followed by a pipe; a set-aside line names each ID before
// an em dash, on the label line or on indented lines under it.
export function parsePlan(text) {
  const L = String(text || '').split('\n');
  const start = L.findIndex(l => /IMPLEMENTATION BATCH PLAN/.test(l));
  const plan = { batches: [], setAside: [] };
  if (start === -1) return null;
  let cur = null, aside = false;
  for (const l of L.slice(start + 1)) {
    if (/^(?:After I review|FOLLOW-ON REVIEW)/.test(l)) break;
    let m;
    if ((m = l.match(/^\s*(Batch\s+\d+|Expansion\s+E\d+)\b/))) { cur = { name: m[1].replace(/\s+/, ' ').replace(/^Expansion /, ''), items: [] }; plan.batches.push(cur); aside = false; continue; }
    if (/^\s*(?:Deferred|Not batched)\b[^:]*:/.test(l)) { aside = true; cur = null; }
    else if (aside && !/^\s+/.test(l)) aside = false;
    if (aside) { for (const x of l.matchAll(new RegExp(`(?:^|[:;,]|\\s)\\s*(${PLAN_ID})\\s*—`, 'g'))) plan.setAside.push(x[1]); continue; }
    if (cur && (m = l.match(new RegExp(`^\\s+(?:(?:GAP|STRATEGIC):\\s*)?(${PLAN_ID})\\s*\\|`)))) cur.items.push(m[1]);
  }
  return plan;
}
// The plan IDs a release block shipped: the CHANGES lines that open with
// them ("F16 | file | what", "F3, F4 | …"). Lines that say "dropped" give the
// IDs the release dropped on purpose.
export function shippedIds(text) {
  const L = String(text || '').split('\n');
  const a = L.findIndex(l => /^CHANGES/.test(l));
  const shipped = new Set(), dropped = new Set();
  if (a !== -1) for (const l of L.slice(a + 1)) {
    if (/^(?:TEST RESULTS|REGRESSION RISKS)/.test(l)) break;
    const m = l.match(new RegExp(`^(${PLAN_ID}(?:\\s*[,+&/]\\s*${PLAN_ID})*)\\s*\\|`));
    if (m) for (const id of m[1].match(new RegExp(PLAN_ID, 'g'))) shipped.add(id);
  }
  for (const l of L) if (/\bdropped\b/i.test(l)) for (const id of l.match(new RegExp(`\\b${PLAN_ID}\\b`, 'g')) || []) if (!shipped.has(id)) dropped.add(id);
  return { shipped, dropped };
}
export function planCoverage({ blocks }) {
  const scan = newestScan(blocks);
  if (!scan) return { scan: null };
  const plan = parsePlan(scan.text);
  if (!plan) return { scan: scan.name, plan: null };
  const releases = blocks.filter(b => blockKind(b.name) === 'release');
  const where = new Map(), droppedBy = new Map();
  for (const r of releases) {
    const { shipped, dropped } = shippedIds(r.text);
    for (const id of shipped) where.set(id, [...(where.get(id) || []), r.name]);
    for (const id of dropped) droppedBy.set(id, [...(droppedBy.get(id) || []), r.name]);
  }
  const planned = new Set(plan.batches.flatMap(b => b.items));
  const batches = plan.batches.map(b => ({ ...b,
    shipped: b.items.filter(id => where.has(id)),
    dropped: b.items.filter(id => !where.has(id) && droppedBy.has(id)),
    missing: b.items.filter(id => !where.has(id) && !droppedBy.has(id)) }));
  return {
    scan: scan.name, plan,
    batches,
    neverRun: batches.filter(b => b.items.length && !b.shipped.length && !b.dropped.length).map(b => b.name),
    missing: batches.flatMap(b => b.shipped.length || b.dropped.length ? b.missing : []),
    setAsideShipped: plan.setAside.filter(id => where.has(id)),
    multiple: [...where].filter(([, rs]) => rs.length > 1).map(([id, rs]) => ({ id, releases: rs })),
    unplanned: [...where.keys()].filter(id => !planned.has(id) && !plan.setAside.includes(id)),
  };
}

// ── R22-2: prior scores and policy triggers ─────────────────

export const DEFAULT_AXIS_B = ['Silent Degradation Posture', 'Startup Ordering Guarantees', 'Operator-Only State Gaps', 'Parallel Source-of-Truth Drift', 'Test Coverage Quality'];
function configSection(cfg, heading) {
  const m = String(cfg || '').match(new RegExp('^### ' + heading.replace(/[()]/g, '\\$&') + '[^\\n]*\\n([\\s\\S]*?)(?=^### |^## |$(?![\\s\\S]))', 'm'));
  return m ? m[1] : '';
}
export function axisBNames(cfg) {
  const names = configSection(cfg, 'Horizontal (Axis B) Categories').split('\n').map(l => l.trim()).filter(l => l.includes(' | ') && !l.startsWith('(')).map(l => l.split(' | ')[0].trim());
  return names.length ? names : DEFAULT_AXIS_B;
}
export function policyConfig(cfg) {
  const s = configSection(cfg, 'Policy Configuration');
  return { threshold: Number((s.match(/Policy threshold:\s*(\d+(?:\.\d+)?)/) || [])[1] ?? 4), consecutive: Number((s.match(/Consecutive cycles:\s*(\d+)/) || [])[1] ?? 2) };
}
const scoreSegments = line => line.split(' | ').map(seg => seg.match(/^\s*([^:|]+?):\s*(\d+(?:\.\d+)?)\/10/)).filter(Boolean).map(m => [m[1].trim(), Number(m[2])]);

// Score History entries, newest first as the file keeps them.
export function parseHistory(md) {
  const hist = String(md || '').split(/^## Score History\s*$/m)[1];
  if (!hist) return [];
  const body = hist.split(/^## /m)[0];
  const parts = body.split(/^### Cycle /m).slice(1);
  return parts.map(p => {
    const head = p.match(/^(\d+)\s*—\s*([^\n—]+?)\s*—/);
    const lines = p.split('\n');
    const block = start => { const i = lines.findIndex(l => start.test(l)); if (i === -1) return []; const out = []; for (let j = i + 1; j < lines.length && lines[j].trim(); j++) out.push(lines[j]); return out; };
    const axisA = Object.fromEntries(block(/^AXIS A/).flatMap(scoreSegments));
    const axisB = Object.fromEntries(block(/^AXIS B/).flatMap(scoreSegments));
    const overall = (p.match(/^Overall \(weighted avg\):\s*(\d+(?:\.\d+)?)\/10/m) || [])[1];
    const catD = (p.match(/^Category D ratio:\s*~?(\d+(?:\.\d+)?)%/m) || [])[1];
    const policy = (p.match(/^Policy(?: responses triggered)?:\s*(.*)$/m) || [])[1];
    return { cycle: head ? Number(head[1]) : null, date: head ? head[2].trim() : null, axisA, axisB, overall: overall == null ? null : Number(overall), categoryD: catD == null ? null : Number(catD), policy: policy == null ? null : policy.trim() };
  }).filter(e => e.cycle != null);
}

const lowestAt = (entry, names) => { const s = names.filter(n => entry.axisB[n] != null).map(n => entry.axisB[n]); if (!s.length) return []; const min = Math.min(...s); return names.filter(n => entry.axisB[n] === min); };

// The four §6a clauses, evaluated for the LAST entry of an oldest-first series.
export function triggers(series, { threshold, consecutive }, names) {
  const t = series.length - 1, out = [];
  if (t < 0) return out;
  for (const n of names) {
    const s = series.map(e => e.axisB[n]);
    if (s[t] == null) continue;
    const clauses = [];
    let declines = 0;
    for (let k = t; k > 0 && s[k] != null && s[k - 1] != null && s[k] < s[k - 1]; k--) declines++;
    if (declines >= consecutive) clauses.push('decline');
    if (t > 0 && s[t - 1] != null && s[t - 1] - s[t] >= 1.5) clauses.push('sharp drop');
    let lowestRun = 0;
    for (let k = t; k >= 0 && lowestAt(series[k], names).includes(n); k--) lowestRun++;
    if (lowestRun >= consecutive && t > 0 && s[t - 1] != null && s[t] <= s[t - 1]) clauses.push('persistent laggard');
    if (s[t] <= threshold) clauses.push('absolute floor');
    if (clauses.length) out.push({ name: n, score: s[t], prior: t > 0 ? s[t - 1] : null, clauses });
  }
  return out;
}

// Cycles with no synthesis between the first synthesized one and the cycle
// being synthesized (Cycle 7 here): every delta and "consecutive" skips them.
export function synthesisGaps(series, cycle) {
  const have = new Set(series.map(e => e.cycle)), gaps = [];
  if (!series.length) return gaps;
  for (let c = series[0].cycle + 1; c < cycle; c++) if (!have.has(c)) gaps.push(c);
  return gaps;
}

// For the cycle about to be synthesized: the score at which each clause fires,
// computed from the prior series (oldest first). Laggard also needs the new
// score to be this cycle's lowest — stated, not assumed.
export function triggerThresholds(series, { threshold, consecutive }, names) {
  return names.map(n => {
    const s = series.map(e => e.axisB[n]), last = s[s.length - 1];
    if (last == null) return { name: n, prior: null, note: 'first measurement — only the absolute floor and persistent laggard can apply' };
    let declines = 0;
    for (let k = s.length - 1; k > 0 && s[k] != null && s[k - 1] != null && s[k] < s[k - 1]; k--) declines++;
    let lowestRun = 0;
    for (let k = series.length - 1; k >= 0 && lowestAt(series[k], names).includes(n); k--) lowestRun++;
    return {
      name: n, prior: last,
      decline: declines >= consecutive - 1 ? `any score below ${last}` : null,
      sharpDrop: `${+(last - 1.5).toFixed(2)} or below`,
      laggard: lowestRun >= consecutive - 1 ? `lowest this cycle at ${last} or below` : null,
      floor: `${threshold} or below`,
    };
  });
}

// ── R22-3: the three artifacts a synthesis writes agree in value ──

function section(md, heading) {
  const m = String(md || '').match(new RegExp('^## ' + heading + '\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))', 'm'));
  return m ? m[1] : null;
}
const field = (text, label) => { const l = String(text || '').split('\n').find(x => x.startsWith(label)); return l == null ? null : l.slice(label.length).trim(); };
const CLAUSES = ['decline', 'sharp drop', 'persistent laggard', 'absolute floor'];

export function consistency({ healthMd, metricsCsv, cfg }) {
  const problems = [];
  const entries = parseHistory(healthMd);
  const { rows, at } = metricsRows(metricsCsv);
  const synth = rows.filter(c => at(c, 'phase') === 'synthesis' && /^\d+$/.test(at(c, 'cycle')));
  if (!entries.length && !synth.length) return { skipped: 'no synthesis recorded (no Score History entry, no phase=synthesis row)', problems };
  const newest = entries.reduce((a, e) => (!a || e.cycle > a.cycle ? e : a), null);
  const row = synth.reduce((a, c) => (!a || Number(at(c, 'cycle')) > Number(at(a, 'cycle')) ? c : a), null);
  const standing = section(healthMd, HEALTH_SECTION);
  const names = axisBNames(cfg);
  if (!newest) problems.push('metrics.csv has a synthesis row but PROJECT_HEALTH.md has no Score History entry');
  if (!row) problems.push('PROJECT_HEALTH.md has a Score History entry but metrics.csv has no phase=synthesis row');
  if (standing == null) problems.push(`PROJECT_HEALTH.md has no "## ${HEALTH_SECTION}" section`);
  if (!newest || !row || standing == null) return { problems };

  const rowCycle = Number(at(row, 'cycle'));
  const lastSyn = field(standing, HEALTH_FIELDS.lastSynthesis) || '';
  const standingCycle = Number((lastSyn.match(/\(Cycle (\d+)\)/) || [])[1]);
  if (rowCycle !== newest.cycle || standingCycle !== newest.cycle) problems.push(`the newest synthesis is not one cycle: metrics row Cycle ${rowCycle}, Score History entry Cycle ${newest.cycle}, Current Standing "Last synthesis" Cycle ${Number.isFinite(standingCycle) ? standingCycle : '—'}`);

  // lowest Axis B: entry (computed) = metrics axis_b_lowest = Current Standing's top horizontal priority
  const lowest = lowestAt(newest, names);
  const lowScore = lowest.length ? newest.axisB[lowest[0]] : null;
  const rowLow = at(row, 'axis_b_lowest').match(/^(.+?)\s*\((\d+(?:\.\d+)?)\)\s*$/);
  if (!rowLow) problems.push(`the metrics row's axis_b_lowest "${at(row, 'axis_b_lowest')}" is not "<category> (<score>)"`);
  else if (!lowest.includes(rowLow[1].trim()) || Number(rowLow[2]) !== lowScore) problems.push(`the metrics row's axis_b_lowest is ${rowLow[1].trim()} (${rowLow[2]}) but the Cycle ${newest.cycle} entry's lowest Axis B is ${lowest.join(' / ') || '—'} (${lowScore ?? '—'})`);
  const top = field(standing, HEALTH_FIELDS.topHorizontal) || '';
  const topName = lowest.find(n => top.startsWith(n));
  const topScore = Number((top.match(/^[^(]*\((\d+(?:\.\d+)?)/) || [])[1]);
  if (!topName || topScore !== lowScore) problems.push(`Current Standing's top horizontal priority ("${top.slice(0, 60)}…") is not the Cycle ${newest.cycle} entry's lowest Axis B, ${lowest.join(' / ') || '—'} (${lowScore ?? '—'})`);

  // Category D and Overall
  const rowD = Number((at(row, 'category_d_ratio').match(/(\d+(?:\.\d+)?)/) || [])[1]);
  if (newest.categoryD == null || rowD !== newest.categoryD) problems.push(`Category D: the metrics row says ${at(row, 'category_d_ratio') || '—'}, the Cycle ${newest.cycle} entry ${newest.categoryD == null ? 'has no "Category D ratio:" line' : newest.categoryD + '%'}`);
  const standOverall = Number(((field(standing, HEALTH_FIELDS.overall) || '').match(/^(\d+(?:\.\d+)?)/) || [])[1]);
  if (newest.overall == null || standOverall !== newest.overall) problems.push(`Overall: Current Standing says ${field(standing, HEALTH_FIELDS.overall) || '—'}, the Cycle ${newest.cycle} entry ${newest.overall == null ? 'has no "Overall (weighted avg):" line' : newest.overall + '/10'}`);

  // the stated policy triggers = the clauses recomputed from the series
  const series = [...entries].sort((a, b) => a.cycle - b.cycle);
  const computed = triggers(series, policyConfig(cfg), names);
  const stated = newest.policy || '';
  if (!computed.length && !/\bnone\b/i.test(stated)) problems.push(`the Cycle ${newest.cycle} entry states policy triggers ("${stated.slice(0, 80)}") but none fire when recomputed from the Score History`);
  for (const c of computed) {
    const seg = stated.split(/;/).find(x => x.includes(c.name));
    if (!seg) problems.push(`recomputed from the Score History, ${c.name} fires (${c.clauses.join(', ')}) but the Cycle ${newest.cycle} entry does not list it`);
    else if (!c.clauses.some(cl => seg.toLowerCase().includes(cl))) problems.push(`${c.name} fires on ${c.clauses.join(', ')} but the entry names another clause ("${seg.trim()}")`);
  }
  for (const n of names) if (stated.includes(n) && !computed.some(c => c.name === n)) problems.push(`the Cycle ${newest.cycle} entry lists ${n} as triggered, but no clause fires for it when recomputed`);
  return { problems, newest: newest.cycle, lowest, computed };
}

// ── CLI ─────────────────────────────────────────────────────

function render({ cycle, rec, cov, series, thresholds, cfgPolicy, excluded, chosenWhy }) {
  const L = [];
  L.push(`# Synthesis pack — Cycle ${cycle}`, '', chosenWhy, '');
  L.push('## Net-score reconciliation (derived from the blocks — R22-1)', '');
  L.push('| Release block | NET SCORE |', '|---|---|');
  for (const r of rec.releases) L.push(`| ${r.name} | ${r.score ? `${r.score.fixes} − ${r.score.nfm} = ${r.score.net}` : '— (no line)'}${rec.afterReflect.includes(r) ? ' · after the reflection' : ''} |`);
  L.push('', `- Release blocks the reflection covers: **${rec.sum.fixes} − ${rec.sum.nfm} = ${rec.sum.net}**${rec.reflectMax ? ` (through v${rec.reflectMax})` : ''}`);
  L.push(`- Reflect row(s): ${rec.reflect.rows ? `**${rec.reflect.fixes} − ${rec.reflect.nfm} = ${rec.reflect.net}**` : 'none'}`);
  L.push(`- Verification: ${rec.verification ? `${rec.verification.name} — ${rec.verification.score ? `**${rec.verification.score.fixes} − ${rec.verification.score.nfm} = ${rec.verification.score.net}**` : 'no Net score line'}` : 'none'}`);
  L.push('', rec.findings.length ? 'Disagreements and gaps (reported, not failed — the operator settles them):' : 'No disagreement between the blocks, the reflect row and the verification.');
  for (const f of rec.findings) L.push(`- ${f.text}`);
  L.push('', '## Batch plan against what shipped (R24-3)', '');
  if (!cov.scan) L.push('No saved scan report for this cycle — there is no batch plan to check (a Tier 1 audit saves it as <cycle>-scan.md from v1.56.0).');
  else if (!cov.plan) L.push(`${cov.scan} has no IMPLEMENTATION BATCH PLAN — nothing to check.`);
  else {
    L.push(`From ${cov.scan}. An item counts as shipped when a release block's CHANGES line opens with its ID.`, '');
    L.push('| Batch | Items | Shipped | Dropped | Not shipped |', '|---|---|---|---|---|');
    for (const b of cov.batches) L.push(`| ${b.name} | ${b.items.length} | ${b.shipped.join(', ') || '—'} | ${b.dropped.join(', ') || '—'} | ${b.missing.join(', ') || '—'} |`);
    const notes = [];
    if (cov.neverRun.length) notes.push(`Batches with nothing shipped or dropped (not run yet): ${cov.neverRun.join(', ')}`);
    if (cov.missing.length) notes.push(`Items missing from a batch that did run — neither shipped nor recorded as dropped: ${cov.missing.join(', ')}`);
    if (cov.plan.setAside.length) notes.push(`Set aside by the plan (Deferred / Not batched): ${cov.plan.setAside.join(', ')}${cov.setAsideShipped.length ? `; shipped anyway: ${cov.setAsideShipped.join(', ')}` : ''}`);
    if (cov.multiple.length) notes.push(`Shipped by more than one release: ${cov.multiple.map(m => `${m.id} (${m.releases.join(', ')})`).join('; ')}`);
    if (cov.unplanned.length) notes.push(`Shipped but not in the plan: ${cov.unplanned.join(', ')}`);
    L.push('', ...(notes.length ? notes.map(n => `- ${n}`) : ['Every batch that ran shipped or dropped each of its items, and nothing shipped outside the plan.']));
  }
  L.push('', '## Prior scores (Score History, oldest → newest — R22-2)', '');
  if (!series.length) L.push('No synthesis recorded yet: this is the first measurement for every category.');
  else {
    const names = Object.keys(series[series.length - 1].axisB);
    L.push(`| Axis B category | ${series.map(e => `C${e.cycle}`).join(' | ')} |`, `|---|${series.map(() => '---').join('|')}|`);
    for (const n of new Set(series.flatMap(e => Object.keys(e.axisB)))) L.push(`| ${n} | ${series.map(e => e.axisB[n] ?? '—').join(' | ')} |`);
    const gaps = synthesisGaps(series, Number(cycle));
    if (gaps.length) L.push('', `Cycles with no synthesis: ${gaps.join(', ')} — "consecutive" and every delta run across synthesized cycles only, so Cycle ${cycle}'s delta is against Cycle ${series[series.length - 1].cycle}.`);
    void names;
  }
  L.push('', `## Where each policy clause fires this cycle (threshold ${cfgPolicy.threshold}/10, ${cfgPolicy.consecutive} consecutive cycles)`, '');
  L.push('| Category | Prior | Decline | Sharp drop | Persistent laggard | Absolute floor |', '|---|---|---|---|---|---|');
  for (const t of thresholds) L.push(t.prior == null ? `| ${t.name} | — | ${t.note} | | | |` : `| ${t.name} | ${t.prior} | ${t.decline || 'cannot fire'} | ${t.sharpDrop} | ${t.laggard || 'cannot fire'} | ${t.floor} |`);
  if (rec.reports.length) L.push('', `(Saved audit report(s) read for the batch plan: ${rec.reports.join(', ')}.)`);
  if (excluded.length) L.push('', `(${excluded.length} block(s) from other cycles excluded.)`);
  return L.join('\n') + '\n';
}

function main(argv) {
  const opt = k => { const i = argv.indexOf(k); return i === -1 ? null : argv[i + 1]; };
  const root = resolve(opt('--root') || process.cwd());
  const cfg = read(join(root, '.cycle', 'config.md')) ?? read(join(root, 'CLAUDE.md')) ?? '';
  const metricsCsv = read(join(root, '.cycle', 'metrics.csv')) || '';
  const healthMd = read(join(root, 'PROJECT_HEALTH.md'));
  if (argv.includes('--check')) {
    if (healthMd == null) { console.log('✓ synthesis consistency skipped — this project keeps no PROJECT_HEALTH.md'); return 0; }
    const r = consistency({ healthMd, metricsCsv, cfg });
    if (r.skipped) { console.log(`✓ synthesis consistency skipped — ${r.skipped}`); return 0; }
    if (r.problems.length) { for (const p of r.problems) console.log(`  ✗ synthesis consistency (R22-3, INV-95): ${p}`); console.error(`\n${r.problems.length} disagreement(s) between the metrics row, Current Standing and the Score History entry.`); return 1; }
    console.log(`✓ the Cycle ${r.newest} synthesis agrees with itself — one cycle number, the lowest Axis B (${r.lowest.join(' / ')}), Category D and Overall the same in the metrics row, Current Standing and the Score History entry, and its policy triggers recomputed from the series (${r.computed.map(c => `${c.name}: ${c.clauses.join('+')}`).join('; ') || 'none'}) (INV-95)`);
    return 0;
  }
  let cycle = opt('--cycle'), chosenWhy = `Cycle ${cycle} (named with --cycle).`;
  if (cycle == null) {
    const state = read(join(root, '.cycle', 'STATE.md')) || '';
    cycle = (state.match(/^Cycle:\s*(\d+)/m) || [])[1];
    if (cycle == null) { console.error('No --cycle given and no Cycle field in .cycle/STATE.md.'); return 1; }
    const owed = pendingCloseOut(metricsCsv, cycle);
    if (owed != null && !cycleTotals(metricsCsv, cycle).rows) { chosenWhy = `Cycle ${owed}: STATE.md says Cycle ${cycle}, which has no reflect row, and Cycle ${owed} is reflected and never synthesized — it is the cycle owed.`; cycle = String(owed); }
    else chosenWhy = `Cycle ${cycle} (STATE.md's Cycle field).`;
  }
  const blocks = readBlocks(join(root, '.cycle', 'blocks'), { cycle });
  const rec = reconcile({ blocks, metricsCsv, cycle });
  const series = parseHistory(healthMd).filter(e => e.cycle < Number(cycle)).sort((a, b) => a.cycle - b.cycle);
  const cfgPolicy = policyConfig(cfg);
  const thresholds = triggerThresholds(series, cfgPolicy, axisBNames(cfg));
  const cov = planCoverage({ blocks });
  const out = render({ cycle, rec, cov, series, thresholds, cfgPolicy, excluded: blocks.excluded, chosenWhy });
  const file = opt('--out');
  if (file) { writeFileSync(file, out); console.log(`Wrote ${file}`); } else process.stdout.write(out);
  return 0;
}

const isMain = (() => { try { return !!process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } })();
if (isMain) process.exitCode = main(process.argv.slice(2));
