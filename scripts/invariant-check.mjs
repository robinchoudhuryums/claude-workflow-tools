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
//   node scripts/invariant-check.mjs [--source FILE] [--list]
//   Default source: .cycle/config.md, else CLAUDE.md.
// Exit 0 if no runnable invariant FAILED; 1 if any FAILED.
//
// Safety: only commands beginning with a known runner (node/npm/npx/…/./)
// are executed; this is meant to run inside the project's own trusted repo,
// exactly as a test command would.

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const srcIdx = args.indexOf('--source');
const source = srcIdx !== -1 ? args[srcIdx + 1] : (existsSync('.cycle/config.md') ? '.cycle/config.md' : 'CLAUDE.md');
const listOnly = args.includes('--list');

let text;
try { text = readFileSync(source, 'utf8'); }
catch { console.error(`No invariant source at ${source}`); process.exit(1); }

// Parse lines of the form:  INV-XX | rule | Subsystem: … | Verify: …
const invs = [];
for (const line of text.split('\n')) {
  const m = line.match(/^(INV-\d+)\s*\|(.+)$/);
  if (!m) continue;
  const parts = m[2].split('|').map(s => s.trim());
  let verify = '';
  for (const p of parts.slice(1)) { const v = p.match(/^Verify:\s*(.+)$/i); if (v) verify = v[1].trim(); }
  invs.push({ id: m[1], rule: parts[0] || '', verify });
}
if (!invs.length) { console.error(`No invariants found in ${source}`); process.exit(1); }

const RUNNER = /^(node|npm|npx|pnpm|yarn|bash|sh|python3?|pytest|jest|vitest|make|\.\/)\b/;
function toCommand(verify) {
  if (!verify) return null;
  // The command is the text up to the first annotation separator: " (", " + ", " then ".
  const cmd = verify.split(/\s+\(|\s+\+\s+|\s+then\s+/i)[0].trim();
  return RUNNER.test(cmd) ? cmd : null;
}

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
  let ok = true, err = '';
  try { execSync(cmd, { stdio: 'pipe' }); }
  catch (e) { ok = false; err = ((e.stderr?.toString() || e.stdout?.toString() || e.message || '').trim().split('\n').pop()) || 'command failed'; }
  for (const inv of list) { results.push({ inv, ok, cmd, err }); ok ? passed++ : failed++; }
}

console.log(`Invariant probe — source: ${source}\n`);
for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${r.inv.id} ${r.ok ? 'PASS' : 'FAIL'} via \`${r.cmd}\`${r.ok ? '' : '  — ' + r.err}`);
for (const inv of manual) console.log(`  • ${inv.id} MANUAL (Verify: ${inv.verify || '—'})`);
console.log(`\nProbed ${passed + failed} runnable | Passed ${passed} | Failed ${failed} | Manual ${manual.length}`);
process.exit(failed ? 1 : 0);
