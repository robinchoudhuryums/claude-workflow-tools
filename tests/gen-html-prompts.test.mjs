#!/usr/bin/env node
// gen-html-prompts.test.mjs — regression test for the R14 transform engine.
// Unit-tests the pure helpers (commandBody extraction, usage-guard drop,
// placeholder replacement, HTML escaping) on fixtures.

import { commandBody, sectionBody, transform, esc, unesc, norm, canonicalCoverage, renderDynamicPrompt, scanPres, preBody } from '../scripts/gen-html-prompts.mjs';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync as rfs, writeFileSync as wfs, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// sectionBody: extracts the first fenced block under a NON-slash ### heading
// (the §4v/§1s/§6a lock source — must NOT mint a /command).
const secMd = [
  '### Verification Pass (Section 4v in HTML tool)', '',
  'Some descriptive prose with bullets.', '- a bullet', '',
  '```', 'CANONICAL BODY LINE 1', 'CANONICAL BODY LINE 2', '```', '',
  '### Next Section', '', '```', 'other', '```',
].join('\n');
const sb = sectionBody(secMd, 'Verification Pass');
if (sb === 'CANONICAL BODY LINE 1\nCANONICAL BODY LINE 2') ok('sectionBody extracts the fenced block under a ### heading (past intro prose)'); else bad('sectionBody extraction wrong: ' + JSON.stringify(sb));
if (sectionBody(secMd, 'Nope') === null) ok('sectionBody returns null for a missing heading'); else bad('sectionBody missing-heading not null');
if (sectionBody(['### Bare Heading', '', 'no fence here', '', '### Other'].join('\n'), 'Bare Heading') === null) ok('sectionBody returns null when no fenced body precedes the next heading'); else bad('sectionBody did not null a fence-less section');

const m = { drop: true, replace: [['$ARGUMENTS', '[SUBSYSTEM GROUP NAME]']] };
const out = transform(body, m);
if (!/respond with usage and stop/.test(out)) ok('transform drops the leading usage guard'); else bad('usage guard not dropped');
if (/Audit \[SUBSYSTEM GROUP NAME\] across/.test(out) && !/\$ARGUMENTS/.test(out)) ok('transform applies placeholder replacements'); else bad('replacement not applied');

if (esc('a <b> & c') === 'a &lt;b&gt; &amp; c') ok('esc escapes &, <, >'); else bad('esc wrong');
if (unesc('a &lt;b&gt; &amp; c') === 'a <b> & c') ok('unesc round-trips esc'); else bad('unesc wrong');
if (JSON.stringify(norm('Line A\n\n[PASTE X]\n  Line B  ')) === JSON.stringify(['line a', 'line b'])) ok('norm drops blanks + placeholder lines and lowercases'); else bad('norm wrong');

// transform with drop=false leaves the body intact
if (transform('keep me\n---\nand me', { drop: false }) === 'keep me\n---\nand me') ok('drop=false leaves body intact'); else bad('drop=false altered body');

// ── R16 dynamic-builder lock ────────────────────────────────
// canonicalCoverage: every canonical line must be present; a missing one is
// caught (fail-closed), and extra rendered lines (injected config) are ignored.
const covMiss = canonicalCoverage('alpha\nbeta\ngamma', 'alpha\ngamma', { drop: false });
if (covMiss.missing.length === 1 && covMiss.missing[0] === 'beta' && covMiss.total === 3 && covMiss.present === 2) ok('canonicalCoverage flags a missing canonical line (fail-closed)'); else bad('canonicalCoverage did not flag the missing line');
const covExtra = canonicalCoverage('alpha\nbeta', 'extra\nALPHA\nbeta\nmore', { drop: false });
if (covExtra.missing.length === 0) ok('canonicalCoverage ignores extra rendered lines (injected config)'); else bad('canonicalCoverage wrongly flagged extra lines');
const covDrop = canonicalCoverage('usage\n---\nreal body', 'real body', { drop: true });
if (covDrop.missing.length === 0) ok('canonicalCoverage applies the usage-guard drop before comparing'); else bad('canonicalCoverage did not honor drop');

// renderDynamicPrompt: executes the inline <script> under a stubbed DOM and
// returns a builder's output (project-arg and no-arg paths).
const fakeHtml = '<html><body><script>function getProject(id){return {id:id,healthDimensions:"A, B"}}\nfunction buildX(p){return "rate "+p.id+"\\n- "+p.healthDimensions}\nfunction buildY(){return "static body"}</script></body></html>';
if (renderDynamicPrompt(fakeHtml, 'buildX', 'obs') === 'rate obs\n- A, B') ok('renderDynamicPrompt renders a project-arg builder'); else bad('renderDynamicPrompt project-arg path wrong');
if (renderDynamicPrompt(fakeHtml, 'buildY', null) === 'static body') ok('renderDynamicPrompt renders a no-arg builder'); else bad('renderDynamicPrompt no-arg path wrong');
if (renderDynamicPrompt(fakeHtml, 'missingFn', 'obs') === null) ok('renderDynamicPrompt returns null for a missing builder'); else bad('renderDynamicPrompt did not null-guard a missing builder');

// F48 (Cycle 7): <pre> detection is attribute-order-agnostic, ignores <pre>
// markup inside <script>, and reports an id-less static prompt rather than
// skipping it.
{
  const h = '<pre id="a">A</pre><pre class="p" id="b">B &amp; c</pre><pre data-id="x" id=\'c\' >C</pre><pre style="x">loose</pre><script>const t=`<pre id="js">no</pre>`;</script>';
  const ids = scanPres(h).map(p => p.id);
  if (JSON.stringify(ids) === JSON.stringify(['a', 'b', 'c', null])) ok('scanPres finds every <pre> whatever the attribute order, skips <script>, keeps an id-less one'); else bad('scanPres ids wrong: ' + JSON.stringify(ids));
  if (preBody(h, 'b') === 'B & c' && preBody(h, 'c') === 'C' && preBody(h, 'x') === null) ok('preBody matches by id attribute, not by attribute order (and not data-id)'); else bad('preBody did not match reordered attributes');
  // End to end: a new static prompt with its id SECOND must fail --assert.
  const repo = fileURLToPath(new URL('..', import.meta.url));
  for (const [label, markup, signal] of [
    ['reordered attributes', '<pre class="prompt" id="zz-new">Brand new static prompt</pre>', /outside the lock manifest: zz-new/],
    ['no id at all', '<pre class="prompt">Brand new static prompt</pre>', /outside the lock manifest: \(a <pre> with no id/],
  ]) {
    const d = mkdtempSync(join(tmpdir(), 'cwt-ghp-'));
    try {
      mkdirSync(join(d, 'scripts'));
      copyFileSync(join(repo, 'scripts', 'gen-html-prompts.mjs'), join(d, 'scripts', 'gen-html-prompts.mjs'));
      copyFileSync(join(repo, 'CLAUDE.md'), join(d, 'CLAUDE.md'));
      wfs(join(d, 'claude-code-guide-v2.html'), rfs(join(repo, 'claude-code-guide-v2.html'), 'utf8').replace('</body>', markup + '</body>'));
      let out = '', code = 0;
      try { out = execFileSync('node', [join(d, 'scripts', 'gen-html-prompts.mjs'), '--assert'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
      catch (e) { code = e.status ?? 1; out = (e.stdout || '') + (e.stderr || ''); }
      if (code !== 0 && signal.test(out)) ok(`--assert flags a new static prompt with ${label} (F48)`); else bad(`--assert missed a static prompt with ${label} (code ${code})`);
    } finally { rmSync(d, { recursive: true, force: true }); }
  }
}

console.log('R14 transform engine regression test (scripts/gen-html-prompts.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} gen-html-prompts test(s) failed.`); process.exit(1); }
console.log('\nR14 transform engine is sound. ✓');
