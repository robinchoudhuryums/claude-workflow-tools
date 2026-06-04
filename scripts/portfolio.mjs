#!/usr/bin/env node
// portfolio.mjs — cross-project portfolio dashboard (ROADMAP R8).
//
// Aggregates several projects' PROJECT_HEALTH.md "Current Standing"
// sections into one board so you can see, across your whole portfolio,
// which project most needs attention. Pass the PROJECT_HEALTH.md paths:
//
//   node scripts/portfolio.mjs ../pers-fin/PROJECT_HEALTH.md ../obs/PROJECT_HEALTH.md
//   node scripts/portfolio.mjs            # defaults to ./PROJECT_HEALTH.md
//   ... [--out FILE]                      # write instead of printing
//
// Each project is labelled by its containing directory name.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, basename, resolve } from 'node:path';

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
const field = (txt, label) => { const m = txt.match(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(.+)')); return m ? m[1].trim() : ''; };

const projects = [];
for (const p of paths) {
  let md;
  try { md = readFileSync(p, 'utf8'); }
  catch { console.error(`! skipped ${p} (cannot read)`); continue; }
  const standing = section(md, 'Current Standing');
  if (!standing.trim()) { console.error(`! skipped ${p} (no "## Current Standing" section)`); continue; }
  const overallStr = field(standing, 'Overall (weighted avg):');
  const overall = parseFloat(overallStr);
  projects.push({
    label: basename(dirname(resolve(p))) || p,
    overall: Number.isFinite(overall) ? overall : null,
    overallStr: overallStr || '—',
    lastSynthesis: field(standing, 'Last synthesis:') || '—',
    summary: field(standing, 'One-line summary:') || '',
    topV: field(standing, 'Top vertical priority:') || '—',
    topH: field(standing, 'Top horizontal priority:') || '—',
  });
}

if (!projects.length) { console.error('No readable PROJECT_HEALTH.md files with a Current Standing section.'); process.exit(1); }

// Lowest overall first = most in need of attention (nulls last).
const ranked = [...projects].sort((a, b) => (a.overall ?? 99) - (b.overall ?? 99));
const out = [];
out.push('# Portfolio Health', '', `${projects.length} project(s) · generated ${new Date().toISOString().slice(0, 10)}`, '');
out.push('| Project | Overall | Last synthesis | Top vertical priority | Top horizontal priority |');
out.push('|---|---|---|---|---|');
for (const p of ranked) out.push(`| ${p.label} | ${p.overallStr} | ${p.lastSynthesis} | ${p.topV.slice(0, 40)} | ${p.topH.slice(0, 40)} |`);
out.push('');
const scored = ranked.filter(p => p.overall !== null);
if (scored.length) {
  const low = scored[0];
  const avg = (scored.reduce((a, p) => a + p.overall, 0) / scored.length).toFixed(1);
  out.push('## Read', `- Portfolio average overall: **${avg}/10** across ${scored.length} scored project(s).`, `- **Audit next: ${low.label}** (${low.overallStr}) — lowest overall.${low.summary ? ' ' + low.summary : ''}`);
  const unscored = ranked.filter(p => p.overall === null);
  if (unscored.length) out.push(`- No synthesis score yet: ${unscored.map(p => p.label).join(', ')} — run a Health Synthesis.`);
}
const report = out.join('\n');
if (outFile) { writeFileSync(outFile, report + '\n'); console.log(`Wrote ${outFile}`); }
else process.stdout.write(report + '\n');
