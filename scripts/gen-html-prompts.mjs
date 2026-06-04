#!/usr/bin/env node
// gen-html-prompts.mjs — CLAUDE.md → HTML console prompt transform (ROADMAP R14, option a).
//
// The console's static §-prompts are a hand-maintained "fourth copy" of the
// canonical command bodies in CLAUDE.md and can silently drift (Cycle 1
// F02/F03). This is the transform engine + generated-vs-committed check that
// makes CLAUDE.md the source for the prompt BODY while a small per-prompt
// MANIFEST holds the console-specific framing (placeholders / preamble).
//
//   node scripts/gen-html-prompts.mjs          # read-only drift report
//   node scripts/gen-html-prompts.mjs --write   # rewrite the HTML <pre> blocks
//
// NOTE: --write changes the console's primary surface and its result can only
// be fully verified in a browser, so it is never run by CI. The default
// (drift report) is safe and is what the report/guard uses.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ── pure, testable helpers ──────────────────────────────────
export function commandBody(md, name) {
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!new RegExp(`^### /${name}\\s*$`).test(lines[i])) continue;
    let j = i + 1;
    while (j < lines.length && j <= i + 3 && lines[j].trim() !== '```') j++;
    if (lines[j]?.trim() !== '```') return null;
    const body = [];
    for (j++; j < lines.length && lines[j].trim() !== '```'; j++) body.push(lines[j]);
    return body.join('\n').trim();
  }
  return null;
}
export const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
export const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function preBody(html, id) {
  const m = html.match(new RegExp(`<pre id="${id}">([\\s\\S]*?)</pre>`));
  return m ? unesc(m[1]) : null;
}
export function transform(body, m) {
  let t = body;
  if (m.drop) { const i = t.indexOf('\n---\n'); if (i !== -1) t = t.slice(i + 5).trim(); }
  for (const [a, b] of (m.replace || [])) t = t.split(a).join(b);
  return t;
}
export function norm(text) {
  return (text || '').split('\n').map(l => l.trim())
    .filter(l => l && !/^\[.*\]$/.test(l))
    .map(l => l.toLowerCase());
}

// console <pre id> ← canonical command (+ console framing rules)
export const MANIFEST = [
  { id: 'p0', command: 'systems-map', drop: false, replace: [] },
  { id: 'p1', command: 'audit', drop: true, replace: [['$ARGUMENTS', '[SUBSYSTEM GROUP NAME]']] },
  { id: 'p2', command: 'plan', drop: true, replace: [] },
  { id: 'p3', command: 'implement', drop: true, replace: [] },
  { id: 'p4post', command: 'regression', drop: false, replace: [] },
  { id: 'p4reflect', command: 'reflect', drop: false, replace: [] },
  { id: 'p5', command: 'roadmap', drop: false, replace: [] },
];

function main(argv) {
  const root = new URL('..', import.meta.url);
  const claudeMd = readFileSync(new URL('CLAUDE.md', root), 'utf8');
  const htmlPath = new URL('claude-code-guide-v2.html', root);
  const html = readFileSync(htmlPath, 'utf8');

  if (argv.includes('--write')) {
    let updated = html, n = 0;
    for (const m of MANIFEST) {
      const body = commandBody(claudeMd, m.command);
      if (body == null) { console.error(`! no command body for /${m.command}`); continue; }
      const re = new RegExp(`(<pre id="${m.id}">)([\\s\\S]*?)(</pre>)`);
      if (!re.test(updated)) { console.error(`! no <pre id="${m.id}"> in HTML`); continue; }
      const gen = esc(transform(body, m));
      updated = updated.replace(re, (_match, open, _cur, close) => open + gen + close); n++;
    }
    writeFileSync(htmlPath, updated);
    console.log(`Rewrote ${n} console prompt(s) from CLAUDE.md. VERIFY RENDERING IN A BROWSER before relying on it.`);
    return 0;
  }

  if (argv.includes('--assert')) {
    let drift = 0;
    for (const m of MANIFEST) {
      const body = commandBody(claudeMd, m.command);
      const cur = preBody(html, m.id);
      if (body == null || cur == null) { console.error(`  ! ${m.id} ← /${m.command}: ${body == null ? 'command body' : '<pre>'} not found`); drift++; continue; }
      if (cur.trim() !== transform(body, m).trim()) { console.error(`  ✗ ${m.id} has drifted from /${m.command}`); drift++; }
    }
    if (drift) { console.error(`\n${drift} console prompt(s) drifted from CLAUDE.md — run: node scripts/gen-html-prompts.mjs --write`); return 1; }
    console.log(`All ${MANIFEST.length} console §-prompts match CLAUDE.md. ✓`);
    return 0;
  }

  console.log('HTML console prompt ↔ CLAUDE.md command drift report:\n');
  let totalDrift = 0;
  for (const m of MANIFEST) {
    const body = commandBody(claudeMd, m.command);
    const cur = preBody(html, m.id);
    if (body == null || cur == null) { console.log(`  ? ${m.id} ← /${m.command}: ${body == null ? 'command body' : '<pre>'} not found`); continue; }
    const want = new Set(norm(transform(body, m)));
    const have = new Set(norm(cur));
    const present = [...want].filter(l => have.has(l)).length;
    const missing = want.size - present;
    totalDrift += missing;
    console.log(`  ${m.id} ← /${m.command}: ${want.size ? Math.round(100 * present / want.size) : 100}% of canonical lines present | ${missing} missing | ${[...have].filter(l => !want.has(l)).length} console-only`);
  }
  console.log(`\nTotal canonical lines missing from the console: ${totalDrift}`);
  console.log('Run with --write to regenerate the console <pre> blocks from CLAUDE.md (then verify rendering in a browser).');
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main(process.argv.slice(2)));
}
