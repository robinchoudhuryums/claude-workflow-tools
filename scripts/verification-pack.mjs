#!/usr/bin/env node
// verification-pack.mjs — assemble a ready-to-paste §4v prompt (ROADMAP R19).
//
// The §4v Independent Verification Pass must run in a FRESH session with no
// implementation context, which means its inputs have to be carried across the
// session boundary by hand. Assembling one by hand exposed four frictions:
//
//   1. The handoff blocks lived nowhere. STATE.md carries prose ABOUT them, not
//      the blocks. The whole handoff design assumes they survive; the only thing
//      persisting them was the operator copy-pasting.
//   2. A project that is not in the HTML console (this repo included) cannot get
//      its invariant library injected by the console.
//   3. Rotation-probe selection has a conflict of interest: the prompt says
//      "pre-selected — do NOT substitute your own picks", but nothing stops the
//      implementer picking them.
//   4. The "the self-reports ran high" signal had to be written from memory,
//      when /reflect already recorded which summaries it corrected.
//
// This derives the prompt body from CLAUDE.md via the same sectionBody() the
// --assert lock uses (so there is no fourth copy), injects the live invariant
// library, seeds the probes reproducibly, and reads metrics.csv for the totals.
//
// Usage:
//   node scripts/verification-pack.mjs [--cycle N] [--seed S] [--out FILE]
//       [--root DIR] [--project NAME] [--template PATH] [--selector sha|console]
//   (cycle defaults to .cycle/STATE.md's Cycle field — the single source of
//    truth per P3; seed defaults to the current git HEAD sha; root defaults to
//    the current directory; project defaults to the root's directory name.)
//
// F34 (Cycle 7): the §4v body lives ONLY in the template repo's CLAUDE.md, so a
// consuming project's own CLAUDE.md never has it. The body is looked up in
// --template PATH, then the project's CLAUDE.md, then the CLAUDE.md beside this
// script (a template checkout) — never embedded here, which would be a fourth
// copy. Requires gen-html-prompts.mjs and csv.mjs beside it.
//
// Importable: exports selectProbes / readInvariants / readBlocks / blockCycle /
// cycleTotals / buildPack for the regression test. No CLI side effects on import (INV-28).

import { readFileSync, readdirSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, resolve, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { sectionBody } from './gen-html-prompts.mjs';
import { parseCSV } from './csv.mjs';

// ── pure, testable helpers ──────────────────────────────────

// Permissive on purpose: the strict "rule | Subsystem: x | Verify: y" shape
// drops any invariant whose RULE TEXT contains a pipe (INV-08 and INV-46 do).
// Keep the whole line — §4v wants to read it, not parse it.
export function readInvariants(configText) {
  return configText.split('\n').filter(l => /^INV-\d+\s*\|/.test(l.trim())).map(l => l.trim());
}

// Rotation probes, seeded so they are REPRODUCIBLE rather than chosen. The
// implementer must not be able to steer these toward invariants they know pass;
// a verifier can re-run this with the same seed to confirm the selection.
export function selectProbes(invariantLines, seed, count = 5) {
  return invariantLines
    .map(line => ({ line, h: createHash('sha256').update(line.split('|')[0].trim() + String(seed)).digest('hex') }))
    .sort((a, b) => (a.h < b.h ? -1 : a.h > b.h ? 1 : 0))
    .slice(0, count)
    .map(x => x.line);
}

// F21 (Cycle 7): the CONSOLE's selection, ported so its seed is reproducible.
// The console has no commit sha and no synchronous sha256, so it seeds from
// "<project>:<UTC day>" and orders by FNV-1a(seed + '|' + id) — a different
// function from selectProbes above, and its prompt claimed "a verifier can
// reproduce it" while no tool could. `--selector console --seed "<seed>"` runs
// this; tests/verification-pack.test.mjs executes the console's own code on the
// same input and requires the same five.
export function hash32(str) {
  let h = 2166136261 >>> 0; const s = String(str);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function selectProbesConsole(invariantLines, seed, count = 5) {
  return invariantLines
    .map(line => ({ line, id: line.split('|')[0].trim() }))
    .map(x => ({ ...x, h: hash32(seed + '|' + x.id) }))
    .sort((a, b) => a.h - b.h || a.id.localeCompare(b.id))
    .slice(0, count)
    .map(x => x.line);
}
export const SELECTORS = { sha: selectProbes, console: selectProbesConsole };

// Blocks persisted by the implement commands / /reflect at CHECKPOINT.
// F02 (Cycle 6): .cycle/blocks/ ACCUMULATES across cycles, and the first pack
// generated after Cycle 5 would have handed the verifier all nine Cycle-5
// blocks alongside the new ones. Blocks are named `<cycle>-…` for exactly this
// reason, so when a cycle is given only its prefix is read and everything else
// is reported as excluded (never silently dropped). With no cycle, every block
// is returned as before.
export function blockCycle(name) { const m = String(name).match(/^0*(\d+)-/); return m ? m[1] : null; }
export function readBlocks(dir, opts = {}) {
  const { cycle = null, readDir = readdirSync, read = f => readFileSync(f, 'utf8') } = opts;
  let names = [];
  try { names = readDir(dir).filter(n => n.endsWith('.md')).sort(); } catch { return Object.assign([], { excluded: [] }); }
  const want = cycle == null ? names : names.filter(n => blockCycle(n) === String(Number(cycle)));
  const excluded = names.filter(n => !want.includes(n));
  return Object.assign(want.map(n => ({ name: n, text: read(join(dir, n)).trim() })), { excluded });
}

// Cycle totals from the phase=reflect rows, plus the correction signal. A
// summary that /reflect had to correct is exactly what the verifier should not
// take on trust, so surface it automatically instead of relying on memory.
// F39 (Cycle 7): rows come from the ONE whole-text parser. Splitting on '\n'
// first and then parsing each line broke a quoted notes field containing a
// newline, silently dropping that row's defensive count and its CORRECTION
// warning — the one signal this pack exists to surface. Cycle numbers are
// compared numerically, so `--cycle 09` matches rows stamped 9.
export function sameCycle(a, b) {
  const x = String(a).trim(), y = String(b).trim();
  return /^\d+$/.test(x) && /^\d+$/.test(y) ? Number(x) === Number(y) : x === y;
}
export function cycleTotals(metricsCsv, cycle) {
  const rows = parseCSV(metricsCsv || '').slice(1);
  let net = 0, fixes = 0, nfm = 0, defensive = 0, n = 0;
  const corrections = [];
  for (const raw of rows) {
    // F03: a quote-aware parse — a comma-bearing SUBSYSTEM no longer shifts columns.
    const c = raw.map(x => x.trim());
    if (!sameCycle(c[1] || '', cycle) || c[3] !== 'reflect') continue;
    n++;
    net += parseFloat(c[4]) || 0; fixes += parseFloat(c[5]) || 0; nfm += parseFloat(c[6]) || 0;
    defensive += parseFloat(c[10]) || 0;
    const notes = c[9] || '';
    if (/CORRECTION/i.test(notes)) corrections.push(notes.slice(0, 240));
  }
  return { rows: n, net, fixes, nfm, defensive, corrections };
}

// INV-70 (Cycle 6 remediation): the probes are derived HERE, from the same `seed`
// string the header prints, so the pack cannot disclose one seed and select with
// another. It used to take `probes` as a parameter while main() passed
// selectProbes(invariants, fullSha) alongside seed.slice(0, 12) — so the printed
// reproduce command returned a different five, and §4v's "do NOT substitute your
// own picks" was unauditable. A `probes` override is deliberately NOT accepted:
// an override reopens exactly that divergence.
export function buildPack({ body, invariants, blocks, totals, cycle, seed, project, selector = 'sha' }) {
  if (!SELECTORS[selector]) throw new Error(`unknown selector "${selector}" — use sha or console`);
  const probes = SELECTORS[selector](invariants, seed);
  const header = [
    `CYCLE UNDER VERIFICATION: ${project} — Cycle ${cycle}`,
    '',
    'Everything §4v needs is in this file. Paste the WHOLE file into a fresh',
    'session that has no context from the implementation work.',
    '',
    `Rotation probes were seeded from ${seed} — they were NOT chosen by the`,
    'implementer. Reproduce the selection with:',
    `  node scripts/verification-pack.mjs --cycle ${cycle} --seed ${seed}${selector === 'console' ? ' --selector console' : ''}`,
    '',
  ];
  if (totals.rows) {
    header.push(
      `SELF-REPORTED TOTALS for cycle ${cycle} (${totals.rows} reflect row(s)) — treat as CLAIMS to re-derive:`,
      `  production fixes ${totals.fixes} | new failure modes ${totals.nfm} | net ${totals.net} | defensive/structural ${totals.defensive}`,
      '');
  } else {
    header.push(`NOTE: no phase=reflect rows for cycle ${cycle} in metrics.csv — the cycle may be unreflected.`, '');
  }
  if (totals.corrections.length) {
    header.push(
      '⚠ THE IMPLEMENTER ALREADY CORRECTED ITS OWN COUNTS THIS CYCLE:',
      ...totals.corrections.map(c => '  · ' + c),
      '',
      'Self-assessment ran high at least once here. Re-derive every count below',
      'from the code rather than accepting it.',
      '');
  }
  const excluded = (blocks && blocks.excluded) || [];
  const blockSection = (blocks.length
    ? blocks.map(b => `───── ${b.name} ─────\n${b.text}`).join('\n\n')
    : `(no blocks for cycle ${cycle} found in .cycle/blocks/ — paste the Implementation Summary and\n`
    + ' Cycle Summary Blocks here by hand, or run the implement commands with a\n'
    + ' .cycle/ directory present so they persist automatically)')
    + (excluded.length ? `\n\n(${excluded.length} block(s) from OTHER cycles present in .cycle/blocks/ and excluded: ${excluded.join(', ')})` : '');

  const filled = body
    .replace('[PASTE IMPLEMENTATION SUMMARY BLOCK HERE]', '(the cycle\'s blocks are reproduced above, under INPUT BLOCKS)')
    .replace('[PASTE CYCLE SUMMARY BLOCK FROM /REFLECT HERE]', '(the cycle\'s blocks are reproduced above, under INPUT BLOCKS)')
    .replace('[INVARIANT LIBRARY — the current library is injected here per project]',
      `INVARIANT LIBRARY (${project} — ${invariants.length} invariants):\n${invariants.join('\n')}`)
    .replace('[5 mandatory rotation probes — pre-selected from the library at render time]', probes.join('\n'));

  return [
    ...header,
    '═'.repeat(60), 'INPUT BLOCKS', '═'.repeat(60), '',
    blockSection, '',
    '═'.repeat(60),
    'CANONICAL §4v PROMPT (CLAUDE.md "Verification Pass") — library + probes injected',
    '═'.repeat(60), '',
    filled, '',
  ].join('\n');
}

// ── CLI ─────────────────────────────────────────────────────
function main(argv) {
  const arg = name => { const i = argv.indexOf('--' + name); return i !== -1 ? argv[i + 1] : null; };
  // F34: the PROJECT is the working directory (or --root), not the directory the
  // script happens to live in — run from a template checkout against a project,
  // the old script-relative root read the template's own .cycle/.
  const rootDir = resolve(arg('root') || process.cwd());
  const at = f => join(rootDir, f);

  const tried = [];
  let body = null;
  for (const cand of [arg('template'), at('CLAUDE.md'), fileURLToPath(new URL('../CLAUDE.md', import.meta.url))].filter(Boolean)) {
    if (tried.includes(cand)) continue;
    tried.push(cand);
    try { body = sectionBody(readFileSync(cand, 'utf8'), 'Verification Pass'); } catch {}
    if (body) break;
  }
  if (!body) {
    console.error('Could not find the "Verification Pass" section. Looked in:\n' + tried.map(t => '  ' + t).join('\n')
      + '\nIt lives in the claude-workflow-tools CLAUDE.md — pass --template <path to that CLAUDE.md>.');
    return 1;
  }

  const cfgPath = existsSync(at('.cycle/config.md')) ? at('.cycle/config.md') : at('CLAUDE.md');
  const invariants = readInvariants(readFileSync(cfgPath, 'utf8'));
  if (!invariants.length) { console.error(`No invariants found in ${cfgPath}.`); return 1; }

  let cycle = arg('cycle');
  if (!cycle) {
    try { cycle = (readFileSync(at('.cycle/STATE.md'), 'utf8').match(/^Cycle:\s*(\d+)/m) || [])[1]; } catch {}
  }
  if (!cycle) { console.error('No cycle number — pass --cycle N or add a Cycle: field to .cycle/STATE.md.'); return 1; }

  // INV-70: resolve the seed to its FINAL form here and never post-process it.
  // `--short=12` at the source replaces the old `seed.slice(0, 12)` applied at
  // the print site only — truncating after selection is what made the disclosed
  // seed and the used seed different strings.
  let seed = arg('seed');
  if (!seed) {
    try { seed = execSync('git rev-parse --short=12 HEAD', { cwd: rootDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
    catch { seed = 'no-git-' + cycle; }
  }

  // F21: `--selector console` reproduces the console's §4v picks from the seed
  // its prompt states ("<project>:<UTC day>"); the default is the sha selection.
  const selector = arg('selector') || 'sha';
  if (!SELECTORS[selector]) { console.error(`Unknown --selector "${selector}" — use sha (default) or console.`); return 1; }

  let metrics = '';
  try { metrics = readFileSync(at('.cycle/metrics.csv'), 'utf8'); } catch {}

  const pack = buildPack({
    body, invariants,
    blocks: readBlocks(at('.cycle/blocks'), { cycle }),
    totals: cycleTotals(metrics, cycle),
    cycle, seed, project: arg('project') || basename(rootDir), selector,
  });

  const out = arg('out');
  if (out) { writeFileSync(out, pack); console.log(`Wrote ${out} (${pack.length} chars).`); }
  else process.stdout.write(pack);
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
