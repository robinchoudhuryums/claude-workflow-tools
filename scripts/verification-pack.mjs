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
//   (cycle defaults to .cycle/STATE.md's Cycle field — the single source of
//    truth per P3; seed defaults to the current git HEAD sha.)
//
// Importable: exports selectProbes / readInvariants / readBlocks / blockCycle /
// cycleTotals / buildPack for the regression test. No CLI side effects on import (INV-28).

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { sectionBody } from './gen-html-prompts.mjs';
import { parseRow } from './csv.mjs';

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
export function cycleTotals(metricsCsv, cycle) {
  const rows = metricsCsv.split('\n').slice(1).filter(Boolean);
  let net = 0, fixes = 0, nfm = 0, defensive = 0, n = 0;
  const corrections = [];
  for (const raw of rows) {
    // F03: a quote-aware split. The old bare split assumed only `notes` could
    // hold a comma and silently skipped every row whose SUBSYSTEM had one.
    const c = parseRow(raw).map(x => x.trim());
    if (c[1] !== String(cycle) || c[3] !== 'reflect') continue;
    n++;
    net += parseFloat(c[4]) || 0; fixes += parseFloat(c[5]) || 0; nfm += parseFloat(c[6]) || 0;
    defensive += parseFloat(c[10]) || 0;
    const notes = c[9] || '';
    if (/CORRECTION/i.test(notes)) corrections.push(notes.slice(0, 240));
  }
  return { rows: n, net, fixes, nfm, defensive, corrections };
}

export function buildPack({ body, invariants, probes, blocks, totals, cycle, seed, project }) {
  const header = [
    `CYCLE UNDER VERIFICATION: ${project} — Cycle ${cycle}`,
    '',
    'Everything §4v needs is in this file. Paste the WHOLE file into a fresh',
    'session that has no context from the implementation work.',
    '',
    `Rotation probes were seeded from ${seed} — they were NOT chosen by the`,
    'implementer. Reproduce the selection with:',
    `  node scripts/verification-pack.mjs --cycle ${cycle} --seed ${seed}`,
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
  const root = new URL('..', import.meta.url);
  const at = f => fileURLToPath(new URL(f, root));
  const arg = name => { const i = argv.indexOf('--' + name); return i !== -1 ? argv[i + 1] : null; };

  const body = sectionBody(readFileSync(at('CLAUDE.md'), 'utf8'), 'Verification Pass');
  if (!body) { console.error('Could not find the "Verification Pass" section in CLAUDE.md.'); return 1; }

  const cfgPath = existsSync(at('.cycle/config.md')) ? at('.cycle/config.md') : at('CLAUDE.md');
  const invariants = readInvariants(readFileSync(cfgPath, 'utf8'));
  if (!invariants.length) { console.error(`No invariants found in ${cfgPath}.`); return 1; }

  let cycle = arg('cycle');
  if (!cycle) {
    try { cycle = (readFileSync(at('.cycle/STATE.md'), 'utf8').match(/^Cycle:\s*(\d+)/m) || [])[1]; } catch {}
  }
  if (!cycle) { console.error('No cycle number — pass --cycle N or add a Cycle: field to .cycle/STATE.md.'); return 1; }

  let seed = arg('seed');
  if (!seed) {
    try { seed = execSync('git rev-parse HEAD', { cwd: at('.'), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
    catch { seed = 'no-git-' + cycle; }
  }

  let metrics = '';
  try { metrics = readFileSync(at('.cycle/metrics.csv'), 'utf8'); } catch {}

  const pack = buildPack({
    body, invariants,
    probes: selectProbes(invariants, seed),
    blocks: readBlocks(at('.cycle/blocks'), { cycle }),
    totals: cycleTotals(metrics, cycle),
    cycle, seed: seed.slice(0, 12), project: 'claude-workflow-tools',
  });

  const out = arg('out');
  if (out) { writeFileSync(out, pack); console.log(`Wrote ${out} (${pack.length} chars).`); }
  else process.stdout.write(pack);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main(process.argv.slice(2)));
}
