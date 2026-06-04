#!/usr/bin/env node
// gen-html-prompts.test.mjs — regression test for the R14 transform engine.
// Unit-tests the pure helpers (commandBody extraction, usage-guard drop,
// placeholder replacement, HTML escaping) on fixtures.

import { commandBody, transform, esc, unesc, norm } from '../scripts/gen-html-prompts.mjs';

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

const md = [
  '### /audit', '', '```',
  'If $ARGUMENTS is empty, respond with usage and stop.', '',
  '---', '',
  'Audit $ARGUMENTS across these focus areas:', '1. Bugs', '```',
  '', '### /other', '', '```', 'unrelated', '```',
].join('\n');

const body = commandBody(md, 'audit');
if (body && body.includes('Audit $ARGUMENTS across') && !body.includes('### /other')) ok('commandBody extracts the right fenced block'); else bad('commandBody extraction wrong');
if (commandBody(md, 'nope') === null) ok('commandBody returns null for a missing command'); else bad('missing command not null');

const m = { drop: true, replace: [['$ARGUMENTS', '[SUBSYSTEM GROUP NAME]']] };
const out = transform(body, m);
if (!/respond with usage and stop/.test(out)) ok('transform drops the leading usage guard'); else bad('usage guard not dropped');
if (/Audit \[SUBSYSTEM GROUP NAME\] across/.test(out) && !/\$ARGUMENTS/.test(out)) ok('transform applies placeholder replacements'); else bad('replacement not applied');

if (esc('a <b> & c') === 'a &lt;b&gt; &amp; c') ok('esc escapes &, <, >'); else bad('esc wrong');
if (unesc('a &lt;b&gt; &amp; c') === 'a <b> & c') ok('unesc round-trips esc'); else bad('unesc wrong');
if (JSON.stringify(norm('Line A\n\n[PASTE X]\n  Line B  ')) === JSON.stringify(['line a', 'line b'])) ok('norm drops blanks + placeholder lines and lowercases'); else bad('norm wrong');

// transform with drop=false leaves the body intact
if (transform('keep me\n---\nand me', { drop: false }) === 'keep me\n---\nand me') ok('drop=false leaves body intact'); else bad('drop=false altered body');

console.log('R14 transform engine regression test (scripts/gen-html-prompts.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} gen-html-prompts test(s) failed.`); process.exit(1); }
console.log('\nR14 transform engine is sound. ✓');
