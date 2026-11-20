#!/usr/bin/env node
// cycle-context.test.mjs — regression test for the SessionStart hook (R6).
// Asserts it surfaces the right substrate when .cycle/ exists and stays
// silent (and exits 0) when it does not.

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/cycle-context.mjs', import.meta.url));
// The hook reads CLAUDE_PROJECT_DIR (F11). Every case sets or clears it
// explicitly: run inside a Claude Code session the variable is already in the
// environment, and an inherited value would point every fixture at this repo.
const BASE_ENV = { ...process.env }; delete BASE_ENV.CLAUDE_PROJECT_DIR;
const run = (cwd, extra = {}) => { try { return execFileSync('node', [script], { cwd, encoding: 'utf8', env: { ...BASE_ENV, ...extra } }); } catch (e) { return '__THREW__:' + e.message; } };

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

// Case A: a project with .cycle/STATE.md gets a context block.
const a = mkdtempSync(join(tmpdir(), 'cwt-ctx-a-'));
mkdirSync(join(a, '.cycle'));
writeFileSync(join(a, '.cycle', 'STATE.md'), '# Cycle State\n\n## Current\nCycle: 7\nPhase: implement\n\n## Where I left off\nMid-wave on subsystem X.\n');
writeFileSync(join(a, '.cycle', 'config.md'), 'INV-01 | a | Subsystem: X\nINV-02 | b | Subsystem: Y\n');
const outA = run(a);
if (/WORKFLOW CONTEXT/.test(outA)) ok('emits a context block when .cycle/ exists'); else bad('no context block emitted');
if (/Cycle: 7/.test(outA) && /Mid-wave on subsystem X/.test(outA)) ok('includes STATE.md Current + Where I left off'); else bad('STATE sections missing');
if (/2 invariants/.test(outA)) ok('reports the invariant count from .cycle/config.md'); else bad('invariant count missing');
rmSync(a, { recursive: true, force: true });

// Case A2 (F35, Cycle 7): a CRLF library with an indented rule counts every
// rule — the same ground truth as the INV-68 floor and invariant-check.
const a2 = mkdtempSync(join(tmpdir(), 'cwt-ctx-a2-'));
mkdirSync(join(a2, '.cycle'));
writeFileSync(join(a2, '.cycle', 'STATE.md'), '# Cycle State\r\n\r\n## Current\r\nCycle: 1\r\n');
writeFileSync(join(a2, '.cycle', 'config.md'), ['INV-01 | a | Subsystem: X', ' INV-02 | indented | Subsystem: Y', 'INV-03 | c | Subsystem: Z', ''].join('\r\n'));
if (/3 invariants/.test(run(a2))) ok('counts every rule in a CRLF library, indented ones included (F35)'); else bad('CRLF/indented invariant count wrong');
rmSync(a2, { recursive: true, force: true });

// Case A3 (F37, Cycle 7): the Pending section and PROJECT_HEALTH.md's Current
// Standing are half of what the hook carries forward, and neither had a
// fixture — deleting either output passed the full Test Command. The section
// after Current Standing (the score history) must NOT leak in.
const a3 = mkdtempSync(join(tmpdir(), 'cwt-ctx-a3-'));
mkdirSync(join(a3, '.cycle'));
writeFileSync(join(a3, '.cycle', 'STATE.md'), '# Cycle State\n\n## Current\nCycle: 3\n\n## Completed this cycle\n- A1 | x | done-marker\n\n## Pending / not yet done\n- A9 pending-marker\n\n## Where I left off\nResume at A9.\n');
writeFileSync(join(a3, 'PROJECT_HEALTH.md'), '# Project Health\n\n## Current Standing\nOverall (weighted avg): 7.5/10\nTop vertical priority: standing-marker\n\n## Score History\n### Cycle 2 — history-marker\n');
const outA3 = run(a3);
if (/## Pending \/ not yet done\n- A9 pending-marker/.test(outA3)) ok('includes STATE.md Pending / not yet done (F37)'); else bad('Pending section missing from the hook output (F37)');
if (/## Current Standing \(PROJECT_HEALTH\.md\)\nOverall \(weighted avg\): 7\.5\/10\nTop vertical priority: standing-marker/.test(outA3)) ok('includes PROJECT_HEALTH.md Current Standing (F37)'); else bad('Current Standing missing from the hook output (F37)');
if (!/history-marker|done-marker/.test(outA3)) ok('carries only the substrate sections — no score history, no completed list (F37)'); else bad('hook leaked a section it should not carry (score history or Completed)');
rmSync(a3, { recursive: true, force: true });

// Case B: a project WITHOUT .cycle/ stays silent and exits 0.
const b = mkdtempSync(join(tmpdir(), 'cwt-ctx-b-'));
const outB = run(b);
if (outB === '') ok('stays silent (and exits 0) when .cycle/ is absent'); else bad('expected empty output without .cycle/, got: ' + JSON.stringify(outB.slice(0, 60)));
rmSync(b, { recursive: true, force: true });

// Cycle-8 F11: the hook is rooted at the PROJECT directory, not the working
// directory. The settings.json command was `node scripts/cycle-context.mjs`
// and the script read process.cwd(): from a session started in a subdirectory
// the command could not find the script (exit 1) and, had it run, would have
// looked for .cycle/ in the wrong place and printed nothing.
{
  const proj = mkdtempSync(join(tmpdir(), 'cwt-ctx-root-'));
  mkdirSync(join(proj, '.cycle'));
  mkdirSync(join(proj, 'packages', 'web'), { recursive: true });
  mkdirSync(join(proj, 'scripts'));
  writeFileSync(join(proj, '.cycle', 'STATE.md'), '# Cycle State\n\n## Current\nCycle: 4\nPhase: implement\n');
  writeFileSync(join(proj, 'scripts', 'cycle-context.mjs'), readFileSync(script, 'utf8'));
  const sub = join(proj, 'packages', 'web');
  const problems = [];
  // (a) the script itself: cwd is a subdirectory, the project comes from the hook's env.
  const fromSub = run(sub, { CLAUDE_PROJECT_DIR: proj });
  if (!/Cycle: 4/.test(fromSub)) problems.push('the script ignores CLAUDE_PROJECT_DIR — run from a subdirectory it finds no .cycle/ and prints nothing');
  // (b) the command this repo ships in .claude/settings.json, through a shell, as a hook runs it.
  let cmd = '';
  try { cmd = JSON.parse(readFileSync(new URL('../.claude/settings.json', import.meta.url), 'utf8')).hooks.SessionStart[0].hooks[0].command; } catch (e) { problems.push('could not read the SessionStart command from .claude/settings.json'); }
  const viaShell = (cwd, extra) => { try { return execFileSync('sh', ['-c', cmd], { cwd, encoding: 'utf8', env: { ...BASE_ENV, ...extra }, stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { return '__FAILED__ exit ' + e.status + ': ' + String(e.stderr || '').split('\n')[0]; } };
  if (cmd) {
    const hookSub = viaShell(sub, { CLAUDE_PROJECT_DIR: proj });
    if (!/Cycle: 4/.test(hookSub)) problems.push(`the settings.json command fails from a subdirectory — ${hookSub.slice(0, 90)}`);
    const hookRoot = viaShell(proj, {});
    if (!/Cycle: 4/.test(hookRoot)) problems.push(`the settings.json command fails from the project root when CLAUDE_PROJECT_DIR is unset — ${hookRoot.slice(0, 90)}`);
    if (!cmd.includes('CLAUDE_PROJECT_DIR')) problems.push('the settings.json command is not rooted at CLAUDE_PROJECT_DIR');
  }
  if (!problems.length) ok('the hook is rooted at the project directory: it works from a subdirectory, and still from the root with no CLAUDE_PROJECT_DIR (Cycle-8 F11)');
  else bad('Cycle-8 F11: ' + problems.join('; '));
  rmSync(proj, { recursive: true, force: true });
}

console.log('SessionStart hook regression test (scripts/cycle-context.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} cycle-context test(s) failed.`); process.exit(1); }
console.log('\nSessionStart context hook is sound. ✓');
