#!/usr/bin/env node
// invariant-check.test.mjs — regression test for the invariant runner (R9).
// Runs scripts/invariant-check.mjs against a fixture library and asserts it
// runs command Verify fields (incl. annotated ones), fails on a failing
// command, classifies prose Verify as MANUAL, and dedupes identical commands.

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/invariant-check.mjs', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'cwt-inv-'));
const src = join(dir, 'config.md');
writeFileSync(src, [
  'INV-01 | always passes | Subsystem: X | Verify: node -e "process.exit(0)"',
  'INV-02 | always fails | Subsystem: X | Verify: node -e "process.exit(1)"',
  'INV-03 | manual prose | Subsystem: X | Verify: code read of the thing',
  'INV-04 | annotated pass | Subsystem: X | Verify: node -e "process.exit(0)" (smoke note)',
  ''].join('\n'));

function run(extra) {
  try { return { code: 0, out: execFileSync('node', [script, '--source', src, ...extra], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; }
  catch (e) { return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }; }
}

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

const r = run([]);
if (r.code === 1) ok('exits non-zero when a runnable invariant fails'); else bad(`expected exit 1, got ${r.code}`);
if (/INV-01 PASS/.test(r.out)) ok('runs a passing command Verify (INV-01 PASS)'); else bad('INV-01 not PASS');
if (/INV-02 FAIL/.test(r.out)) ok('marks a failing command FAIL (INV-02)'); else bad('INV-02 not FAIL');
if (/INV-04 PASS/.test(r.out)) ok('strips a trailing "(annotation)" before running (INV-04 PASS)'); else bad('INV-04 not PASS');
if (/INV-03 MANUAL/.test(r.out)) ok('classifies prose Verify as MANUAL (INV-03)'); else bad('INV-03 not MANUAL');
if (/Passed 2 \| Failed 1 \| Manual 1/.test(r.out)) ok('summary counts correct (2/1/1, identical commands deduped)'); else bad('summary counts wrong');

const l = run(['--list']);
if (l.code === 0 && /\[run\]/.test(l.out) && /\[manual\]/.test(l.out)) ok('--list enumerates runnable + manual and exits 0'); else bad('--list output wrong');

// F38 (Cycle 7): identical commands run ONCE. The summary above counts per
// invariant, so it reads 2/1/1 whether or not the command was deduplicated —
// a mutation removing the dedupe passed. Count actual executions instead: the
// shared command appends one line to a tally file each time it runs.
{
  const tally = join(dir, 'tally.txt');
  const cmd = `node -e "require('fs').appendFileSync(process.argv[1], 'x\\n')" ${JSON.stringify(tally)}`;
  const dsrc = join(dir, 'dedupe.md');
  writeFileSync(dsrc, [`INV-10 | shared a | Subsystem: X | Verify: ${cmd}`, `INV-11 | shared b | Subsystem: X | Verify: ${cmd}`, `INV-12 | shared c | Subsystem: X | Verify: ${cmd} (annotated)`, ''].join('\n'));
  let out = '', code = 0;
  try { out = execFileSync('node', [script, '--source', dsrc], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { code = e.status ?? 1; out = (e.stdout || '') + (e.stderr || ''); }
  let runs = 0; try { runs = readFileSync(tally, 'utf8').split('\n').filter(Boolean).length; } catch {}
  if (code === 0 && /Passed 3 \| Failed 0/.test(out) && runs === 1) ok('three invariants sharing one command (one annotated) run it ONCE and all PASS (F38)');
  else bad(`dedupe: command ran ${runs} time(s) for 3 invariants (exit ${code}) — identical commands must run once (F38)`);
}

// F42 (Cycle 7): Verify commands run in the --source PROJECT's root (the
// parent of .cycle/), not wherever the runner was started — and the runner
// prefix is a classifier, not a sandbox: the whole text goes to a shell. The
// second half pins the documented behaviour so the header can never again
// promise a restriction that does not exist.
{
  const proj = mkdtempSync(join(tmpdir(), 'cwt-inv-proj-'));
  mkdirSync(join(proj, '.cycle'));
  writeFileSync(join(proj, '.cycle', 'config.md'), [
    `INV-20 | runs in the project root | Subsystem: X | Verify: node -e "require('fs').writeFileSync('cwd-marker.txt', 'here')"`,
    `INV-21 | shell, not a sandbox | Subsystem: X | Verify: node -e 0; node -e "require('fs').writeFileSync('chained.txt', 'ran')"`,
    ''].join('\n'));
  let out = '';
  try { out = execFileSync('node', [script, '--source', join(proj, '.cycle', 'config.md')], { cwd: tmpdir(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  if (existsSync(join(proj, 'cwd-marker.txt')) && !existsSync(join(proj, '.cycle', 'cwd-marker.txt'))) ok('Verify commands run in the --source project root, not the caller\'s directory (F42)');
  else bad('Verify command did not run in the project root (F42)');
  if (existsSync(join(proj, 'chained.txt')) && /INV-21 PASS/.test(out)) ok('a chained command after a runner prefix runs too — documented: the library is code (F42)');
  else bad('chained-command behaviour changed — update the invariant-check header and CLAUDE.md to match (F42)');
  rmSync(proj, { recursive: true, force: true });
}
{
  const header = readFileSync(script, 'utf8').split('\nimport ')[0];
  if (/handed to a SHELL/.test(header) && /library is CODE/.test(header) && !/only commands beginning with a known runner\s*\/\/?\s*\(?[^)]*\)?\s*are executed/.test(header)) ok('the header states the shell/code-execution model, not a runner whitelist (F42)');
  else bad('invariant-check header no longer states that Verify text runs through a shell (F42)');
}

// F35 (Cycle 7): a CRLF library (Windows / core.autocrlf) and an indented rule
// must parse — `.` does not match \r, so every CRLF line used to be dropped.
const crlf = join(dir, 'crlf.md');
writeFileSync(crlf, ['INV-01 | crlf pass | Subsystem: X | Verify: node -e "process.exit(0)"', ' INV-02 | indented fail | Subsystem: X | Verify: node -e "process.exit(1)"', ''].join('\r\n'));
const rc = (() => { try { return { code: 0, out: execFileSync('node', [script, '--source', crlf], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }; } })();
if (rc.code === 1 && /INV-01 PASS/.test(rc.out) && /INV-02 FAIL/.test(rc.out)) ok('parses a CRLF library and an indented rule (F35)'); else bad(`CRLF/indented library mis-parsed (exit ${rc.code}): ${rc.out.slice(0, 120)}`);

// F41: a PASSING command with >1MB of output is still PASS, and a hung command
// is killed and reported as a timeout rather than hanging the probe.
const big = join(dir, 'big.md');
writeFileSync(big, ['INV-01 | loud pass | Subsystem: X | Verify: node -e "process.stdout.write(\'x\'.repeat(3e6))"', 'INV-02 | hangs | Subsystem: X | Verify: node -e "setTimeout(()=>{},60000)"', ''].join('\n'));
const rb = (() => { try { return { code: 0, out: execFileSync('node', [script, '--source', big, '--timeout', '2'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }) }; } catch (e) { return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }; } })();
if (/INV-01 PASS/.test(rb.out)) ok('a passing command with >1MB of output is PASS, not an ENOBUFS FAIL (F41)'); else bad('a loud passing command was reported FAIL (maxBuffer)');
if (/INV-02 FAIL[^\n]*timed out after 2s/.test(rb.out)) ok('a hung Verify command is killed and reported as a timeout (F41)'); else bad('a hung command was not reported as a timeout');
// A FAILING command with a huge last line: the reason is capped to one readable
// line, and the results after it — and the summary — are not cut off.
const loud = join(dir, 'loud.md');
writeFileSync(loud, ['INV-01 | loud fail | Subsystem: X | Verify: node -e "process.stdout.write(\'x\'.repeat(3e6));process.exit(1)"', 'INV-02 | quiet pass | Subsystem: X | Verify: node -e "process.exit(0)"', ''].join('\n'));
const rl = (() => { try { return { code: 0, out: execFileSync('node', [script, '--source', loud], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }) }; } catch (e) { return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }; } })();
const longest = Math.max(...rl.out.split('\n').map(l => l.length));
if (rl.code === 1 && /INV-02 PASS/.test(rl.out) && /Passed 1 \| Failed 1/.test(rl.out) && longest < 1000) ok('a loud failure is reported in one capped line and the later results + summary survive (F41)');
else bad(`loud failure output wrong (exit ${rl.code}, longest line ${longest}, summary ${/Passed 1 \| Failed 1/.test(rl.out)})`);

// F33 (Cycle 7): every script with a main-module check must still RUN when
// invoked through a symlinked directory — it used to do nothing and exit 0.
{
  const repo = fileURLToPath(new URL('..', import.meta.url));
  const link = join(dir, 'tools');
  symlinkSync(join(repo, 'scripts'), link, 'dir');
  const fail = join(dir, 'fail.md');
  writeFileSync(fail, 'INV-01 | always fails | Subsystem: X | Verify: node -e "process.exit(1)"\n');
  const via = (name, args, cwd) => { try { return { code: 0, out: execFileSync('node', [join(link, name), ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }; } };
  const problems = [];
  const ic = via('invariant-check.mjs', ['--source', fail], dir);
  if (ic.code !== 1 || !/INV-01 FAIL/.test(ic.out)) problems.push(`invariant-check via symlink: exit ${ic.code}, output ${JSON.stringify(ic.out.slice(0, 60))}`);
  const ob = via('check-output-blocks.mjs', [], repo);
  if (!ob.out.trim()) problems.push('check-output-blocks via symlink printed nothing');
  const gp = via('gen-html-prompts.mjs', [], repo);
  if (!gp.out.trim()) problems.push('gen-html-prompts via symlink printed nothing');
  const vp = via('verification-pack.mjs', ['--cycle', '1', '--seed', 's'], repo);
  if (!/CYCLE UNDER VERIFICATION/.test(vp.out)) problems.push('verification-pack via symlink printed no pack');
  if (!problems.length) ok('all four main-checked scripts run when invoked through a symlinked scripts/ directory (F33)');
  else bad('F33: ' + problems.join('; '));
}

rmSync(dir, { recursive: true, force: true });

console.log('invariant runner regression test (scripts/invariant-check.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} invariant-runner test(s) failed.`); process.exit(1); }
console.log('\nInvariant runner is sound. ✓');
