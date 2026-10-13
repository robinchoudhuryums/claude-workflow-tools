#!/usr/bin/env node
// check-output-blocks.test.mjs — regression test for the R13 output-block
// shape harness. Confirms the real repo passes, that findSpans handles the
// asymmetric SESSION delimiter, and that validate() fails closed on each
// injected drift class (dropped field, broken delimiter, producer no longer
// emitting, unregistered new block).

import { readFileSync } from 'node:fs';
import { BLOCKS, findSpans, validate, fieldLabels, validateCopies } from '../scripts/check-output-blocks.mjs';

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

// 8. F50 (Cycle 7): every copy of a block carries the same FULL field set —
// not just the registry's hand-listed subset. Both live drifts the scan found
// are reproduced here, and the real files must agree.
{
  if (JSON.stringify(fieldLabels('Scope: [x]\nFINDINGS:\n[ID] | [a: b]\nValidated (${n} existing):\n- note: y')) === JSON.stringify(['Scope', 'FINDINGS']))
    ok('fieldLabels reads line labels, skipping rows, list items and builder-rendered ${…} labels (F50)');
  else bad('fieldLabels wrong: ' + JSON.stringify(fieldLabels('Scope: [x]\nFINDINGS:\n[ID] | [a: b]\nValidated (${n} existing):\n- note: y')));
  const claude = readFileSync(new URL('CLAUDE.md', root), 'utf8'), html = readFileSync(new URL('claude-code-guide-v2.html', root), 'utf8');
  const live = validateCopies(claude, html);
  if (!live.length) ok('every block copy in CLAUDE.md and the console agrees on its field labels (F50)'); else bad('live block copies disagree: ' + live.slice(0, 2).join(' | '));
  const fmt = claude.indexOf('## Handoff Block Formats');
  const dropCycle = claude.slice(0, fmt) + claude.slice(fmt).replace('Cycle being verified: [subsystem + cycle identifier from implementation summary]\n', '');
  if (validateCopies(dropCycle, html).some(f => /VERIFICATION BLOCK .*Cycle being verified/.test(f))) ok('detects the Formats VERIFICATION BLOCK dropping "Cycle being verified:" (F50)'); else bad('missed a dropped field in the Formats copy (F50)');
  const renamed = claude.slice(0, fmt) + claude.slice(fmt).replace('Production bugs (would fire this month): [count]', 'Production bugs: [count]');
  if (validateCopies(renamed, html).some(f => /TIER 2 HANDOFF BLOCK .*Production bugs/.test(f))) ok('detects a TIER 2 copy renaming "Production bugs (would fire this month):" (F50)'); else bad('missed a renamed field across copies (F50)');
}

console.log('R13 output-block harness regression test (scripts/check-output-blocks.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} output-block harness test(s) failed.`); process.exit(1); }
console.log('\nOutput-block harness fails closed on injected drift. ✓');
