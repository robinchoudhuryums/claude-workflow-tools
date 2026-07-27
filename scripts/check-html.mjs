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
// Ids actually present in the markup. getElementById() returns a live stub for
// ANY id, which meant a render writing to a MISTYPED id wrote to a phantom
// element, passed CI, and rendered an empty box in the browser (proven by
// mutation during the Cycle-5 regression pass — and I hit it for real,
// `pr-prompt` vs `pr`, while adding the PR Review panel). Reads of unknown ids
// are fine — in a browser they return null and the code guards with `if(!el)`.
// WRITES to an unknown id are the bug, so those are what we record.
const MARKUP_IDS = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const writtenIds = new Set();
function makeEl(id) {
  const t = { _html: '', _text: '', value: '', style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } };
  return new Proxy(t, {
    get(o, p) {
      if (p === 'innerHTML') return o._html;
      if (p === 'textContent') return o._text;
      if (p in o) return o[p];
      if (p === 'querySelector') return () => makeEl(null);
      if (p === 'querySelectorAll') return () => [];
      return () => {};
    },
    set(o, p, v) {
      if (p === 'innerHTML') { o._html = String(v); if (id) writtenIds.add(id); }
      else if (p === 'textContent') { o._text = String(v); if (id) writtenIds.add(id); }
      else o[p] = v;
      return true;
    },
  });
}
const getEl = id => (elStore[id] || (elStore[id] = makeEl(id)));

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

// Snapshot BEFORE the assertions below write to elements themselves.
const initWrites = new Set(writtenIds);
if (loaded) {
  const phantom = [...initWrites].filter(id => !MARKUP_IDS.has(id));
  if (!initWrites.size) bad('init wrote to no element — the render assertions below would be vacuous');
  else if (!phantom.length) ok(`every element written during init exists in the markup (${initWrites.size} checked)`);
  else bad(`render wrote to element id(s) not in the markup — renders empty in a browser: ${phantom.join(', ')}`);
}

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

  // INV-07 — built-in projects are unchanged by Axis B configurability. The
  // library stated this as "no axisB field" and verified it by "code read of
  // PROJECTS", i.e. nothing. Assert the CONSEQUENCE (they resolve to the shipped
  // defaults) rather than the absence of a field: that is what actually matters
  // and it stays meaningful if a built-in ever legitimately gains a custom set.
  if (typeof ctx.getAxisB === 'function') {
    const builtins = vm.runInContext('typeof PROJECTS !== "undefined" ? PROJECTS : null', ctx);
    const defaults = ctx.getAxisB({});
    if (!Array.isArray(builtins) || !builtins.length) bad('PROJECTS not reachable from the context — the INV-07 assertion would be vacuous');
    else {
      const drifted = builtins.filter(p => ctx.getAxisB(p) !== defaults).map(p => p.id);
      if (!drifted.length) ok(`all ${builtins.length} built-in project(s) resolve to the shipped Axis B defaults (INV-07)`);
      else bad(`built-in project(s) no longer resolve to the default Axis B set: ${drifted.join(', ')} (INV-07)`);
    }
  }

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

// INV-08 — an invariant renders a "| Verify: …" suffix IFF it carries a verify
// value. A library entry with no verify must not grow an empty suffix (it would
// read as "verified by nothing" in a §4v pack), and one WITH a value must never
// lose it (that value is what invariant-check.mjs executes). The rule named two
// builders; there are three sites — the two §-builders plus the Seams invariant
// table — so the static half is derived from the source rather than a name list.
if (loaded) {
  // Every interpolation of inv.verify — the three prompt builders AND the
  // project-form serializer — must sit inside a `inv.verify ? … : ''` ternary.
  // Derived by counting, so a fourth site cannot be added ungated.
  const interpolated = (src.match(/\$\{inv\.verify\}/g) || []).length;
  const gated = (src.match(/inv\.verify\s*\?[^]{0,60}?\$\{inv\.verify\}/g) || []).length;
  if (interpolated && interpolated === gated) ok(`all ${interpolated} inv.verify interpolation(s) are gated on a value (INV-08)`);
  else bad(`INV-08: ${interpolated} site(s) interpolate inv.verify but only ${gated} gate it — an entry with no verify would render an empty suffix`);

  const probe = {
    id: 'inv08', name: 'INV08 Probe', healthDimensions: 'A, B',
    subsystems: [{ name: 'S', files: 'a.ts' }], cycleGroups: ['S'], seeds: [], axisB: [],
    policyThreshold: 4, consecutiveCycles: 2,
    invariants: [
      { id: 'INV-AA', text: 'carries a verify value', subsystem: 'S', verify: 'node probe-aa.mjs' },
      { id: 'INV-BB', text: 'carries none', subsystem: 'S', verify: '' },
    ],
  };
  // The builders read the library through getProjectInvariants() (active
  // project, from storage) rather than off the argument, so the probe has to be
  // the active project for this to be anything but vacuous.
  for (const k of Object.keys(store)) delete store[k];
  store['ccg:customProjects'] = JSON.stringify([probe]);
  store[`ccg:${probe.id}:invariants`] = JSON.stringify(probe.invariants);
  if (typeof ctx.switchProject === 'function') ctx.switchProject(probe.id);
  const builders = Object.keys(ctx).filter(k => /^build.*Text$/.test(k) && typeof ctx[k] === 'function');
  const rendering = [], wrong = [];
  for (const n of builders) {
    let out = '';
    try { out = ctx[n](probe) || ''; } catch { continue; }
    if (!out.includes('INV-AA')) continue;
    rendering.push(n);
    const line = id => out.split('\n').find(l => l.includes(id)) || '';
    if (!/\|\s*Verify:\s*node probe-aa\.mjs/.test(line('INV-AA'))) wrong.push(`${n} dropped INV-AA's Verify suffix`);
    if (/\|\s*Verify:/.test(line('INV-BB'))) wrong.push(`${n} gave INV-BB a Verify suffix it has no value for`);
  }
  if (!rendering.length) bad('no prompt builder rendered the probe invariant library — the INV-08 behavioral check is vacuous');
  else if (!wrong.length) ok(`the "| Verify:" suffix tracks the value in ${rendering.length} builder(s): ${rendering.join(', ')} (INV-08)`);
  else bad('INV-08: ' + wrong.join('; '));
  for (const k of Object.keys(store)) delete store[k];
  if (typeof ctx.switchProject === 'function') ctx.switchProject('obs');
}

// INV-15 — the Axis B builders iterate getAxisB(project) rather than any
// hardcoded category list, which is what makes a per-project override actually
// take effect. Verified by "code read" before, i.e. not at all. Derived form: no
// default category NAME may appear anywhere in the script outside the
// DEFAULT_AXIS_B declaration, and the two builders must call getAxisB().
if (loaded && typeof ctx.getAxisB === 'function') {
  const fnSrc = n => {
    const i = src.indexOf('\nfunction ' + n);
    if (i < 0) return '';
    const rest = src.slice(i + 1);
    const j = rest.slice(1).search(/\nfunction [A-Za-z_$]/);
    return j === -1 ? rest : rest.slice(0, j + 1);
  };
  const custom = {
    id: 'inv15', name: 'INV15 Probe', healthDimensions: 'A, B',
    subsystems: [{ name: 'S', files: 'a.ts' }], cycleGroups: ['S'], seeds: [], invariants: [],
    policyThreshold: 4, consecutiveCycles: 2,
    axisB: [{ name: 'ZZ Probe Category', measures: 'zz measures', pulse: 'zz pulse?', playbook: 'zz playbook' }],
  };
  const problems = [];
  for (const n of ['buildP6aText', 'buildP6bText']) {
    if (!/getAxisB\s*\(/.test(fnSrc(n))) problems.push(`${n} does not call getAxisB()`);
    let out = '';
    try { out = typeof ctx[n] === 'function' ? ctx[n](custom) : ''; } catch (e) { problems.push(`${n} threw: ${e.message}`); continue; }
    if (!out.includes('ZZ Probe Category')) problems.push(`${n} ignored the project's configured Axis B categories`);
  }
  if (!problems.length) ok('§6a/§6b ask about the project’s CONFIGURED Axis B categories, not a hardcoded list (INV-15)');
  else bad('INV-15: ' + problems.join('; '));

  // Report — do NOT silently imply — the one builder this rule does not reach.
  // §1s PART 4 and the SEAMS & INVARIANTS AUDIT BLOCK enumerate the five DEFAULT
  // categories by name, so a project with a custom Axis B set gets a Seams audit
  // asking about categories it does not use. Making it derived means changing a
  // --assert-locked canonical body AND the block's registered field names, so it
  // is tracked as a finding rather than quietly folded into a passing check.
  const seams = fnSrc('buildSeamsText');
  const hardcoded = ctx.getAxisB({}).map(c => c.name).filter(name => seams.includes(name));
  if (hardcoded.length) log.push(`  · INV-15 does NOT cover §1s: buildSeamsText hardcodes ${hardcoded.length} default Axis B category name(s) — open finding, see .cycle/config.md`);
}

// INV-10 — the import path. Its Verify field read "importStateFile logic", and
// the FileReader stub never fired its onload, so nothing here had ever executed:
// every clause of this rule (JSON rejection, envelope rejection, the confirm
// gate, ccg:*-only writes) was unverified. Drive the real function.
if (loaded && typeof ctx.importStateFile === 'function') {
  const RealFR = ctx.FileReader;
  ctx.FileReader = class { readAsText(f) { if (this.onload) this.onload({ target: { result: f._body } }); } };
  const realMsg = ctx.setStateIoMsg, realConfirm = ctx.confirm;
  let msg = null, kind = null;
  ctx.setStateIoMsg = (m, k) => { msg = m; kind = k; };
  const run = (body, confirmAnswer = true) => {
    msg = null; kind = null;
    ctx.confirm = () => confirmAnswer;
    const input = { files: [{ _body: body }], value: 'C:\\fake' };
    ctx.importStateFile(input);
    return { msg, kind, cleared: input.value === '' };
  };
  const clear = () => { for (const k of Object.keys(store)) delete store[k]; };

  clear();
  const notJson = run('this is not json {');
  const noData = run(JSON.stringify({ nope: 1 }));
  const rejects = notJson.kind === 'error' && /json/i.test(notJson.msg || '') && notJson.cleared
    && noData.kind === 'error' && /data/i.test(noData.msg || '') && noData.cleared;
  if (rejects) ok('import rejects non-JSON and missing-"data" payloads with a visible message (INV-10)');
  else bad(`INV-10: malformed payloads not rejected visibly (notJson=${JSON.stringify(notJson.msg)} noData=${JSON.stringify(noData.msg)})`);

  clear();
  const payload = JSON.stringify({ data: { 'ccg:imp:a': '1', 'other:imp': 'nope', 'ccg:ghToken': 'ghp_EVIL' } });
  run(payload, false);
  const declined = Object.keys(store).length === 0;
  if (declined) ok('declining the import confirm writes nothing (INV-10)');
  else bad(`INV-10: import wrote ${JSON.stringify(Object.keys(store))} despite a declined confirm`);

  clear();
  run(payload, true);
  const scoped = store['ccg:imp:a'] === '1' && !('other:imp' in store) && !('ccg:ghToken' in store);
  if (scoped) ok('an accepted import writes only non-secret ccg:* keys (INV-10/INV-40)');
  else bad(`INV-10: import wrote out-of-scope keys: ${JSON.stringify(Object.keys(store))}`);

  clear();
  ctx.FileReader = RealFR; ctx.setStateIoMsg = realMsg; ctx.confirm = realConfirm;
  if (typeof ctx.switchProject === 'function') ctx.switchProject('obs');
} else if (loaded) bad('importStateFile not defined — INV-10 unguarded');

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

  // INV-53 — DERIVE which fields to poison from the sinks themselves. Cycle-5
  // §4v found this fixture was a false green: it hand-picked hostile fields
  // (inv.id) and left others benign (inv.text, inv.subsystem), so dropping
  // esc() from an un-poisoned sink passed every stage. A hand-picked payload
  // set proves escaping only for the fields someone remembered — the same
  // hand-listing trap as F17's block list, one level down.
  //
  // Scan the source for `${…obj.field…}` interpolations, then poison every
  // STRING-rendered field found. Fields used structurally (.length/.map/.split)
  // are excluded and REPORTED, so the check never silently narrows itself.
  const interp = new Map();                       // alias -> Set(field)
  for (const m of src.matchAll(/\$\{[^}]*?\b([a-z]+)\.([a-zA-Z]+)/g)) {
    const [, alias, field] = m;
    if (!interp.has(alias)) interp.set(alias, new Set());
    interp.get(alias).add(field);
  }
  // Alias-SCOPED. An unqualified `.field` test excludes a string field whenever
  // any unrelated object anywhere calls `.field()` — `inv.text` was dropped
  // because `getFile().text()` exists in the FSA code, silently un-poisoning the
  // exact sink §4v caught. The derivation must narrow only on the alias it means.
  const structural = (alias, f) =>
    new RegExp(`\\b${alias}\\.${f}\\s*(\\.(length|map|filter|join|split|forEach|find|slice|padEnd)\\b|\\()`).test(src);
  const fieldsFor = (alias, skip = []) =>
    [...(interp.get(alias) || [])].filter(f => !structural(alias, f) && !skip.includes(f));

  const hostile = (alias, skip) => {
    const o = {};
    fieldsFor(alias, skip).forEach((f, i) => { o[f] = PAYLOADS[i % PAYLOADS.length] + ` [${alias}.${f}]`; });
    return o;
  };
  // Structural fields are supplied concretely; every other interpolated field
  // is hostile. `id` stays a payload — it is an attribute-context arg.
  const invFields = fieldsFor('inv');
  const projFields = fieldsFor('p', ['subsystems', 'invariants', 'seeds', 'axisB', 'cycleGroups']);
  const subFields = fieldsFor('s');
  const entFields = fieldsFor('e');
  // Report BOTH what was derived and what was deliberately held back, so the
  // fixture can never silently narrow the way the hand-picked one did.
  const SKIPPED = 'p.{subsystems,invariants,seeds,axisB,cycleGroups} (arrays), e.id (numeric identity)';
  log.push(`  · INV-53 payload set DERIVED from the sinks: inv{${invFields}} p{${projFields}} s{${subFields}} e{${entFields}}`);
  log.push(`  · INV-53 held back as non-string: ${SKIPPED}`);
  if (!invFields.includes('text') || !invFields.includes('subsystem'))
    bad(`INV-53: the fields §4v proved unguarded (inv.text/inv.subsystem) are NOT in the derived payload set — derivation narrowed itself`);

  const hostileProject = Object.assign(hostile('p', ['subsystems', 'invariants', 'seeds', 'axisB', 'cycleGroups']), {
    subsystems: [hostile('s')], cycleGroups: [PAYLOADS[1] + ' [cycleGroup]'], invariants: [], seeds: [],
    axisB: [], healthDimensions: PAYLOADS[0] + ' [p.healthDimensions]',
  });
  if (!hostileProject.id) hostileProject.id = PAYLOADS[2] + ' [p.id]';
  store['ccg:customProjects'] = JSON.stringify([hostileProject]);
  store[`ccg:${hostileProject.id}:invariants`] = JSON.stringify([hostile('inv')]);
  store[`ccg:${hostileProject.id}:archive`] = JSON.stringify([Object.assign(hostile('e'), { id: 1 })]);
  store['ccg:dashRepos'] = JSON.stringify({ [hostileProject.id]: 'own"er/re"po' });
  try {
    ctx.switchProject(hostileProject.id);
    ctx.renderDashboard();
    if (typeof ctx.renderArchive === 'function') ctx.renderArchive();
    const sinks = ['ctItems', 'subsysTableBody', 't2SubsysBody', 'projectSelect', 'customInvariantsList', 'projectsCustom', 'dashCards', 'archiveEntries'];
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

// F11/jsArg — STATIC guard for the attribute-context footgun. The hostile-fixture
// check above proves escaping only at sinks the fixture actually reaches; this
// covers every inline handler in the file. Rule: an `on*=` attribute must never
// call esc() to build a JS argument — esc() emits &#39; for a quote, which the
// browser decodes back before parsing the handler. Use jsArg() (JSON.stringify
// supplies the quoting, esc() then makes it attribute-safe). esc() in non-handler
// attribute text is correct and stays allowed.
{
  const noComments = src.replace(/^\s*\/\/.*$/gm, '');   // skip prose that names the anti-pattern
  const offenders = [...noComments.matchAll(/on[a-z]+="[^"]*esc\([^"]*"/gi)].map(m => m[0].slice(0, 80));
  if (!offenders.length) ok('no inline handler builds a JS argument with esc() — jsArg() only (F04/F11)');
  else bad(`inline handler(s) using esc() as a JS argument (use jsArg): ${offenders.join(' | ')}`);

  // INV-54 — every clipboard write goes through copyToClipboard(). F05 fixed the
  // silent-failure bug at the helper, and the archive "Copy content" button kept
  // its own inline navigator.clipboard call, so the bug stayed live in that one
  // sink for four releases. Centralising a behaviour does not apply it; scan for
  // callers that bypass the centre.
  const inlineClip = [...noComments.matchAll(/on[a-z]+="[^"]*navigator\.clipboard[^"]*"/gi)].map(m => m[0].slice(0, 80));
  if (!inlineClip.length) ok('no inline handler calls navigator.clipboard directly — copyToClipboard() only (INV-54)');
  else bad(`inline handler(s) bypassing copyToClipboard(): ${inlineClip.join(' | ')}`);
}

// R18 (a)1 — keyboard access. A control built on a non-interactive element
// (div/span/tr) is not focusable and does not fire click on Enter/Space, so it
// is mouse-only. Every such control must either carry role="button" +
// tabindex="0" + a key handler, or delegate to a nested native <button>.
// Derived from the markup, not a hand-listed set (Common Gotchas: fixtures that
// are hand-listed drift). Comments are stripped first — prose that names the
// pattern must not trip the check.
{
  const markup = html.replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '');
  const A11Y_EXEMPT = [/onclick="closeNav\(\)"/];   // the drawer backdrop is a dismissal overlay, not a control
  const bad_ = [];
  for (const m of markup.matchAll(/<(div|span|tr)\b[^>]*\bonclick="[^"]*"[^>]*>/g)) {
    const tag = m[0];
    if (A11Y_EXEMPT.some(re => re.test(tag))) continue;
    const keyboardable = /role="button"/.test(tag) && /tabindex="0"/.test(tag) && /onkeydown=/.test(tag);
    if (keyboardable) continue;
    // A <tr> may instead delegate to a native button carrying the same handler.
    const fn = (tag.match(/onclick="(?:event\.stopPropagation\(\);)?([a-zA-Z0-9_]+)\(/) || [])[1];
    const after = markup.slice(m.index, m.index + 700);
    if (fn && /<button\b[^>]*onclick="[^"]*\b/.test(after) && after.includes(fn + '(')) continue;
    bad_.push(tag.slice(0, 70));
  }
  if (!bad_.length) ok('every click-only control is keyboard-reachable (role+tabindex+keydown, or a native button) — R18 (a)1');
  else bad(`mouse-only control(s), unreachable by keyboard: ${bad_.join(' | ')}`);
}

// INV-56 — focus VISIBILITY, the structural half. Suppressing the UA focus ring
// with outline:none and supplying nothing in its place makes every focusable
// control invisible to keyboard users — strictly worse than not being focusable.
// 15 of the 17 suppressions are INLINE on form controls, where a stylesheet
// :focus rule can never win on specificity, so the replacement must use
// box-shadow (which inline outline:none cannot suppress). Whether the indicator
// has adequate CONTRAST is perceptual and stays with S7/INV-52.
{
  const suppressors = (html.match(/outline:\s*none/g) || []).length;
  const fv = html.match(/:focus-visible\s*\{[^}]*\}/g) || [];
  const usesBoxShadow = fv.some(r => /box-shadow\s*:/.test(r));
  if (!suppressors) ok('no outline:none in the file — UA focus ring intact everywhere (INV-56)');
  else if (fv.length && usesBoxShadow) ok(`${suppressors} outline:none suppression(s) are covered by a :focus-visible rule using box-shadow (INV-56)`);
  else if (fv.length) bad(`:focus-visible exists but sets no box-shadow — inline outline:none (${suppressors} of them) will win, leaving those controls focusable but invisible`);
  else bad(`${suppressors} outline:none suppression(s) with NO :focus-visible replacement — focusable but invisible to keyboard users (INV-56)`);
}

// F06 — Axis B must round-trip through the project form WITHOUT losing `pulse`.
// The 3-field serializer dropped it and the parser re-read pulse from the
// measures column, so every form-created project asked the wrong §6b question.
if (loaded && typeof ctx.axisBToText === 'function' && typeof ctx.parseAxisBLine === 'function') {
  const orig = ctx.getAxisB({});
  const back = ctx.axisBToText(orig).split('\n').map(ctx.parseAxisBLine);
  const lossless = orig.length === back.length && orig.every((c, i) =>
    c.name === back[i].name && c.measures === back[i].measures && c.pulse === back[i].pulse && (c.playbook || '') === back[i].playbook);
  const distinct = back.every(c => c.pulse && c.pulse !== c.measures);
  if (lossless && distinct) ok('Axis B round-trips through the form with pulse intact and distinct from measures (F06)');
  else bad(`Axis B round-trip lossy (lossless=${lossless} pulseDistinct=${distinct})`);
  const legacy = ctx.parseAxisBLine('Name | what it measures | the playbook');
  if (legacy.playbook === 'the playbook' && legacy.pulse === '') ok('a legacy 3-field Axis B line still parses as name|measures|playbook (F06)');
  else bad('legacy 3-field Axis B line mis-parsed: ' + JSON.stringify(legacy));
  const p6b = ctx.buildP6bText({ healthDimensions: 'A', axisB: back });
  if (p6b.includes(orig[0].pulse.split('\n')[0].trim())) ok('§6b pulse prompt carries the pulse question, not the measures text (F06)');
  else bad('§6b still renders the measures text as the pulse question');
} else if (loaded) bad('axisBToText/parseAxisBLine not defined — F06 round-trip unguarded');

// F07 — a name with no ASCII alphanumerics must still yield a SELECTABLE
// project. Drive saveProjectForm end to end rather than unit-testing the two
// helpers: an assertion on deriveId()/fallbackProjectId() alone still passes
// when the fallback is not wired into the form (verified — it did).
if (loaded && typeof ctx.saveProjectForm === 'function') {
  for (const k of Object.keys(store)) delete store[k];
  vm.runInContext("pfEditingId=null; pfSubRows=[{name:'Core',files:'a.ts'}];", ctx);
  getEl('pf-name').value = '日本語プロジェクト';      // derives to '' — the F07 case
  getEl('pf-dims').value = 'A, B';
  for (const id of ['pf-invs', 'pf-axisb']) getEl(id).value = '';
  getEl('pf-thresh').value = '4'; getEl('pf-consec').value = '2';
  ctx.saveProjectForm();
  const saved = ctx.loadCustomProjects();
  const p = saved[0];
  const usable = !!p && !!p.id && ctx.getProject(p.id).id === p.id;
  if (saved.length === 1 && usable) ok(`a non-Latin project name yields a selectable project (F07 — id "${p.id}")`);
  else bad(`F07: project saved with an unusable id (saved=${saved.length} id=${JSON.stringify(p && p.id)})`);
  for (const k of Object.keys(store)) delete store[k];
  if (typeof ctx.switchProject === 'function') ctx.switchProject('obs');
} else if (loaded) bad('saveProjectForm not defined — F07 unguarded');

// F16 — a filled value containing $-substitution patterns must survive verbatim.
if (loaded && typeof ctx.getFilledText === 'function' && typeof ctx.saveVal === 'function') {
  const el = getEl('p1'); el.textContent = 'Scope: [SUBSYSTEM GROUP NAME] done';
  ctx.saveVal('p1', 'SUBSYSTEM GROUP NAME', "a$&b$`c$'d$1e");
  const out = ctx.getFilledText('p1');
  if (out.includes("a$&b$`c$'d$1e")) ok('filled values with $&/$`/$\'/$1 survive substitution verbatim (F16)');
  else bad('F16: $-pattern in a filled value was mangled → ' + JSON.stringify(out));
}

// F20 — the backup envelope must be validated, not just its `data` key.
if (loaded && typeof ctx.stateBackupKeys === 'function') {
  const foreign = ctx.stateBackupKeys({ app: 'some-other-tool', data: { 'ccg:x': '1' } });
  const newer = ctx.stateBackupKeys({ app: 'claude-workflow-tools', version: 2, data: { 'ccg:x': '1' } });
  const okOld = ctx.stateBackupKeys({ data: { 'ccg:x': '1' } });                       // pre-envelope backup
  const okCur = ctx.stateBackupKeys({ app: 'claude-workflow-tools', version: 1, data: { 'ccg:x': '1' } });
  if (foreign.reason === 'foreign-app' && newer.reason === 'newer-version' && !okOld.reason && !okCur.reason)
    ok('backup envelope validated — foreign app and newer format rejected, older/current accepted (F20)');
  else bad(`F20 envelope validation wrong: foreign=${foreign.reason} newer=${newer.reason} old=${okOld.reason} cur=${okCur.reason}`);
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
