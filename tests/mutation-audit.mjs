#!/usr/bin/env node
// mutation-audit.mjs — the invariant library's own regression test.
//
// invariant-check.mjs proves each `Verify:` command PASSES on a clean tree.
// That is not evidence the command would FAIL if its invariant were violated —
// a Verify field that points at a check which cannot see the rule reports PASS
// forever. This audit closes that loop: for every runnable invariant, violate
// the rule in a throwaway copy of the repo, run that invariant's OWN Verify
// command, and require it to fail.
//
// Promoted from a scratchpad script written during Cycle 5 (finding F11), where
// it found a real false green. Three things changed on the way in, each closing
// a way the scratchpad version could have lied:
//
//   1. COVERAGE IS DERIVED. The case list is checked against the live library
//      (via invariant-check.mjs's exported parse — not a second copy of it).
//      A runnable invariant with no mutation case is a FAILURE, not a silent
//      omission. Hand-listed coverage has been the root cause in this repo five
//      times; the audit that polices the library must not repeat it.
//   2. A STALE CASE FAILS. The scratchpad printed "NO-TARGET" as a neutral `?`
//      and still reported "16/17 proven, 0 false greens" — a case whose find
//      string had rotted away simply stopped testing anything. A mutation that
//      cannot be applied is now a failure.
//   3. SIGNALS ARE PER-INVARIANT (the field-level tier §4v asked for). Twenty
//      invariants share `node scripts/check-html.mjs`; under an exit-code-only
//      test, a mutation for INV-06 that happened to trip INV-07's assertion
//      still read as CAUGHT. Each case names the message its OWN assertion
//      emits, so the audit proves the right check fired — not merely that
//      something did.
//
// Usage:  node tests/mutation-audit.mjs [--only INV-05,INV-20] [--jobs N]
// Exit 0 = every runnable invariant is proven fail-closed.

import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseInvariants, toCommand, defaultSource } from '../scripts/invariant-check.mjs';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx !== -1 ? new Set(args[onlyIdx + 1].split(',').map(s => s.trim())) : null;
const jobsIdx = args.indexOf('--jobs');
const JOBS = jobsIdx !== -1 ? Math.max(1, +args[jobsIdx + 1]) : 8;

const HTML = 'claude-code-guide-v2.html';
const CFG = 'CLAUDE.md';

// ── Mutation cases ────────────────────────────────────────────────────────────
// INV id → one or more mutations. Each: [file, find, replace, signal].
// `signal` must match output produced by the assertion that belongs to THIS
// invariant — an exit code alone does not prove the right check fired.
// Multiple mutations per invariant give the field-level tier: INV-20's escaping
// is violated one sink at a time, because poisoning all of them at once is how
// a fixture passes while an individual field is unguarded.
const CASES = {
  // ── node scripts/check-html.mjs ─────────────────────────────────────────────
  'INV-04': [[HTML, 'function esc(s){', 'function esc(s){ ((( ', /syntax error/i]],
  'INV-05': [[HTML, 'const dims=project.healthDimensions;', 'const dims=project.healthDimensions_TYPO;', /unresolved|leaked "undefined"/i]],
  'INV-06': [[HTML, '? project.axisB : DEFAULT_AXIS_B;', '? project.axisB : DEFAULT_AXIS_B.slice(0,3);', /5 default categories/i]],
  'INV-07': [[HTML, "id:'obs', name:'Observatory QA',", "id:'obs', name:'Observatory QA', axisB:[{name:'Sneaky',measures:'m',pulse:'p'}],", /INV-07/]],
  'INV-08': [[HTML, 'inv.verify?` | Verify: ${inv.verify}`:\'\'', '` | Verify: ${inv.verify}`', /INV-08/]],
  'INV-09': [[HTML, "k.indexOf('ccg:')===0&&!isSecretKey(k)) data[k]", 'k!==null) data[k]', /scope to ccg|secret key/i]],
  'INV-10': [[HTML, "if(!confirm(", 'if(false&&!confirm(', /INV-10/]],
  'INV-15': [[HTML, 'const axisB=getAxisB(project);', 'const axisB=DEFAULT_AXIS_B;', /INV-15/]],
  // Field-level tier: one sink at a time (§4v found the all-at-once form green).
  'INV-20': [
    [HTML, 'white-space:nowrap">${esc(g)}</span>', 'white-space:nowrap">${g}</span>', /unescaped stored content|injected data executed/i],
    [HTML, '${esc(inv.text)}', '${inv.text}', /unescaped stored content|injected data executed/i],
    [HTML, '${esc(inv.subsystem)}', '${inv.subsystem}', /unescaped stored content|injected data executed/i],
    // F01/F09 — the fill form renders only on interaction; these prove the
    // hostile fixture now reaches it, one sink at a time.
    [HTML, '<option value="${esc(s.name)}"${val===s.name', '<option value="${s.name}"${val===s.name', /unescaped stored content|injected data executed/i],
    [HTML, 'placeholder="Paste your systems map summary here..." onchange="saveVal(${argPid},${argName},this.value)">${esc(val)}</textarea>', 'placeholder="Paste your systems map summary here..." onchange="saveVal(${argPid},${argName},this.value)">${val}</textarea>', /unescaped stored content|injected data executed/i],
    [HTML, "'Paste content here...'}\" onchange=\"saveVal(${argPid},${argName},this.value)\">${esc(val)}</textarea>", "'Paste content here...'}\" onchange=\"saveVal(${argPid},${argName},this.value)\">${val}</textarea>", /unescaped stored content|injected data executed/i],
    [HTML, 'value="${esc(val)}" oninput="saveVal(${argPid}', 'value="${val}" oninput="saveVal(${argPid}', /unescaped stored content|injected data executed/i],
  ],
  'INV-21': [[HTML, 'function storageWarn(e){', 'function storageWarn(e){ return;', /storageWarn/i]],
  'INV-30': [[HTML, 'if(!window.showDirectoryPicker){ setStateIoMsg(', 'if(!window.showDirectoryPicker){ return; setStateIoMsg(', /R3 fallback/i]],
  'INV-37': [[HTML, 'overall:g(/Overall[^:\\n]*:\\s*([\\d.]+)\\s*\\/\\s*10/i)', 'overall:g(/NOPE([\\d.]+)/i)', /parseHealth|parseState|parseRepoSpec|scoreColor/i]],
  'INV-40': [[HTML, 'const SECRET_KEYS=[', 'const SECRET_KEYS=[].concat([] ,[] ), _unused=[', /secret key/i]],
  'INV-41': [[HTML, 'copyFeedback(btn,legacyCopy(text))', 'undefined', /copy failed silently/i]],
  'INV-42': [[HTML, 'panels.forEach(p=>p.classList.toggle(', 'panels.forEach(p=>0&&p.classList.toggle(', /showPanel|nav state not synced|handleHash/i]],
  'INV-44': [[HTML, '<section id="prreview" class="panel">', '<section id="prreview-x" class="panel">', /pointing at no panel/i]],
  'INV-45': [[HTML, 'onclick="copyToClipboard(${jsArg(', 'onclick="copyToClipboard(\'${esc(', /esc\(\) as a JS argument/i]],
  'INV-46': [[HTML, '${c.name} | ${c.measures||\'\'} | ${c.pulse||\'\'} | ${c.playbook||\'\'}', '${c.name} | ${c.measures||\'\'} | ${c.playbook||\'\'}', /round-trip lossy|legacy 3-field/i]],
  'INV-47': [[HTML, 'function fallbackProjectId(', 'function fallbackProjectId_unused(', /unusable id|not defined/i]],
  'INV-48': [[HTML, "reason:'foreign-app'", "reason:''", /envelope validation wrong/i]],
  'INV-49': [[HTML, 'role="button" tabindex="0"', 'data-role="button"', /mouse-only control/i]],
  'INV-50': [[HTML, "getElementById('subsysTableBody')", "getElementById('subsysTableBody-typo')", /not in the markup/i]],
  'INV-53': [['scripts/check-html.mjs', '`\\\\b${alias}\\\\.${f}\\\\s*', '`\\\\.${f}\\\\s*', /INV-53/]],
  'INV-54': [[HTML, 'onclick="copyToClipboard(${jsArg((e.content))},this)"', 'onclick="navigator.clipboard.writeText(${jsArg((e.content))})"', /bypassing copyToClipboard/i]],
  'INV-56': [[HTML, ':focus-visible{outline:2px solid var(--accent)', ':focus-visible-disabled{outline:2px solid var(--accent)', /focus-visible|outline:none/i]],
  'INV-59': [[HTML, "if(/^INV-\\d+$/i.test(parts[0]||''))id=parts.shift().toUpperCase();", "if(false)id=parts.shift().toUpperCase();", /F05/]],
  'INV-60': [[HTML, "+(err?'<div class=\"dcard-err\"", "+(false?'<div class=\"dcard-err\"", /F06/]],
  'INV-61': [
    [HTML, '.nb-g{background:rgba(34,197,94,.15);color:var(--on-green)}', '.nb-g{background:rgba(34,197,94,.15);color:#86efac}', /literal text colour/i],
    [HTML, '--on-green:#166534;', '--on-green:#86efac;', /F13 contrast/],
  ],
  // Reinstating the real collision: <pre id="t1a"> back to id="t1", which the
  // enclosing <section id="t1"> then shadows.
  'INV-67': [[HTML, '<pre id="t1a"></pre>', '<pre id="t1"></pre>', /duplicate id/i]],
  'INV-63': [[HTML, "const PH_RE = /\\[([A-Z][^\\]]{0,199})\\]/g;", "const PH_RE = /\\[([A-Z][A-Z0-9\\s\\/\\-&',:.()]+)\\]/g;", /F11/]],
  'INV-64': [[HTML, "hash32(seed+'|'+String(inv.id))", "hash32(String(inv.id)+'|'+seed)", /F14/]],
  'INV-65': [['.cycle/STATE.md', '## Where I left off', '## Scratch\n\n## Where I left off', /F15/]],
  'INV-66': [
    ['scripts/gen-html-prompts.mjs', "  { id: 'p1sec', section:", "  // removed { id: 'p1sec', section:", /outside the lock manifest/i],
    // inherited from the retired INV-29: the DRIFT half. Retiring a rule must
    // not retire its proof — INV-66's own case only covered the unlocked-new-
    // prompt half, so without this the drift mutation would have been lost.
    [HTML, '<pre id="p0">Read CLAUDE.md and README before starting.', '<pre id="p0">Read README before starting.', /drift|does not match|p0/i],
  ],
  'INV-62': [
    [HTML, 'id="navToggle" aria-label="Open navigation" aria-expanded="false"', 'id="navToggle" aria-label="Open navigation"', /F12/],
    [HTML, '<label class="fill-label" for="pf-name">', '<label class="fill-label" data-for="pf-name">', /F12/],
  ],

  // ── node scripts/check-template-sync.mjs ────────────────────────────────────
  'INV-02': [['README.md', '## Slash Commands Reference', '## Slash Commands Reference\n\nBogus `/totally-made-up` reference.\n', /without a CLAUDE.md template/i]],
  'INV-03': [['README.md', 'Dynamic Workflows', 'DWF-renamed', /marker "dynamic workflows"/i]],
  'INV-12': [['.claude/commands/reflect.md', 'METRICS (optional — only if .cycle/ exists)', 'METRICS', /not gated on the directory existing/i]],
  'INV-13': [[CFG, '### /pr-review\n', '### /pr-review-moved-out-of-claude-md\n', /without a CLAUDE.md template/i]],
  'INV-14': [['.github/workflows/sync-check.yml', '  pull_request:\n', '', /INV-14/]],
  'INV-16': [[HTML, '### Seams Audit Cadence   ← optional; default: every 4 subsystem cycles\nevery [N] subsystem cycles\n\n', '', /INV-16/]],
  'INV-18': [['.claude/commands/implement.md', '3. CHECKPOINT (optional — only if .cycle/ exists): create/update', '3. CHECKPOINT: create/update', /not gated on the directory existing/i]],
  'INV-19': [[HTML, '---CYCLE SUMMARY BLOCK---', '---GONE-SUMMARY---', /workflow blocks missing|cycle summary block/i]],
  'INV-33': [[HTML, 'Fill phase=synthesis with the Category D ratio', 'Fill phase=synthesis with the overall net_score', /double-count|net_score/i]],
  'INV-34': [[HTML, 'TWO-AXIS GRID', 'TWO-PLANE GRID', /contract marker/i]],
  'INV-39': [[HTML, 'OPERATOR VISUAL CHECKS', 'VISUAL-GONE', /operator visual checks/i]],

  // ── node scripts/gen-commands.mjs --check ───────────────────────────────────
  'INV-01': [['.claude/commands/audit.md', 'Read CLAUDE.md', 'TAMPERED\nRead CLAUDE.md', /stale or missing/i]],
  'INV-11': [[CFG, '### /roadmap\n\n```', '### /roadmap\n\nunfenced prose instead of a template', /orphan command files|stale or missing/i]],
  'INV-17': [[CFG, 'Produce a systems map in five phases:', 'Produce a systems map in six phases:', /stale or missing/i]],

  // ── node tests/guard.test.mjs ───────────────────────────────────────────────
  'INV-22': [['scripts/check-template-sync.mjs', 'const cmdMissing = tableCmds.filter', 'const cmdMissing = [] || tableCmds.filter', /README command lacking/i]],
  'INV-23': [['scripts/check-template-sync.mjs', 'does not match the newest CHANGELOG entry', 'matches the newest CHANGELOG entry (never printed)', /VERSION disagreeing/i]],
  'INV-43': [['scripts/check-template-sync.mjs', 'const WORKFLOW_BLOCKS = BLOCKS.map(b => b.name.toLowerCase());', "const WORKFLOW_BLOCKS = ['session handoff block'];", /registry block with no console representation/i]],
  'INV-57': [['.github/workflows/sync-check.yml', 'permissions:\n  contents: read\n', '', /least-privilege permissions|baseline/i]],
  // INV-58 verifies THIS harness, so its case runs the meta-test (which runs
  // the audit with --only) rather than the audit itself — an invariant whose
  // Verify command is the audit would recurse into its own coverage set.
  'INV-58': [['tests/mutation-audit.mjs', 'if (uncovered.length) bad(', 'if (false && uncovered.length) bad(', /no mutation case|\u2717/]],
  // INV-68 — the proven vector: ONE leading space made a rule invisible to
  // invariant-check and to this audit's own derived set, while the §4v pack
  // still listed it.
  'INV-68': [['.cycle/config.md', 'INV-40 | credentials never leave', '  INV-40 | credentials never leave', /parse floor/i]],
  'INV-69': [[HTML, ':focus-visible{outline:2px', '.nav-item:focus-visible{outline:2px', /must apply, not merely exist/i]],

  // ── node scripts/gen-html-prompts.mjs --assert ──────────────────────────────
  'INV-36': [[HTML, 'PART 1 — INVARIANT PROBE RESULTS', 'PART 1 — PROBE RESULTS', /coverage|missing line|drift/i]],

  // ── node scripts/check-output-blocks.mjs ────────────────────────────────────
  'INV-31': [[CFG, 'Audit confidence: [High / Medium / Low]\n', '', /audit confidence|missing field/i]],
  'INV-38': [[CFG, 'SEAM INVENTORY:', 'SEAM-LIST:', /seam inventory|missing field/i]],
  'INV-55': [[HTML, '---PR REVIEW BLOCK---\nPR:', '---PR REVIEW BLOCK---\nPR-NUMBER:', /pr review block|missing field/i]],

  // ── the remaining test-backed scripts ───────────────────────────────────────
  'INV-24': [['scripts/cycle-context.mjs', 'existsSync', 'Boolean', /cycle-context|✗/i]],
  'INV-25': [['scripts/csv.mjs', 'export function parseCSV(text) {', 'export function parseCSV(text) { text = text.split(\'\\n\').slice(0, 2).join(\'\\n\');', /✗|error/i]],
  'INV-26': [['scripts/invariant-check.mjs', 'const cmd = verify.split(/\\s+\\(|\\s+\\+\\s+|\\s+then\\s+/i)[0].trim();', 'const cmd = verify.trim();', /✗/]],
  'INV-27': [['scripts/portfolio.mjs', 'function section(md, heading) {', 'function section(md, heading) { return \'\';', /✗|error/i]],
  'INV-28': [['scripts/gen-html-prompts.mjs', 'export function commandBody', 'export function commandBody_renamed', /✗|error/i]],
  'INV-32': [['scripts/check-output-blocks.mjs', 'export function validate', 'export function validate_renamed', /✗|error/i]],
  'INV-35': [['scripts/portfolio-status.mjs', 'function seamsCadence(cycleDir, root) {', 'function seamsCadence(cycleDir, root) { return \'\';', /✗|error/i]],
  'INV-51': [['scripts/render-metrics.mjs', "that cycle's net ${synthNet}", "that cycle's net ${lastSynth.net_score}", /✗/]],
  'INV-52': [['scripts/verification-pack.mjs', 'export function selectProbes', 'export function selectProbes_renamed', /✗|error/i]],
  // INV-70 — reintroduce the disclosure/use split: select with a truncated
  // seed while the header still prints the full one.
  'INV-70': [['scripts/verification-pack.mjs', 'const probes = selectProbes(invariants, seed);', 'const probes = selectProbes(invariants, String(seed).slice(0, 4));', /does NOT reproduce/i]],
};

// ── Coverage, derived from the live library ───────────────────────────────────
const libSrc = defaultSource(REPO);
const invariants = parseInvariants(readFileSync(libSrc, 'utf8'));
const runnable = invariants.map(i => ({ ...i, cmd: toCommand(i.verify) })).filter(i => i.cmd);

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

const uncovered = runnable.filter(i => !CASES[i.id]);
const orphaned = Object.keys(CASES).filter(id => !runnable.some(i => i.id === id));
if (uncovered.length) bad(`runnable invariant(s) with no mutation case — unproven, add one to CASES: ${uncovered.map(i => i.id).join(', ')}`);
if (orphaned.length) bad(`mutation case(s) for an invariant that is no longer runnable: ${orphaned.join(', ')}`);

// ── Run ───────────────────────────────────────────────────────────────────────
const targets = runnable.filter(i => CASES[i.id] && (!ONLY || ONLY.has(i.id)));

function runCase(inv, [file, find, replace, signal], n) {
  const dir = mkdtempSync(join(tmpdir(), 'mut-'));
  try {
    cpSync(REPO, dir, { recursive: true, filter: s => !s.includes('/.git/') && !s.endsWith('/.git') });
    const path = join(dir, file);
    if (!existsSync(path)) return { verdict: 'NO-TARGET', detail: `${file} does not exist` };
    const before = readFileSync(path, 'utf8');
    if (!before.includes(find)) return { verdict: 'NO-TARGET', detail: `${file} no longer contains ${JSON.stringify(find.slice(0, 50))}` };
    writeFileSync(path, before.split(find).join(replace));
    let out = '', code = 0;
    try { out = execSync(inv.cmd, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { code = e.status ?? 1; out = (e.stdout || '') + (e.stderr || ''); }
    if (!code) return { verdict: 'FALSE GREEN', detail: `${inv.cmd} still passed` };
    if (!signal.test(out)) return { verdict: 'WRONG CHECK', detail: `failed, but not via this invariant's assertion (no ${signal})` };
    return { verdict: 'CAUGHT', detail: `mutation ${n}` };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// Flatten to a work queue so multi-mutation invariants parallelise too.
const queue = targets.flatMap(inv => CASES[inv.id].map((c, i) => ({ inv, c, n: i + 1 })));
const results = new Map();
let cursor = 0;
async function worker() {
  while (cursor < queue.length) {
    const { inv, c, n } = queue[cursor++];
    const r = runCase(inv, c, n);
    if (!results.has(inv.id)) results.set(inv.id, []);
    results.get(inv.id).push(r);
    await Promise.resolve();
  }
}
await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, worker));

for (const inv of targets) {
  const rs = results.get(inv.id) || [];
  const worst = rs.find(r => r.verdict !== 'CAUGHT');
  const label = `${inv.id} (${rs.length} mutation${rs.length === 1 ? '' : 's'}) via \`${inv.cmd}\``;
  if (!worst) ok(label);
  else bad(`${label} — ${worst.verdict}: ${worst.detail}`);
}

console.log('Invariant mutation audit — violate each rule, run its own Verify command:\n');
console.log(log.join('\n'));
const proven = targets.filter(i => (results.get(i.id) || []).every(r => r.verdict === 'CAUGHT')).length;
console.log(`\n${proven}/${targets.length} runnable invariants proven fail-closed (${queue.length} mutations); library: ${invariants.length} total, ${runnable.length} runnable.`);
if (failures) { console.error(`\n${failures} invariant(s) are not proven fail-closed.`); process.exit(1); }
console.log('Every runnable invariant fails closed when violated. ✓');
