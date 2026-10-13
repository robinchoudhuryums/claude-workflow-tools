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

import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
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
// Like commandBody, but extracts the first fenced block under a NON-slash
// heading (### <prefix>…). The cycle-type prompts §4v/§1s/§6a are not slash
// commands, so this gives them a lockable canonical body without minting a
// .claude/commands/ file. Scans to the first ``` fence before the next ###.
export function sectionBody(md, headingPrefix) {
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('### ') || !lines[i].slice(4).startsWith(headingPrefix)) continue;
    let j = i + 1;
    for (; j < lines.length; j++) {
      if (lines[j].startsWith('### ')) return null;   // hit next heading — no fenced body
      if (lines[j].trim() === '```') break;
    }
    if (lines[j]?.trim() !== '```') return null;
    const body = [];
    for (j++; j < lines.length && lines[j].trim() !== '```'; j++) body.push(lines[j]);
    return body.join('\n').trim();
  }
  return null;
}
export const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
export const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// F48 (Cycle 7): <pre> detection is attribute-order-agnostic. Every scan used
// the literal `<pre id="X">`, so a prompt written `<pre class="p" id="X">` (or
// with no id at all) was invisible to the lock-coverage check — a static prompt
// outside every lock, reported as "every static <pre> is locked". <pre> markup
// inside <script> (the archive renderer's template) is not a console prompt.
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const preRe = id => new RegExp(`(<pre\\b[^>]*?\\sid\\s*=\\s*["']${reEsc(id)}["'][^>]*>)([\\s\\S]*?)(</pre>)`, 'i');
export function scanPres(html) {
  const out = [];
  for (const m of html.replace(/<script\b[\s\S]*?<\/script>/gi, '').matchAll(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi))
    out.push({ id: (m[1].match(/(?:^|\s)id\s*=\s*["']([^"']+)["']/i) || [])[1] || null, body: m[2] });
  return out;
}
export function preBody(html, id) {
  const m = html.match(preRe(id));
  return m ? unesc(m[2]) : null;
}
export function transform(body, m) {
  let t = body;
  if (m.drop) { const i = t.indexOf('\n---\n'); if (i !== -1) t = t.slice(i + 5).trim(); }
  for (const [a, b] of (m.replace || [])) t = t.split(a).join(b);
  return t;
}
// F46 (Cycle 7): only a line that is ONE bracket token is a render-time
// placeholder ("[the project subsystem list is injected here per project]").
// The old /^\[.*\]$/ also dropped every line made of several tokens — 34
// canonical row schemas such as "[ID] | [File: function/line] | …" — so a
// builder could delete an output-block row and still pass the lock. Lines are
// no longer lowercased either: a changed case is a changed prompt (F47).
export function norm(text) {
  return (text || '').split('\n').map(l => l.trim())
    .filter(l => l && !/^\[[^\][]*\]$/.test(l));
}

// console <pre id> ← canonical body (+ console framing rules).
// An entry names EITHER a slash `command:` or a `section:` heading in CLAUDE.md
// (resolved by dynBody, the same resolver the dynamic lock uses). The section
// form exists because nine static prompts had no slash-command counterpart and
// therefore sat outside every lock — including `setup`, which DID have one and
// had silently decayed to a pre-R18 copy that never asks about a user-facing
// surface (Cycle-6 F16). Anything rendered into a <pre> is now locked.
export const MANIFEST = [
  { id: 'p0', command: 'systems-map', drop: false, replace: [] },
  { id: 'p1', command: 'audit', drop: true, replace: [['$ARGUMENTS', '[SUBSYSTEM GROUP NAME]']] },
  { id: 'p2', command: 'plan', drop: true, replace: [] },
  { id: 'p3', command: 'implement', drop: true, replace: [] },
  { id: 'p4post', command: 'regression', drop: false, replace: [] },
  { id: 'p4reflect', command: 'reflect', drop: false, replace: [] },
  { id: 'p5', command: 'roadmap', drop: false, replace: [] },
  // F16 — was the largest unlocked prompt, and the drift was real: 36 canonical
  // lines missing, among them the whole "user-facing surfaces" profile step and
  // the interface-dimension instruction R18 shipped in v1.19.0.
  { id: 'psetup', command: 'setup-cycle', drop: false, replace: [] },
  // F16 — no slash command exists for these; their canonical body now lives
  // under "## Console Reference Prompts" in CLAUDE.md.
  { id: 'p1sec', section: 'Console Prompt — Security & Compliance Audit Add-on', label: '§1 security add-on', drop: false, replace: [] },
  { id: 'p1perf', section: 'Console Prompt — Performance & Scalability Audit Add-on', label: '§1 performance add-on', drop: false, replace: [] },
  { id: 'p3single', section: 'Console Prompt — Single-Finding Implementation', label: '§3 single-finding variant', drop: false, replace: [] },
  { id: 'p4pre', section: 'Console Prompt — Pre-Implementation Dependency Check', label: '§4 pre-implementation check', drop: false, replace: [] },
  { id: 'p5opts', section: 'Console Prompt — Roadmap Add-ons', label: '§5 roadmap add-ons', drop: false, replace: [] },
  { id: 'p7claude', section: 'Console Prompt — Project Health Pointer', label: '§7 CLAUDE.md addition', drop: false, replace: [] },
  { id: 'p7tmpl', section: 'Console Prompt — PROJECT_HEALTH.md Template', label: '§7 PROJECT_HEALTH template', drop: false, replace: [] },
  { id: 'vblockref', section: 'Console Prompt — Verification Block Output Reference', label: '§4v block reference', drop: false, replace: [] },
];

// ── dynamic-builder lock (R16) ──────────────────────────────
// The MANIFEST above covers the STATIC §-prompts (literal <pre> text). The
// DYNAMIC builders (buildTier1Text, …) render at runtime and inject per-project
// config, so they can't be byte-compared. Instead we render a builder headlessly
// and require 100% of the (transformed) canonical command lines to be PRESENT in
// its output — injected config shows up as extra, ignored lines.
//   locked:true  → gated by --assert (drift fails CI). §T1, §T2a, §6b.
//   locked:false → report-only (tracked in the drift report, never fails CI),
//                  for a builder whose canonical command DELEGATES to a sibling
//                  ("see /broad-implement Step 1"), so the console — which must be
//                  standalone — legitimately diverges. Guarded by the R16-S parity
//                  markers instead of the textual lock. §T2b only (ROADMAP R16,
//                  resolved via option (b)).
export const DYNAMIC_MANIFEST = [
  { id: 'buildTier1Text',      command: 'broad-scan',         drop: false, project: 'obs',  locked: true  },
  { id: 'buildTier2AuditText', command: 'targeted-audit',     drop: true,  project: 'obs',  locked: true,  replace: [['$ARGUMENTS', '[SUBSYSTEM GROUP NAME]']] },
  { id: 'buildP6bText',        command: 'health-pulse',       drop: false, project: 'obs',  locked: true  },
  // F21/F03 — added already locked, so neither can decay into another §T2b.
  { id: 'buildTier1ImplText',  command: 'broad-implement',    drop: true,  project: null,   locked: true,  replace: [['$ARGUMENTS', '[FINDING IDS TO IMPLEMENT]']] },
  { id: 'buildPrReviewText',   command: 'pr-review',          drop: true,  project: 'obs',  locked: true,  replace: [['$ARGUMENTS', '[PR NUMBER OR URL]']] },
  // §T2b was the last report-only builder. Its exemption rested on canonical
  // /targeted-implement delegating to /broad-implement Step 1 while the console
  // had no /broad-implement prompt to delegate TO — so the console diverged to
  // stay standalone. F21 added that prompt, so the premise is gone; and because
  // canonicalCoverage only requires canonical lines to be PRESENT (extras are
  // ignored), the console can carry the expanded Step-1 detail AND be locked.
  // Every dynamic builder is now locked — there is no report-only tier left.
  { id: 'buildTier2ImplText',  command: 'targeted-implement', drop: true,  project: null,   locked: true  },
  // §4v/§1s/§6a are cycle-type prompts, NOT slash commands — their canonical body
  // lives in a fenced block under a ### section heading (sectionBody), so locking
  // them doesn't mint a /command file (W1 full textual lock — ROADMAP R16).
  { id: 'buildVerificationText', section: 'Verification Pass', label: '§4v Verification Pass', drop: false, project: 'obs', locked: true },
  { id: 'buildSeamsText',        section: 'Seams & Invariants Audit', label: '§1s Seams & Invariants', drop: false, project: 'obs', locked: true },
  { id: 'buildP6aText',          section: 'Health Synthesis', label: '§6a Health Synthesis', drop: false, project: 'obs', locked: true },
];

// Resolve a manifest entry's canonical body + label, whether sourced from a
// slash command (commandBody) or a ### section (sectionBody).
export const dynBody = (md, d) => (d.section ? sectionBody(md, d.section) : commandBody(md, d.command));
export const dynLabel = d => d.label || (d.section ? d.section : '/' + d.command);

// Coverage of a canonical command body by a rendered builder's output: the
// canonical lines must appear IN ORDER, once per occurrence — a subsequence of
// the rendered lines, which may carry extra (injected) lines between them.
// F47 (Cycle 7): this was set membership, so §4v's "must NOT have participated"
// guard moved from the top of the prompt to the very end passed, as did
// dropping one copy of a line that appears twice. A line present only out of
// order is reported in `outOfOrder`; one absent everywhere in `missing`. The
// in-order set is a longest common subsequence, so a moved line is blamed —
// not the lines it jumped over (an earliest-match scan blames those instead).
export function canonicalCoverage(body, rendered, m) {
  const want = norm(transform(body, m)), have = norm(rendered);
  const W = want.length, H = have.length;
  const L = Array.from({ length: W + 1 }, () => new Uint16Array(H + 1));
  for (let i = W - 1; i >= 0; i--)
    for (let k = H - 1; k >= 0; k--)
      L[i][k] = want[i] === have[k] ? L[i + 1][k + 1] + 1 : Math.max(L[i + 1][k], L[i][k + 1]);
  const inOrder = new Array(W).fill(false), used = new Array(H).fill(false);
  for (let i = 0, k = 0; i < W && k < H;) {
    if (want[i] === have[k]) { inOrder[i] = used[k] = true; i++; k++; }
    else if (L[i + 1][k] >= L[i][k + 1]) i++; else k++;
  }
  // What the subsequence did not use is still available to explain a line as
  // moved rather than absent — once per remaining occurrence.
  const spare = new Map();
  have.forEach((l, k) => { if (!used[k]) spare.set(l, (spare.get(l) || 0) + 1); });
  const missing = [], outOfOrder = [];
  want.forEach((l, i) => {
    if (inOrder[i]) return;
    if ((spare.get(l) || 0) > 0) { outOfOrder.push(l); spare.set(l, spare.get(l) - 1); } else missing.push(l);
  });
  return { total: want.length, present: want.length - missing.length - outOfOrder.length, missing, outOfOrder };
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
      const body = dynBody(claudeMd, m);
      if (body == null) { console.error(`! no canonical body for ${dynLabel(m)}`); continue; }
      const re = preRe(m.id);
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
      const body = dynBody(claudeMd, m);
      const cur = preBody(html, m.id);
      if (body == null || cur == null) { console.error(`  ! ${m.id} ← ${dynLabel(m)}: ${body == null ? 'canonical body' : '<pre>'} not found`); drift++; continue; }
      if (cur.trim() !== transform(body, m).trim()) { console.error(`  ✗ ${m.id} has drifted from ${dynLabel(m)}`); drift++; }
    }
    // F16 — DERIVED lock coverage. A <pre> with literal text is a static prompt
    // and must be in MANIFEST; an empty one is written by a builder and is
    // covered by the dynamic lock below. Without this, a new static prompt is
    // simply unlocked and nothing says so — which is how nine of them
    // accumulated, and how the audit that found them still under-counted by one.
    const staticPres = scanPres(html).filter(p => p.body.trim().length).map(p => p.id || '(a <pre> with no id — it cannot be locked)');
    const covered = new Set(MANIFEST.map(m => m.id));
    const unlocked = staticPres.filter(id => !covered.has(id));
    if (!staticPres.length) { console.error('  ! no static <pre> prompts found — the lock-coverage check would be vacuous'); drift++; }
    else if (unlocked.length) { console.error(`  ✗ ${unlocked.length} static console prompt(s) outside the lock manifest: ${unlocked.join(', ')}`); drift++; }
    // Locked dynamic builders (R16): every canonical line present, in order (F47).
    const locked = DYNAMIC_MANIFEST.filter(d => d.locked);
    for (const d of locked) {
      const body = dynBody(claudeMd, d);
      const rendered = renderDynamicPrompt(html, d.id, d.project);
      if (body == null || rendered == null) { console.error(`  ! ${d.id} ← ${dynLabel(d)}: ${body == null ? 'canonical body' : 'render'} not found`); drift++; continue; }
      const cov = canonicalCoverage(body, rendered, d);
      if (cov.missing.length) { console.error(`  ✗ ${d.id} is missing ${cov.missing.length}/${cov.total} canonical lines from ${dynLabel(d)} (locked):\n      - ${cov.missing.slice(0, 3).join('\n      - ')}`); drift++; }
      if (cov.outOfOrder.length) { console.error(`  ✗ ${d.id} has ${cov.outOfOrder.length}/${cov.total} canonical line(s) OUT OF ORDER vs ${dynLabel(d)} (locked) — present, but not where the canonical body puts them (F47):\n      - ${cov.outOfOrder.slice(0, 3).join('\n      - ')}`); drift++; }
    }
    if (drift) { console.error(`\n${drift} console prompt(s) drifted from CLAUDE.md — run: node scripts/gen-html-prompts.mjs --write (static) or reconcile the builder (dynamic)`); return 1; }
    console.log(`All ${MANIFEST.length} console §-prompts match CLAUDE.md — every static <pre> is locked. ✓`);
    console.log(`All ${locked.length} locked dynamic builder(s) cover their canonical command. ✓`);
    return 0;
  }

  console.log('HTML console prompt ↔ CLAUDE.md command drift report:\n');
  let totalDrift = 0;
  for (const m of MANIFEST) {
    const body = dynBody(claudeMd, m);
    const cur = preBody(html, m.id);
    if (body == null || cur == null) { console.log(`  ? ${m.id} ← ${dynLabel(m)}: ${body == null ? 'canonical body' : '<pre>'} not found`); continue; }
    const want = new Set(norm(transform(body, m)));
    const have = new Set(norm(cur));
    const present = [...want].filter(l => have.has(l)).length;
    const missing = want.size - present;
    totalDrift += missing;
    console.log(`  ${m.id} ← ${dynLabel(m)}: ${want.size ? Math.round(100 * present / want.size) : 100}% of canonical lines present | ${missing} missing | ${[...have].filter(l => !want.has(l)).length} console-only`);
  }
  console.log(`\nTotal canonical lines missing from the console: ${totalDrift}`);
  console.log('Run with --write to regenerate the console <pre> blocks from CLAUDE.md (then verify rendering in a browser).');

  // Dynamic builders (R16): render headlessly + report canonical-line coverage.
  console.log('\nDynamic builder ↔ canonical command coverage (R16):');
  for (const d of DYNAMIC_MANIFEST) {
    const body = dynBody(claudeMd, d);
    const rendered = renderDynamicPrompt(html, d.id, d.project);
    if (body == null || rendered == null) { console.log(`  ? ${d.id} ← ${dynLabel(d)}: not found`); continue; }
    const cov = canonicalCoverage(body, rendered, d);
    const pct = cov.total ? Math.round(100 * cov.present / cov.total) : 100;
    console.log(`  ${d.locked ? '🔒' : '  '} ${d.id} ← ${dynLabel(d)}: ${pct}% of ${cov.total} canonical lines present | ${cov.missing.length} missing | ${cov.outOfOrder.length} out of order${d.locked ? ' [LOCKED]' : ' (report-only BY DESIGN — canonical delegates to a sibling; console stays standalone, R16-S-marker-guarded — ROADMAP R16)'}`);
  }
  return 0;
}

// F33 (Cycle 7): compare REAL paths. Node resolves symlinks for import.meta.url
// but leaves process.argv[1] as typed, so run through a symlinked scripts/
// directory the check was false and the script did NOTHING and exited 0 —
// a guard that passes silently.
const isMain = (() => { try { return !!process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } })();
if (isMain) {
  process.exit(main(process.argv.slice(2)));
}
