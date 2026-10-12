#!/usr/bin/env node
// invariant-check.mjs — executable invariant runner (ROADMAP R9).
//
// Reads the invariant library and runs each invariant whose `Verify:` field
// is a runnable command, reporting PASS / FAIL; `Verify:` fields that are
// test-name references or "code read" prose are reported MANUAL. This
// generalises the `Verify:` convention into a runner so an invariant is
// declared once and becomes executable — the automated half of the §4v
// invariant probe.
//
// Usage:
//   node scripts/invariant-check.mjs [--source FILE] [--list] [--timeout SECONDS]
//   Default source: .cycle/config.md, else CLAUDE.md.
// Exit 0 if no runnable invariant FAILED; 1 if any FAILED.
//
// Safety: only commands beginning with a known runner (node/npm/npx/…/./)
// are executed; this is meant to run inside the project's own trusted repo,
// exactly as a test command would.
//
// The parse is EXPORTED because tests/mutation-audit.mjs derives its coverage
// set from the same library. A second copy of the parse would be a parallel
// source of truth in the one place that can least afford it — the audit that
// decides whether these Verify commands actually work.

import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Parse `INV-XX | rule | Subsystem: … | Verify: …` lines out of a library. */
// F35 (Cycle 7): split on CRLF as well as LF and tolerate leading whitespace.
// `.` does not match `\r`, so on a CRLF file (Windows, core.autocrlf=true) EVERY
// line failed the match and this reported "No invariants found", while the
// hook counted one number and the §4v pack another — three readers, three
// counts. The INV-68 floor's ground truth (`^[ \t]*INV-\d+\s*\|`) is what this
// now agrees with.
export function parseInvariants(text) {
  const invs = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(/^(INV-\d+)\s*\|(.+)$/);
    if (!m) continue;
    const parts = m[2].split('|').map(s => s.trim());
    let verify = '';
    for (const p of parts.slice(1)) { const v = p.match(/^Verify:\s*(.+)$/i); if (v) verify = v[1].trim(); }
    invs.push({ id: m[1], rule: parts[0] || '', verify });
  }
  return invs;
}

const RUNNER = /^(node|npm|npx|pnpm|yarn|bash|sh|python3?|pytest|jest|vitest|make|\.\/)\b/;

/** The runnable command in a Verify field, or null when it is prose. */
export function toCommand(verify) {
  if (!verify) return null;
  // The command is the text up to the first annotation separator: " (", " + ", " then ".
  const cmd = verify.split(/\s+\(|\s+\+\s+|\s+then\s+/i)[0].trim();
  return RUNNER.test(cmd) ? cmd : null;
}

/** Default library location for a project: .cycle/config.md, else CLAUDE.md. */
export function defaultSource(dir = '.') {
  return existsSync(`${dir}/.cycle/config.md`) ? `${dir}/.cycle/config.md` : `${dir}/CLAUDE.md`;
}

// Importing this module must have no CLI side effects (the same rule INV-28
// pins for the R14 engine) — mutation-audit imports it from inside every
// mutated repo copy.
// F33 (Cycle 7): compare REAL paths. Node resolves symlinks for import.meta.url
// but leaves process.argv[1] as typed, so run through a symlinked scripts/
// directory the check was false and the script did NOTHING and exited 0 —
// a guard that passes silently.
function isMain() { try { return !!process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } }
if (isMain()) main();

function main() {
  const args = process.argv.slice(2);
  const srcIdx = args.indexOf('--source');
  const source = srcIdx !== -1 ? args[srcIdx + 1] : defaultSource();
  const listOnly = args.includes('--list');
  // F41: a Verify command is killed after this many seconds (default 30 min —
  // generous, because a full mutation audit is a legitimate Verify command).
  const toIdx = args.indexOf('--timeout');
  const timeoutSec = toIdx !== -1 ? Math.max(1, parseInt(args[toIdx + 1], 10) || 0) : 1800;

  let text;
  try { text = readFileSync(source, 'utf8'); }
  catch { console.error(`No invariant source at ${source}`); process.exit(1); }

  const invs = parseInvariants(text);
  if (!invs.length) { console.error(`No invariants found in ${source}`); process.exit(1); }

  // Group invariants by runnable command (dedupe identical commands).
  const byCmd = new Map();
  const manual = [];
  for (const inv of invs) {
    const cmd = toCommand(inv.verify);
    if (cmd) { if (!byCmd.has(cmd)) byCmd.set(cmd, []); byCmd.get(cmd).push(inv); }
    else manual.push(inv);
  }

  if (listOnly) {
    console.log(`Invariant library: ${invs.length} total — ${byCmd.size} runnable command(s), ${manual.length} manual\n`);
    for (const [cmd, list] of byCmd) console.log(`  [run]    ${cmd}  →  ${list.map(i => i.id).join(', ')}`);
    for (const inv of manual) console.log(`  [manual] ${inv.id}  (Verify: ${inv.verify || '—'})`);
    process.exit(0);
  }

  let passed = 0, failed = 0;
  const results = [];
  for (const [cmd, list] of byCmd) {
    let okRun = true, err = '';
    // F41: the default 1MB maxBuffer turned a PASSING command with a lot of
    // output into a FAIL (ENOBUFS), and with no timeout a hung command hung the
    // whole probe. Output is only kept for the failure line, so the buffer is
    // large rather than exact.
    try { execSync(cmd, { stdio: 'pipe', maxBuffer: 256 * 1024 * 1024, timeout: timeoutSec * 1000 }); }
    catch (e) {
      okRun = false;
      err = (e.signal === 'SIGTERM' && e.code !== 'ENOBUFS' && e.status == null)
        ? `timed out after ${timeoutSec}s (raise it with --timeout SECONDS)`
        : ((e.stderr?.toString() || e.stdout?.toString() || e.message || '').trim().split('\n').pop()) || 'command failed';
      // The reason is ONE line for a human: a command whose last output line is
      // megabytes long used to be echoed whole (F41).
      if (err.length > 300) err = err.slice(0, 300) + ' …';
    }
    for (const inv of list) { results.push({ inv, ok: okRun, cmd, err }); okRun ? passed++ : failed++; }
  }

  console.log(`Invariant probe — source: ${source}\n`);
  for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${r.inv.id} ${r.ok ? 'PASS' : 'FAIL'} via \`${r.cmd}\`${r.ok ? '' : '  — ' + r.err}`);
  for (const inv of manual) console.log(`  • ${inv.id} MANUAL (Verify: ${inv.verify || '—'})`);
  console.log(`\nProbed ${passed + failed} runnable | Passed ${passed} | Failed ${failed} | Manual ${manual.length}`);
  // exitCode, not exit(): process.exit() can cut off piped stdout that is still
  // being flushed, which dropped the later results AND this summary line (F41).
  process.exitCode = failed ? 1 : 0;
}
