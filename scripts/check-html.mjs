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
// Per-id capturing elements: render* functions assign innerHTML/textContent; we
// keep them so the test can assert the rendered OUTPUT, not just that init didn't
// throw (W2 — browser-only render paths were previously only smoke-tested).
const elStore = {};
function makeEl() {
  const t = { _html: '', _text: '', value: '', style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } };
  return new Proxy(t, {
    get(o, p) {
      if (p === 'innerHTML') return o._html;
      if (p === 'textContent') return o._text;
      if (p in o) return o[p];
      if (p === 'querySelector') return () => makeEl();
      if (p === 'querySelectorAll') return () => [];
      return () => {};
    },
    set(o, p, v) { if (p === 'innerHTML') o._html = String(v); else if (p === 'textContent') o._text = String(v); else o[p] = v; return true; },
  });
}
const getEl = id => (elStore[id] || (elStore[id] = makeEl()));

// Tabbed-navigation fixtures. The console's showPanel()/handleHash() query
// 'main > .panel' and 'nav a'; a stub returning [] made every assertion about
// them vacuously pass, so the tab layer (the console's core interaction model
// since the panel rewrite) had no coverage at all. These return real objects
// with tracked class/attribute state so the behaviour can actually be asserted.
function makeClassList(set) {
  return {
    add: c => set.add(c), remove: c => set.delete(c), contains: c => set.has(c),
    toggle: (c, force) => { const on = force === undefined ? !set.has(c) : !!force; if (on) set.add(c); else set.delete(c); return on; },
  };
}
function makePanel(id) {
  const set = new Set();
  return { id, _classes: set, classList: makeClassList(set), style: {} };
}
function makeNavLink(href) {
  const set = new Set(), attrs = { href };
  return {
    _classes: set, _attrs: attrs, classList: makeClassList(set),
    getAttribute: n => (n in attrs ? attrs[n] : null),
    setAttribute: (n, v) => { attrs[n] = String(v); },
    removeAttribute: n => { delete attrs[n]; },
    addEventListener() {}, style: {},
  };
}
// DERIVE the fixture from the real markup rather than hardcoding ids: a
// hand-listed fixture silently rots the moment a panel is added (it did, the
// same shift as F17), and a fixture that has drifted from the page it stands in
// for gives false confidence.
const PANEL_IDS = [...html.matchAll(/<(?:section|div)\b[^>]*\bclass="[^"]*\bpanel\b[^"]*"[^>]*>|<(?:section|div)\b[^>]*>/g)]
  .map(m => m[0]).filter(t => /\bclass="[^"]*\bpanel\b/.test(t))
  .map(t => (t.match(/\bid="([^"]+)"/) || [])[1]).filter(Boolean);
const NAV_HREFS = [...html.matchAll(/<a\s+href="#([^"]+)"/g)].map(m => m[1]);
const panels = PANEL_IDS.map(makePanel);
const navLinks = PANEL_IDS.map(id => makeNavLink('#' + id));
panels[0].classList.add('active');   // matches the markup's default-active panel
function queryAll(sel) {
  if (sel === 'main > .panel') return panels;
  if (sel === 'nav a') return navLinks;
  return [];
}

const ctx = {
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, get length() { return Object.keys(store).length; }, key: i => Object.keys(store)[i] },
  document: { getElementById: id => getEl(id), querySelector: () => dummy, querySelectorAll: queryAll, addEventListener() {}, body: dummy, createElement: () => ({ click() {}, style: {}, setAttribute() {}, select() {}, appendChild() {} }), execCommand: () => false },
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

// Dashboard live-status parsers — the GitHub-backed dashboard renders from these
// pure parsers; lock them so a regex regression can't silently blank the board.
if (loaded && typeof ctx.parseHealth === 'function' && typeof ctx.parseRepoSpec === 'function') {
  const h = ctx.parseHealth('## Current Standing\nOverall (weighted avg): 8.8/10\nOne-line summary: solid.\nTop vertical priority: HTML.\n');
  if (h.overall === '8.8' && h.summary === 'solid.' && h.topVertical === 'HTML.') ok('parseHealth extracts overall/summary/priority from PROJECT_HEALTH.md');
  else bad('parseHealth did not extract expected fields (got ' + JSON.stringify(h) + ')');
  const s = ctx.parseState('Cycle: 4\nPhase: idle (done)\nUpdated: 2026-06-16\n');
  if (s.phase === 'idle (done)' && s.updated === '2026-06-16') ok('parseState extracts phase/updated from STATE.md');
  else bad('parseState did not extract phase/updated (got ' + JSON.stringify(s) + ')');
  const r = ctx.parseRepoSpec('owner/repo@dev');
  if (r && r.owner === 'owner' && r.repo === 'repo' && r.branch === 'dev') ok('parseRepoSpec parses owner/repo@branch');
  else bad('parseRepoSpec failed on owner/repo@branch');
  if (ctx.parseRepoSpec('garbage') === null) ok('parseRepoSpec rejects a malformed spec'); else bad('parseRepoSpec accepted a malformed spec');
  if (typeof ctx.scoreColor === 'function' && /green/.test(ctx.scoreColor('8.8')) && /red/.test(ctx.scoreColor('3'))) ok('scoreColor maps score bands'); else bad('scoreColor band mapping wrong');
} else if (loaded) bad('dashboard parsers (parseHealth/parseRepoSpec) not defined');

// W2 — render OUTPUT assertions. INIT ran every render* under the capturing stub;
// assert the load-bearing ones produced the right markup (not just no-throw). A
// safe substring (split on &/<>) sidesteps HTML-escaping of names.
if (loaded) {
  const out = id => (elStore[id] ? elStore[id].innerHTML : '');
  const safe = s => String(s).split(/[&<>]/)[0].trim();
  const proj = typeof ctx.getProject === 'function' ? ctx.getProject() : null;
  if (proj && proj.subsystems && proj.subsystems[0]) {
    if (out('subsysTableBody').includes(safe(proj.subsystems[0].name))) ok('renderSubsysTable emits the active project’s subsystems');
    else bad('renderSubsysTable output missing subsystem "' + safe(proj.subsystems[0].name) + '"');
  } else bad('getProject()/subsystems unavailable — cannot check renderSubsysTable output');
  if (proj && proj.invariants && proj.invariants[0]) {
    if (out('invariantTableBody').includes(proj.invariants[0].id)) ok('renderInvariantTable emits library invariants');
    else bad('renderInvariantTable output missing invariant "' + proj.invariants[0].id + '"');
  }
  if (/setPhase\(/.test(out('ctItems'))) ok('renderCycle emits interactive phase dots');
  else bad('renderCycle output has no phase dots (ctItems empty/blank)');
  if (proj && out('dashCards').includes('dcard') && out('dashCards').includes(safe(proj.name))) ok('renderDashboard emits a card per project');
  else bad('renderDashboard output missing cards or the active project name');
}

// W2 — state backup round-trip (the FSA/import data-integrity path, previously
// only smoke-tested via the connect fallback). collectState() serialized then
// re-applied through the shared helpers must restore every ccg:* key losslessly
// and drop foreign keys on BOTH the serialize and apply sides.
if (loaded && typeof ctx.collectState === 'function' && typeof ctx.stateBackupKeys === 'function' && typeof ctx.applyStateKeys === 'function') {
  for (const k of Object.keys(store)) delete store[k];
  store['ccg:rt:a'] = '1';
  store['ccg:rt:b'] = JSON.stringify({ x: 2 });
  store['other:rt'] = 'nope';                       // foreign key — must never survive
  const snap = ctx.collectState();                   // serialize side scopes to ccg:*
  const serializeScoped = 'ccg:rt:a' in snap && 'ccg:rt:b' in snap && !('other:rt' in snap);
  for (const k of Object.keys(store)) delete store[k];                       // wipe
  const { data, keys, reason } = ctx.stateBackupKeys({ data: { ...snap, 'evil:x': 'y' } });
  const n = reason ? 0 : ctx.applyStateKeys(data, keys);                     // apply side scopes again
  const lossless = store['ccg:rt:a'] === '1' && store['ccg:rt:b'] === JSON.stringify({ x: 2 });
  const applyScoped = !('other:rt' in store) && !('evil:x' in store) && n === keys.length;
  if (serializeScoped && lossless && applyScoped) ok('state backup round-trips losslessly and stays ccg:*-scoped on both sides (R3 integrity)');
  else bad(`state round-trip failed (serializeScoped=${serializeScoped} lossless=${lossless} applyScoped=${applyScoped})`);
  for (const k of Object.keys(store)) delete store[k];
} else if (loaded) bad('state backup helpers (stateBackupKeys/applyStateKeys) not defined');

// F01 — secrets must never reach a backup. collectState() writes the file that
// Export downloads AND that "Save → repo" puts inside a git repo, so a token in
// the ccg:* wildcard leaks into version control. Assert exclusion on BOTH the
// serialize side and the apply side (an imported backup must not install one).
if (loaded && typeof ctx.collectState === 'function' && typeof ctx.stateBackupKeys === 'function') {
  for (const k of Object.keys(store)) delete store[k];
  store['ccg:ghToken'] = 'ghp_SECRET';
  store['ccg:secret:future'] = 'also-secret';
  store['ccg:activeProject'] = 'obs';
  const snap = ctx.collectState();
  const exportClean = !('ccg:ghToken' in snap) && !('ccg:secret:future' in snap) && ('ccg:activeProject' in snap);
  if (exportClean) ok('collectState() excludes secret keys from backups (F01)');
  else bad('collectState() leaked a secret key into the backup payload: ' + JSON.stringify(Object.keys(snap)));
  const { keys } = ctx.stateBackupKeys({ data: { 'ccg:ghToken': 'ghp_EVIL', 'ccg:secret:x': 'e', 'ccg:activeProject': 'obs' } });
  if (keys && !keys.some(k => /ghToken|ccg:secret:/.test(k))) ok('import/load refuses to install a secret from a backup (F01)');
  else bad('stateBackupKeys would import a secret key: ' + JSON.stringify(keys));
  for (const k of Object.keys(store)) delete store[k];
}

// F04 — INV-20 must hold at the SINKS, not just in esc() itself. The previous
// esc() unit check passed while six render paths interpolated stored values raw
// into innerHTML and into onclick attributes. Render a hostile project through
// the real render* functions and assert no payload survives anywhere.
if (loaded && typeof ctx.switchProject === 'function') {
  for (const k of Object.keys(store)) delete store[k];
  const PAYLOADS = ['<img src=x onerror=alert(1)>', '" onmouseover="alert(2)', "'); alert(3); //"];
  store['ccg:customProjects'] = JSON.stringify([{
    id: "x'); alert(4); //", name: 'Proj <img src=x onerror=alert(1)>', healthDimensions: 'A, B',
    subsystems: [{ name: 'Core " onmouseover="alert(2)', files: "a.ts'); alert(3); //" }],
    cycleGroups: ['Core " onmouseover="alert(2)'], invariants: [], seeds: [],
  }]);
  store["ccg:x'); alert(4); //:invariants"] = JSON.stringify([{ id: "INV-99'); alert(3); //", text: 'imported', subsystem: 's' }]);
  store['ccg:dashRepos'] = JSON.stringify({ "x'); alert(4); //": 'own"er/re"po' });
  try {
    ctx.switchProject("x'); alert(4); //");
    ctx.renderDashboard();
    const sinks = ['ctItems', 'subsysTableBody', 't2SubsysBody', 'projectSelect', 'customInvariantsList', 'projectsCustom', 'dashCards'];
    const dirty = [];
    for (const id of sinks) {
      const h = elStore[id] ? elStore[id].innerHTML : '';
      for (const p of PAYLOADS) if (h.includes(p)) dirty.push(`${id} ← ${JSON.stringify(p)}`);
    }
    if (!dirty.length) ok('every render sink escapes stored content — hostile fixture leaks nothing (INV-20/F04)');
    else bad('unescaped stored content reached innerHTML: ' + dirty.join(' | '));

    // Attribute half. A substring scan CANNOT see the subtlest form of this bug:
    // esc() turns ' into &#39;, so esc(id) wrapped in '...' inside an onclick
    // looks escaped and contains no raw payload — until the browser decodes the
    // entity back to ' and breaks out of the JS string. So do what a browser
    // does: decode each inline handler, then EXECUTE it with every identifier
    // stubbed to a no-op except a tripwire. If injected data can reach the
    // tripwire, the sink is broken.
    const decode = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const handlers = [];
    for (const id of sinks) {
      const h = elStore[id] ? elStore[id].innerHTML : '';
      for (const m of h.matchAll(/\son[a-z]+="([^"]*)"/gi)) handlers.push([id, decode(m[1])]);
    }
    let tripped = null;
    const noop = new Proxy(function () {}, { get: (t, p) => (p === Symbol.toPrimitive ? undefined : noop), apply: () => noop });
    for (const [id, src] of handlers) {
      const sbx = { alert: () => { tripped = tripped || [id, src]; } };
      const scope = new Proxy(sbx, { has: () => true, get: (t, p) => (p in t ? t[p] : noop) });
      try { vm.runInNewContext(src, scope); } catch (e) { /* a handler that throws is not an injection */ }
    }
    if (handlers.length && !tripped) ok(`inline handlers survive entity-decode + execute — ${handlers.length} checked, none injectable (INV-20/F04)`);
    else if (!handlers.length) bad('no inline handlers found in the hostile render — the attribute check is vacuous');
    else bad(`injected data executed in an inline handler: ${tripped[0]} → ${tripped[1].slice(0, 90)}`);
  } catch (e) { bad('hostile-fixture render threw: ' + e.message); }
  for (const k of Object.keys(store)) delete store[k];
  if (typeof ctx.switchProject === 'function') ctx.switchProject('obs');
}

// F05 — copying is the console's primary action; it must never fail silently.
// Drive the two paths that previously did nothing at all: a rejecting
// writeText, and no navigator.clipboard at all (file:// / insecure context).
if (loaded && typeof ctx.copyToClipboard === 'function') {
  const btn = { _cls: new Set(), classList: makeClassList(new Set()), innerHTML: '' };
  btn.classList = makeClassList(btn._cls);
  const realCb = ctx.navigator.clipboard, realWarn = ctx.console.warn;
  ctx.console.warn = () => {};
  ctx.navigator.clipboard = { writeText: () => Promise.reject(new Error('denied')) };
  ctx.copyToClipboard('hello', btn);
  await new Promise(r => setTimeout(r, 0));   // let the rejection reach .catch
  const rejectedVisibly = /failed/i.test(btn.innerHTML) && btn._cls.has('fail');
  btn.innerHTML = ''; btn._cls.clear();
  ctx.navigator.clipboard = undefined;              // file:// / non-secure context
  ctx.copyToClipboard('hello', btn);
  const absentVisibly = /failed/i.test(btn.innerHTML) && btn._cls.has('fail');
  ctx.navigator.clipboard = realCb; ctx.console.warn = realWarn;
  if (rejectedVisibly && absentVisibly) ok('copy failure is surfaced on the button, never swallowed (F05)');
  else bad(`copy failed silently (rejected=${rejectedVisibly} absent=${absentVisibly})`);
}

// F08 — the tabbed panel navigation had zero headless coverage: the old stub
// returned [] for every querySelectorAll, so showPanel()/handleHash() ran
// against nothing and any assertion about them passed vacuously.
if (loaded && typeof ctx.showPanel === 'function') {
  const activeIds = () => panels.filter(p => p._classes.has('active')).map(p => p.id);
  ctx.showPanel('s3');
  const one = activeIds();
  if (one.length === 1 && one[0] === 's3') ok('showPanel activates exactly one panel (F08)');
  else bad('showPanel did not isolate one panel (active: ' + JSON.stringify(one) + ')');
  const cur = navLinks.filter(a => a.getAttribute('aria-current') === 'page').map(a => a._attrs.href);
  if (cur.length === 1 && cur[0] === '#s3' && navLinks[PANEL_IDS.indexOf('s3')]._classes.has('active')) ok('showPanel syncs nav active state + aria-current (F08)');
  else bad('nav state not synced by showPanel (aria-current on: ' + JSON.stringify(cur) + ')');
  ctx.showPanel('no-such-panel');
  const fb = activeIds();
  if (fb.length === 1 && fb[0] === PANEL_IDS[0]) ok('showPanel falls back to the first panel for an unknown id (F08)');
  else bad('unknown-id fallback wrong (active: ' + JSON.stringify(fb) + ')');
  if (typeof ctx.handleHash === 'function') {
    ctx.location = { hash: '#s6a' };
    ctx.handleHash();
    const h = activeIds();
    if (h.length === 1 && h[0] === 's6a') ok('handleHash opens the panel named by the URL hash (F08)');
    else bad('handleHash did not honor the hash (active: ' + JSON.stringify(h) + ')');
    delete ctx.location;
  } else bad('handleHash not defined — hash routing unguarded');
  ctx.showPanel('dashboard');

  // Every nav link must resolve to a real panel. showPanel() falls back to the
  // first panel for an unknown id, so a typo'd or orphaned nav href does not
  // error — it silently lands the user on the Dashboard. Guards the wiring for
  // any newly added section (F03/F21).
  const orphans = NAV_HREFS.filter(h => !PANEL_IDS.includes(h));
  if (PANEL_IDS.length && NAV_HREFS.length && !orphans.length) ok(`every nav link resolves to a panel — ${PANEL_IDS.length} panels, ${NAV_HREFS.length} links (F03/F21)`);
  else if (!PANEL_IDS.length || !NAV_HREFS.length) bad('panel/nav fixture derived nothing from the markup — the tab assertions would be vacuous');
  else bad('nav link(s) pointing at no panel (would silently fall back to Dashboard): ' + orphans.join(', '));
}

console.log('HTML console check (claude-code-guide-v2.html):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} HTML check(s) failed.`); process.exit(1); }
console.log('\nHTML console JS is sound. ✓');
