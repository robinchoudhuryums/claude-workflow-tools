#!/usr/bin/env node
// render-metrics.mjs — metrics visualization (ROADMAP R2).
//
// Renders .cycle/metrics.csv into a readable markdown trend report:
// a per-row table, ASCII sparklines for net score and Category D ratio,
// and a cumulative summary. Turns the per-cycle log into something you
// can actually read at a glance — the missing half of the metrics work.
//
// Usage:
//   node scripts/render-metrics.mjs [path-to-metrics.csv] [--out FILE]
//   (defaults to .cycle/metrics.csv; prints to stdout unless --out given)

import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outFile = outIdx !== -1 ? args[outIdx + 1] : null;
const input = args.find((a, i) => !a.startsWith('--') && (outIdx === -1 || i !== outIdx + 1)) || '.cycle/metrics.csv';

// Minimal CSV parser handling double-quoted fields (notes contain commas).
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field); if (row.length > 1 || row[0] !== '') rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const BLOCKS = '▁▂▃▄▅▆▇█';
function sparkline(nums) {
  const vals = nums.filter(n => Number.isFinite(n));
  if (!vals.length) return '';
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  return nums.map(n => Number.isFinite(n) ? BLOCKS[Math.round(((n - min) / span) * (BLOCKS.length - 1))] : '·').join('');
}
const pad = (s, n) => String(s).padEnd(n);

let text;
try { text = readFileSync(input, 'utf8'); }
catch { console.error(`No metrics file at ${input} — run a cycle (/reflect) first, or pass a path.`); process.exit(0); }

const rows = parseCSV(text);
if (rows.length < 2) { console.error('metrics file has no data rows.'); process.exit(0); }
const header = rows[0].map(h => h.trim());
const idx = name => header.indexOf(name);
const data = rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));

const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : NaN; };
const hasDef = idx('defensive_count') !== -1; // backward-compat: older files lack this column
const out = [];
out.push('# Cycle Metrics Report', '', `Source: \`${input}\` · ${data.length} rows · generated ${new Date().toISOString().slice(0, 10)}`, '');

// Per-row table (the "Def" column appears only when the file carries defensive_count)
out.push(`| date | cycle | phase | net | prod | new failure |${hasDef ? ' def |' : ''} Cat D | Axis B low | notes |`);
out.push(`|---|---|---|---|---|---|${hasDef ? '---|' : ''}---|---|---|`);
for (const d of data) {
  const note = (d.notes || '').replace(/\|/g, '\\|').slice(0, 70);
  const def = hasDef ? ` ${d.defensive_count || '—'} |` : '';
  out.push(`| ${d.date} | ${d.cycle} | ${d.phase} | ${d.net_score} | ${d.prod_fixes} | ${d.new_failure_modes} |${def} ${d.category_d_ratio || '—'} | ${(d.axis_b_lowest || '—').slice(0, 28)} | ${note} |`);
}
out.push('');

// Sparklines
const nets = data.map(d => num(d.net_score));
out.push('## Trend', '', '```', `net score    ${sparkline(nets)}  (${nets.map(n => Number.isFinite(n) ? n : '·').join(' ')})`);
const catD = data.filter(d => d.category_d_ratio).map(d => num(d.category_d_ratio));
if (catD.length) out.push(`category D %  ${sparkline(catD)}  (${catD.map(n => Number.isFinite(n) ? n + '%' : '·').join(' ')})  ← lower is better`);
out.push('```', '');

// Summary
const sum = key => data.reduce((a, d) => a + (num(d[key]) || 0), 0);
const totalProd = sum('prod_fixes'), totalNFM = sum('new_failure_modes'), cumNet = sum('net_score');
const lastSynth = [...data].reverse().find(d => d.phase === 'synthesis');
out.push('## Summary',
  `- Cumulative net score: **${cumNet}** (${totalProd} production fixes − ${totalNFM} new failure modes)`,
  `- Cycles recorded: ${new Set(data.map(d => d.cycle)).size}`,
  lastSynth ? `- Latest synthesis: net ${lastSynth.net_score}, Category D ${lastSynth.category_d_ratio || 'n/a'}, lowest Axis B = ${lastSynth.axis_b_lowest || 'n/a'}` : '- No synthesis row yet.');
if (hasDef) out.push(`- Defensive/structural items (secondary — not in net score): **${sum('defensive_count')}** — hardening work that the strict net-score gate excludes.`);
out.push('');

const report = out.join('\n');
if (outFile) { writeFileSync(outFile, report + '\n'); console.log(`Wrote ${outFile}`); }
else process.stdout.write(report + '\n');
