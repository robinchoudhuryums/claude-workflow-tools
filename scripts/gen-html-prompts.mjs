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
import vm from 'node:vm';

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

// ── dynamic-builder lock (R16) ──────────────────────────────
// The MANIFEST above covers the STATIC §-prompts (literal <pre> text). The
// DYNAMIC builders (buildTier1Text, …) render at runtime and inject per-project
// config, so they can't be byte-compared. Instead we render a builder headlessly
// and require 100% of the (transformed) canonical command lines to be PRESENT in
// its output — injected config shows up as extra, ignored lines.
//   locked:true  → gated by --assert (drift fails CI)
//   locked:false → report-only (tracked in the drift report, never fails CI),
//                  for builders whose canonical command delegates to siblings
//                  and so can't be locked without first making it standalone
//                  (ROADMAP R16: §T2a/§T2b/§6b paused on that decision).
export const DYNAMIC_MANIFEST = [
  { id: 'buildTier1Text',      command: 'broad-scan',         drop: false, project: 'obs',  locked: true  },
  { id: 'buildTier2AuditText', command: 'targeted-audit',     drop: true,  project: 'obs',  locked: false },
  { id: 'buildTier2ImplText',  command: 'targeted-implement', drop: true,  project: null,   locked: false },
  { id: 'buildP6bText',        command: 'health-pulse',       drop: false, project: 'obs',  locked: false },
];

// Coverage of a canonical command body by a rendered builder's output: every
// canonical line must be present (set membership after norm()).
export function canonicalCoverage(body, rendered, m) {
  const want = norm(transform(body, m));
  const have = new Set(norm(rendered));
  const missing = want.filter(l => !have.has(l));
  return { total: want.length, present: want.length - missing.length, missing };
}

// Execute the console's inline <script> under a stubbed DOM and return a
// builder's output. Inside a function (no import-time side effects) so the
// module stays import-safe (INV-28).
export function renderDynamicPrompt(html, builderId, projectId) {
  const sm = html.match(/<script>([\s\S]*)<\/script>/);
  if (!sm) return null;
  const store = {};
  const dummy = new Proxy(
    { style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, querySelectorAll: () => [], addEventListener() {} },
    { get(t, p) { return p in t ? t[p] : (() => {}); } });
  const ctx = {
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, get length() { return Object.keys(store).length; }, key: i => Object.keys(store)[i] },
    document: { getElementById: () => dummy, querySelector: () => dummy, querySelectorAll: () => [], addEventListener() {}, body: dummy, createElement: () => ({ click() {}, style: {}, appendChild() {} }) },
    navigator: { clipboard: { writeText: () => Promise.resolve() } }, window: { addEventListener() {} },
    IntersectionObserver: class { observe() {} disconnect() {} }, MutationObserver: class { observe() {} disconnect() {} },
    Blob: class {}, URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} }, FileReader: class { readAsText() {} },
    console, setTimeout: () => 0, clearTimeout() {}, alert: () => {}, confirm: () => true, Date, Math, JSON, Object, Array, Set, RegExp,
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(sm[1], ctx, { filename: 'console' });
  const fn = ctx[builderId];
  if (typeof fn !== 'function') return null;
  return projectId ? fn(ctx.getProject(projectId)) : fn();
}

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
    // Locked dynamic builders (R16): require 100% canonical-line coverage.
    const locked = DYNAMIC_MANIFEST.filter(d => d.locked);
    for (const d of locked) {
      const body = commandBody(claudeMd, d.command);
      const rendered = renderDynamicPrompt(html, d.id, d.project);
      if (body == null || rendered == null) { console.error(`  ! ${d.id} ← /${d.command}: ${body == null ? 'command body' : 'render'} not found`); drift++; continue; }
      const cov = canonicalCoverage(body, rendered, d);
      if (cov.missing.length) { console.error(`  ✗ ${d.id} is missing ${cov.missing.length}/${cov.total} canonical lines from /${d.command} (locked):\n      - ${cov.missing.slice(0, 3).join('\n      - ')}`); drift++; }
    }
    if (drift) { console.error(`\n${drift} console prompt(s) drifted from CLAUDE.md — run: node scripts/gen-html-prompts.mjs --write (static) or reconcile the builder (dynamic)`); return 1; }
    console.log(`All ${MANIFEST.length} console §-prompts match CLAUDE.md. ✓`);
    console.log(`All ${locked.length} locked dynamic builder(s) cover their canonical command. ✓`);
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

  // Dynamic builders (R16): render headlessly + report canonical-line coverage.
  console.log('\nDynamic builder ↔ canonical command coverage (R16):');
  for (const d of DYNAMIC_MANIFEST) {
    const body = commandBody(claudeMd, d.command);
    const rendered = renderDynamicPrompt(html, d.id, d.project);
    if (body == null || rendered == null) { console.log(`  ? ${d.id} ← /${d.command}: not found`); continue; }
    const cov = canonicalCoverage(body, rendered, d);
    const pct = cov.total ? Math.round(100 * cov.present / cov.total) : 100;
    console.log(`  ${d.locked ? '🔒' : '  '} ${d.id} ← /${d.command}: ${pct}% of ${cov.total} canonical lines present | ${cov.missing.length} missing${d.locked ? ' [LOCKED]' : ' (report-only — paused on R16 standalone-vs-canonical decision)'}`);
  }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main(process.argv.slice(2)));
}
