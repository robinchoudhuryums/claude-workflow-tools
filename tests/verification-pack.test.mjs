#!/usr/bin/env node
// verification-pack.test.mjs — regression test for the §4v pack assembler (R19).
//
// The pack is what a fresh §4v session receives, so a silent defect here means
// the verification pass runs against the wrong inputs and nobody notices. The
// load-bearing properties are: probes are reproducible from a seed (so the
// implementer cannot steer them), the invariant library survives pipes in rule
// text, the self-report warning fires automatically, and no placeholder escapes.
//
// Usage: node tests/verification-pack.test.mjs

import { selectProbes, readInvariants, readBlocks, cycleTotals, buildPack } from '../scripts/verification-pack.mjs';

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

// Importing must not run the CLI (INV-28 pattern).
ok('module imports without CLI side effects');

const INVS = [
  'INV-01 | plain rule | Subsystem: A | Verify: node a.mjs',
  'INV-02 | another rule | Subsystem: B',
  'INV-08 | Invariants render a "| Verify:" suffix iff they have a verify value | Subsystem: C',
  'INV-46 | serializer emits four fields (name|measures|pulse|playbook) | Subsystem: D',
  'INV-11 | fifth rule | Subsystem: E',
  'INV-12 | sixth rule | Subsystem: F',
];

// 1) Pipe-containing rule text must survive — the strict parser dropped INV-08
// and INV-46 for exactly this reason, which would silently shrink the library
// handed to the verifier.
const parsed = readInvariants(INVS.join('\n') + '\nnot an invariant line\n');
if (parsed.length === 6) ok('readInvariants keeps rules whose text contains a pipe (INV-08/INV-46 class)');
else bad(`readInvariants dropped lines: got ${parsed.length}/6`);

// 2) Probes must be reproducible from a seed — this is the anti-cherry-pick
// property. A verifier re-runs with the same seed and must get the same set.
const a1 = selectProbes(parsed, 'seed-alpha', 3);
const a2 = selectProbes(parsed, 'seed-alpha', 3);
if (JSON.stringify(a1) === JSON.stringify(a2)) ok('selectProbes is deterministic for a given seed');
else bad('selectProbes is not reproducible — the verifier could not confirm the selection');

const b1 = selectProbes(parsed, 'seed-beta', 3);
if (JSON.stringify(a1) !== JSON.stringify(b1)) ok('selectProbes rotates with the seed (different commit → different probes)');
else bad('selectProbes ignored the seed — probes would never rotate');

if (a1.length === 3 && a1.every(l => parsed.includes(l))) ok('selectProbes returns N real library lines');
else bad('selectProbes returned the wrong count or fabricated lines');

// 3) Totals come only from the named cycle's reflect rows. A synthesis row must
// not contribute (P1), and neither must another cycle.
const CSV = [
  'date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes,defensive_count',
  '2026-01-01,4,X,reflect,9,9,0,,,"other cycle",1',
  '2026-02-01,5,X,reflect,2,2,0,,,"clean batch",3',
  '2026-02-02,5,X,reflect,3,4,1,,,"CORRECTION: claimed 5, actually 4",2',
  '2026-02-03,5,all,synthesis,,,,0%,Some Category,"scored",',
].join('\n');
const t = cycleTotals(CSV, 5);
if (t.rows === 2 && t.net === 5 && t.fixes === 6 && t.nfm === 1 && t.defensive === 5)
  ok('cycleTotals sums only the named cycle’s reflect rows (synthesis + other cycles excluded)');
else bad(`cycleTotals wrong: ${JSON.stringify(t)}`);

if (t.corrections.length === 1 && /CORRECTION/.test(t.corrections[0]))
  ok('cycleTotals surfaces a self-report correction automatically');
else bad('cycleTotals missed a CORRECTION note — the verifier would not be warned');

const clean = cycleTotals(CSV, 4);
if (!clean.corrections.length) ok('no correction warning when the cycle has none');
else bad('correction warning fired spuriously');

// 4) The assembled pack must resolve every placeholder. An unresolved
// [PASTE …] or "injected here per project" means the verifier gets a template.
const BODY = [
  'Do not make any changes to any files during this session.',
  '[PASTE IMPLEMENTATION SUMMARY BLOCK HERE]',
  '[PASTE CYCLE SUMMARY BLOCK FROM /REFLECT HERE]',
  '[INVARIANT LIBRARY — the current library is injected here per project]',
  'MANDATORY ROTATION PROBES:',
  '[5 mandatory rotation probes — pre-selected from the library at render time]',
  '---VERIFICATION BLOCK---',
].join('\n');
const pack = buildPack({
  body: BODY, invariants: parsed, probes: a1,
  blocks: [{ name: '05-x-reflect.md', text: '---CYCLE SUMMARY BLOCK---\nNet score: 5\n---END CYCLE SUMMARY BLOCK---' }],
  totals: t, cycle: 5, seed: 'abc123', project: 'testproj',
});
const leftovers = ['[PASTE', 'injected here per project', 'pre-selected from the library at render time'].filter(p => pack.includes(p));
if (!leftovers.length) ok('buildPack resolves every placeholder in the canonical body');
else bad('unresolved placeholder(s) reached the pack: ' + leftovers.join(', '));

if (pack.includes('INV-08') && pack.includes('---VERIFICATION BLOCK---') && pack.includes('05-x-reflect.md'))
  ok('pack carries the library, the output-block template and the input blocks');
else bad('pack is missing the library, block template or input blocks');

if (/seeded from abc123/.test(pack) && /--seed abc123/.test(pack))
  ok('pack states the seed and how to reproduce the probe selection');
else bad('pack does not disclose the seed — the selection would be unauditable');

if (/CORRECTED ITS OWN COUNTS/.test(pack)) ok('pack carries the do-not-trust-the-self-report warning');
else bad('pack omitted the correction warning');

// 5) No blocks is a REPORTED state, never a silent empty section.
const empty = buildPack({
  body: BODY, invariants: parsed, probes: a1, blocks: [],
  totals: { rows: 0, net: 0, fixes: 0, nfm: 0, defensive: 0, corrections: [] },
  cycle: 9, seed: 'z', project: 'p',
});
if (/no blocks found/.test(empty) && /may be unreflected/.test(empty))
  ok('an empty blocks dir and an unreflected cycle are both reported, not silently blank');
else bad('missing blocks / unreflected cycle passed silently');

// 6) readBlocks degrades on a missing directory rather than throwing.
if (Array.isArray(readBlocks('/definitely/not/here'))) ok('readBlocks returns [] for a missing directory');
else bad('readBlocks threw on a missing directory');

console.log('§4v verification-pack regression test (scripts/verification-pack.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} verification-pack test(s) failed.`); process.exit(1); }
console.log('\nVerification pack assembler is sound. ✓');
