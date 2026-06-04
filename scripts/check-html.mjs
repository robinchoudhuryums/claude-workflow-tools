#!/usr/bin/env node
// check-html.mjs
//
// Automated coverage for the HTML console's JavaScript (F04). The console
// is the largest logic surface in the repo and the Node scripts could not
// previously reach it. This script:
//   1. syntax-checks the inline <script>
//   2. runs it under stubbed browser globals (catches load-time throws)
//   3. asserts the prompt builders produce clean output (no unresolved
//      ${...} or "undefined") for every built-in project
//   4. checks key behavioral invariants (Axis B fallback, state export
//      scoping, HTML-escaping of stored content)
//
// Usage: node scripts/check-html.mjs   (exit 0 = ok, 1 = failure)

import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const html = readFileSync(new URL('claude-code-guide-v2.html', root), 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('No <script> block found in claude-code-guide-v2.html'); process.exit(1); }
const src = m[1];

let failures = 0;
const log = [];
const ok = (msg) => log.push(`  ✓ ${msg}`);
const bad = (msg) => { failures++; log.push(`  ✗ ${msg}`); };

// 1) Syntax check
try { new vm.Script(src, { filename: 'console#script' }); ok('inline <script> parses'); }
catch (e) { bad('inline <script> syntax error: ' + e.message); }

// 2) Run under stubbed browser globals
const store = {};
const dummy = new Proxy(
  { style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, querySelectorAll: () => [], addEventListener() {} },
  { get(t, p) { return p in t ? t[p] : (() => {}); } }
);
const ctx = {
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, get length() { return Object.keys(store).length; }, key: i => Object.keys(store)[i] },
  document: { getElementById: () => dummy, querySelector: () => dummy, querySelectorAll: () => [], addEventListener() {}, body: dummy, createElement: () => ({ click() {}, style: {}, appendChild() {} }) },
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  window: { addEventListener() {} },
  IntersectionObserver: class { observe() {} disconnect() {} },
  MutationObserver: class { observe() {} disconnect() {} },
  Blob: class {}, URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  FileReader: class { readAsText() {} },
  console, setTimeout: () => 0, clearTimeout() {}, alert: () => {}, confirm: () => true, Date, Math, JSON, Object, Array, Set, RegExp,
};
ctx.globalThis = ctx;

let loaded = false;
try { vm.createContext(ctx); vm.runInContext(src, ctx, { filename: 'console' }); loaded = true; ok('inline <script> runs under stubbed DOM'); }
catch (e) { bad('inline <script> threw on load: ' + e.message); }

// 3) Builder cleanliness for every built-in project
if (loaded && typeof ctx.getAllProjects === 'function') {
  const projects = ctx.getAllProjects();
  const withArg = ['buildTier1Text', 'buildTier2AuditText', 'buildSeamsText', 'buildVerificationText', 'buildP6aText', 'buildP6bText'];
  let clean = true;
  for (const p of projects) {
    for (const name of withArg) {
      const out = typeof ctx[name] === 'function' ? ctx[name](p) : '';
      if (typeof out !== 'string' || !out.length) { bad(`${name}(${p.id}) produced empty output`); clean = false; }
      else if (out.includes('${')) { bad(`${name}(${p.id}) has an unresolved \${...} template`); clean = false; }
      else if (/\bundefined\b/.test(out)) { bad(`${name}(${p.id}) leaked "undefined"`); clean = false; }
    }
  }
  const impl = typeof ctx.buildTier2ImplText === 'function' ? ctx.buildTier2ImplText() : '';
  if (impl.includes('${') || /\bundefined\b/.test(impl)) { bad('buildTier2ImplText() has unresolved template or undefined'); clean = false; }
  if (clean) ok(`prompt builders clean for ${projects.length} built-in project(s) (no unresolved \${} / undefined)`);
} else if (loaded) {
  bad('getAllProjects not defined after load — cannot check builders');
}

// 4) Behavioral invariants
if (loaded) {
  if (typeof ctx.getAxisB === 'function') {
    if (ctx.getAxisB({}).length === 5) ok('Axis B falls back to the 5 defaults (INV-06)');
    else bad('getAxisB({}) did not return the 5 default categories');
    const custom = ctx.getAxisB({ axisB: [{ name: 'X' }] });
    if (custom.length === 1 && custom[0].name === 'X') ok('Axis B honors a custom override');
    else bad('getAxisB did not honor a custom axisB override');
  } else bad('getAxisB not defined');

  if (typeof ctx.collectState === 'function') {
    store['ccg:probe'] = '1'; store['other:probe'] = '1';
    const keys = Object.keys(ctx.collectState());
    if (keys.includes('ccg:probe') && !keys.includes('other:probe')) ok('state export collects only ccg:* keys (INV-09)');
    else bad('collectState() did not scope to ccg:* keys');
    delete store['ccg:probe']; delete store['other:probe'];
  } else bad('collectState not defined');

  if (typeof ctx.esc === 'function') {
    if (ctx.esc('<img onerror=x>') === '&lt;img onerror=x&gt;') ok('esc() HTML-escapes stored content (F05)');
    else bad('esc() did not escape angle brackets as expected');
  } else bad('esc() helper not defined (F05 not wired)');

  // storageWarn surfaces failed localStorage writes instead of swallowing them (F06)
  if (typeof ctx.saveCustomProjects === 'function') {
    let warned = false;
    const realWarn = ctx.console.warn;
    ctx.console.warn = () => { warned = true; };
    const ls = ctx.localStorage, origSet = ls.setItem;
    ls.setItem = () => { throw new Error('quota exceeded'); };
    try { ctx.saveCustomProjects([{ id: 't', name: 't', subsystems: [], healthDimensions: '' }]); } catch (_) {}
    ls.setItem = origSet;
    ctx.console.warn = realWarn;
    if (warned) ok('storageWarn surfaces a failed localStorage write (F06)');
    else bad('a failed localStorage write was swallowed silently (storageWarn did not fire)');
  } else bad('saveCustomProjects not defined — cannot test storageWarn');
}

// R3 fallback: connectRepoFolder must degrade gracefully when the File System
// Access API is absent (the stubbed environment has no window.showDirectoryPicker).
if (loaded && typeof ctx.connectRepoFolder === 'function') {
  let msg = '';
  const realMsg = ctx.setStateIoMsg;
  ctx.setStateIoMsg = m => { msg = m; };
  try { await ctx.connectRepoFolder(); } catch (e) { /* must not throw */ }
  ctx.setStateIoMsg = realMsg;
  if (/file system access/i.test(msg)) ok('connectRepoFolder falls back gracefully without the FSA API (R3)');
  else bad('R3 fallback path did not show the expected message (got: ' + JSON.stringify(msg).slice(0, 70) + ')');
} else if (loaded) bad('connectRepoFolder not defined (R3 draft missing)');

console.log('HTML console check (claude-code-guide-v2.html):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} HTML check(s) failed.`); process.exit(1); }
console.log('\nHTML console JS is sound. ✓');
