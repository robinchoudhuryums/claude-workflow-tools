#!/usr/bin/env node
// check-output-blocks.test.mjs — regression test for the R13 output-block
// shape harness. Confirms the real repo passes, that findSpans handles the
// asymmetric SESSION delimiter, and that validate() fails closed on each
// injected drift class (dropped field, broken delimiter, producer no longer
// emitting, unregistered new block).

import { readFileSync } from 'node:fs';
import { BLOCKS, findSpans, validate } from '../scripts/check-output-blocks.mjs';

const root = new URL('..', import.meta.url);
const claudeMd = readFileSync(new URL('CLAUDE.md', root), 'utf8');
const realLoad = name => { try { return readFileSync(new URL(`.claude/commands/${name}.md`, root), 'utf8'); } catch { return null; } };

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

// 1. Baseline: the real repo is shape-valid.
const base = validate(claudeMd, realLoad);
if (base.length === 0) ok('baseline (real CLAUDE.md + .claude/commands) passes'); else bad('baseline failed: ' + base.join(' | '));

// 2. findSpans handles the asymmetric SESSION HANDOFF close delimiter.
const sessSpans = findSpans(claudeMd, '---SESSION HANDOFF BLOCK---', '---END HANDOFF BLOCK---');
if (sessSpans.length >= 2 && sessSpans[0].body.includes('RECOMMENDED PLANNING STARTING POINT:'))
  ok('findSpans extracts the asymmetric SESSION HANDOFF span(s)'); else bad('findSpans missed the SESSION span / body');

// 3. Dropped field is detected (remove a CYCLE SUMMARY field — single span).
{
  const mutated = claudeMd.replace('Most structurally significant change: [one line]', 'X: [one line]');
  const f = validate(mutated, realLoad);
  if (f.some(x => x.includes('CYCLE SUMMARY BLOCK') && x.includes('Most structurally significant change:')))
    ok('detects a dropped required field'); else bad('did not detect a dropped field');
}

// 4. Broken close delimiter is detected (unbalanced + unregistered close).
{
  const mutated = claudeMd.replace('---END CYCLE SUMMARY BLOCK---', '---END CYCLE SUMMARY---');
  const f = validate(mutated, realLoad);
  if (f.some(x => x.includes('CYCLE SUMMARY') && (x.includes('unbalanced') || x.includes('Unregistered'))))
    ok('detects a broken/renamed delimiter'); else bad('did not detect a broken delimiter');
}

// 5. Producer no longer emitting its block is detected.
{
  const stubLoad = name => (name === 'audit' ? 'a command that forgot to emit anything' : realLoad(name));
  const f = validate(claudeMd, stubLoad);
  if (f.some(x => x.includes('SESSION HANDOFF BLOCK') && x.includes('/audit') && x.includes('no longer emits')))
    ok('detects a producer that no longer emits its block'); else bad('did not detect a non-emitting producer');
}

// 6. An unregistered new block delimiter is detected.
{
  const mutated = claudeMd + '\n---NEW SHINY BLOCK---\nfoo\n---END NEW SHINY BLOCK---\n';
  const f = validate(mutated, realLoad);
  if (f.some(x => x.includes('Unregistered') && x.includes('NEW SHINY BLOCK')))
    ok('detects an unregistered new block delimiter'); else bad('did not detect an unregistered block');
}

// 7. Registry covers a producer command for each non-section block.
{
  const orphan = BLOCKS.filter(b => b.producer === null && !b.inFormats);
  if (orphan.length === 0) ok('every command-produced block has a producer (section blocks are inFormats)'); else bad('a block has neither producer nor Formats home');
}

console.log('R13 output-block harness regression test (scripts/check-output-blocks.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} output-block harness test(s) failed.`); process.exit(1); }
console.log('\nOutput-block harness fails closed on injected drift. ✓');
