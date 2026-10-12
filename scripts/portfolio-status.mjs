#!/usr/bin/env node
// portfolio-status.mjs — cross-project development-status board (ROADMAP R15).
//
// portfolio.mjs (R8) ranks projects by HEALTH SCORE (it reads only the
// PROJECT_HEALTH.md "Current Standing" block). This sibling adds DEVELOPMENT
// STATUS by joining that score with the `.cycle/` data each project already
// writes — STATE.md (Phase, "Subsystem cycles since last Seams audit",
// Updated) and metrics.csv (net-score trend) — so one board answers "what's
// the state of each project, and where's my next action," not just "which is
// unhealthiest."
//
//   node scripts/portfolio-status.mjs ../obs/PROJECT_HEALTH.md ../cla/PROJECT_HEALTH.md
//   node scripts/portfolio-status.mjs              # defaults to ./PROJECT_HEALTH.md
//   ... [--out FILE]                               # write instead of printing
//
// Each project is labelled by its containing directory; the `.cycle/` dir is
// looked for next to the PROJECT_HEALTH.md. Projects with no `.cycle/` (pure
// copy-paste workflow) still list, with status columns shown as "—".

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, basename, resolve, join } from 'node:path';
import { parseCSV } from './csv.mjs';
import { HEALTH_FIELDS, HEALTH_SECTION } from './health-fields.mjs';   // INV-71

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outFile = outIdx !== -1 ? args[outIdx + 1] : null;
const paths = args.filter((a, i) => !a.startsWith('--') && (outIdx === -1 || i !== outIdx + 1));
if (!paths.length) paths.push('PROJECT_HEALTH.md');

function section(md, heading) {
  const lines = md.split('\n');
  const i = lines.findIndex(l => /^##\s+/.test(l) && l.replace(/^##\s+/, '').trim().toLowerCase().startsWith(heading.toLowerCase()));
  if (i === -1) return '';
  const body = [];
  for (let j = i + 1; j < lines.length; j++) { if (/^##\s+/.test(lines[j])) break; body.push(lines[j]); }
  return body.join('\n');
}
// F40 (Cycle 7): the value ends at the END OF ITS LINE. `\s*(.+)` let \s cross
// the newline, so an empty "Last synthesis:" captured the next line's label.
const field = (txt, label) => { const m = txt.match(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[ \\t]*([^\\r\\n]*)')); return m ? m[1].trim() : ''; };
// A pipe inside a value would open an extra table column.
const cell = v => String(v).replace(/\|/g, '\\|');

// Seams cadence N (default 4) from config.md / CLAUDE.md ("every N subsystem cycles").
// F36 (Cycle 7): read the first "every N subsystem" LINE under the heading. The
// old regex matched anywhere within 120 chars of "seams audit cadence", and the
// /setup-cycle OUTPUT 1 heading itself reads "← optional; default: every 4
// subsystem cycles" — so a project that pasted it verbatim always got 4.
function seamsCadence(cycleDir, root) {
  for (const f of [join(cycleDir, 'config.md'), join(root, 'CLAUDE.md')]) {
    if (!existsSync(f)) continue;
    const lines = readFileSync(f, 'utf8').split(/\r?\n/);
    const h = lines.findIndex(l => /^#+\s*Seams Audit Cadence\b/i.test(l));
    if (h === -1) continue;
    for (let i = h + 1; i < lines.length && !/^#/.test(lines[i]); i++) {
      const m = lines[i].match(/^\s*every\s+(\d+)\s+subsystem/i);
      if (m) return parseInt(m[1], 10);
    }
  }
  return 4;
}

// Net-score trend from metrics.csv: sum net_score per cycle, compare the last
// two cycles that carry data. F03: rows are parsed quote-aware — the previous
// bare split assumed only `notes` could hold a comma, and a subsystem such as
// "Auth, Security & HIPAA" shifted net_score under the phase column, so every
// such row was silently skipped and the trend read "—".
// F39 (Cycle 7): parsed as a whole text by the one parser, so a quoted notes
// field containing a newline no longer splits its row. F32: synthesis rows are
// skipped — net_score is owned by reflect rows, and an older synthesis row that
// carries one would count the cycle twice.
function netTrend(metricsFile) {
  if (!existsSync(metricsFile)) return '—';
  const rows = parseCSV(readFileSync(metricsFile, 'utf8'));
  if (rows.length < 2) return '—';
  const header = rows[0].map(h => h.trim());
  const ci = header.indexOf('cycle'), ni = header.indexOf('net_score'), pi = header.indexOf('phase');
  if (ci === -1 || ni === -1) return '—';
  const perCycle = new Map();
  for (const cells of rows.slice(1)) {
    if (pi !== -1 && (cells[pi] || '').trim() === 'synthesis') continue;
    const cyc = (cells[ci] || '').trim();
    const net = parseFloat(cells[ni]);
    if (!cyc || !Number.isFinite(net)) continue;
    perCycle.set(cyc, (perCycle.get(cyc) || 0) + net);
  }
  const cycles = [...perCycle.keys()].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
  if (cycles.length < 2) return cycles.length === 1 ? '→' : '—';
  const last = perCycle.get(cycles[cycles.length - 1]);
  const prev = perCycle.get(cycles[cycles.length - 2]);
  return last > prev ? '↑' : last < prev ? '↓' : '→';
}

const projects = [];
for (const p of paths) {
  let md;
  try { md = readFileSync(p, 'utf8'); }
  catch { console.error(`! skipped ${p} (cannot read)`); continue; }
  const standing = section(md, HEALTH_SECTION);
  const overall = parseFloat(field(standing, HEALTH_FIELDS.overall));
  const root = dirname(resolve(p));
  const cycleDir = join(root, '.cycle');
  const statePath = join(cycleDir, 'STATE.md');

  let phase = '—', updated = '', seamsK = null, hasState = false;
  if (existsSync(statePath)) {
    hasState = true;
    const state = readFileSync(statePath, 'utf8');
    // Phase: keep the leading word(s) before any parenthetical/qualifier.
    const rawPhase = field(state, 'Phase:');
    phase = rawPhase ? rawPhase.replace(/\s*[(—-].*$/, '').trim() || rawPhase.trim() : '—';
    updated = field(state, 'Updated:');
    const km = state.match(/Subsystem cycles since last Seams audit:\s*(\d+)/i);
    if (km) seamsK = parseInt(km[1], 10);
  }
  const inProgress = !hasState ? '—' : (phase && phase.toLowerCase() !== 'idle' ? 'yes' : 'no');
  const cadence = hasState ? seamsCadence(cycleDir, root) : null;
  const seamsDue = seamsK !== null && cadence !== null && seamsK >= cadence;
  const seamsCell = seamsK === null ? '—' : `${seamsK}/${cadence}${seamsDue ? ' DUE' : ''}`;
  const trend = netTrend(join(cycleDir, 'metrics.csv'));

  projects.push({
    label: basename(root) || p,
    overall: Number.isFinite(overall) ? overall : null,
    overallStr: field(standing, HEALTH_FIELDS.overall) || '—',
    phase, inProgress, trend, seamsCell, seamsDue,
    updated: updated || field(standing, HEALTH_FIELDS.lastSynthesis) || '—',
  });
}

if (!projects.length) { console.error('No readable PROJECT_HEALTH.md files.'); process.exit(1); }

// Lowest overall first = most in need of attention (nulls last).
const ranked = [...projects].sort((a, b) => (a.overall ?? 99) - (b.overall ?? 99));
const out = [];
out.push('# Portfolio Status', '', `${projects.length} project(s) · generated ${new Date().toISOString().slice(0, 10)}`, '');
out.push('| Project | Overall | Phase | In-progress | Net Δ | Seams | Updated |');
out.push('|---|---|---|---|---|---|---|');
for (const p of ranked) out.push(`| ${cell(p.label)} | ${cell(p.overallStr)} | ${cell(p.phase)} | ${p.inProgress} | ${p.trend} | ${p.seamsCell} | ${cell(p.updated)} |`);
out.push('');

out.push('## Read');
const scored = ranked.filter(p => p.overall !== null);
if (scored.length) {
  const avg = (scored.reduce((a, p) => a + p.overall, 0) / scored.length).toFixed(1);
  out.push(`- Portfolio average overall: **${avg}/10** across ${scored.length} scored project(s).`);
  out.push(`- **Audit next: ${scored[0].label}** (${scored[0].overallStr}) — lowest overall.`);
}
const wip = ranked.filter(p => p.inProgress === 'yes');
if (wip.length) out.push(`- **In progress (resume): ${wip.map(p => `${p.label} (${p.phase})`).join(', ')}** — run /cycle-resume.`);
const due = ranked.filter(p => p.seamsDue);
if (due.length) out.push(`- **Seams audit DUE: ${due.map(p => p.label).join(', ')}** — run a Seams & Invariants audit.`);
const unscored = ranked.filter(p => p.overall === null);
if (unscored.length) out.push(`- No synthesis score yet: ${unscored.map(p => p.label).join(', ')} — run a Health Synthesis.`);
out.push('', '_Net Δ = direction of summed net_score between the last two recorded cycles (volume of fixes, not a health delta)._');

const report = out.join('\n');
if (outFile) { writeFileSync(outFile, report + '\n'); console.log(`Wrote ${outFile}`); }
else process.stdout.write(report + '\n');
