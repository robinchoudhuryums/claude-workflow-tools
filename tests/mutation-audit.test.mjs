#!/usr/bin/env node
// mutation-audit.test.mjs — the guard on the guard.
//
// tests/mutation-audit.mjs is the thing that decides whether every OTHER check
// in this repo actually fails when its rule is violated. If it silently stops
// detecting, every invariant reads "proven" forever and nothing else notices —
// exactly the failure the scratchpad version shipped with (a case whose find
// string had rotted printed a neutral "?" and still counted toward "0 false
// greens"). So the audit gets the same treatment it gives everything else:
// break it three ways and require each to fail closed.
//
// The audit itself cannot verify this. Its own Verify field points here, which
// also keeps it out of its own coverage set — an invariant verified BY the
// mutation audit whose mutation case RUNS the mutation audit would recurse.
//
// Usage: node tests/mutation-audit.test.mjs   (exit 0 = fails closed on all 3)

import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const AUDIT = 'tests/mutation-audit.mjs';

let failures = 0;
const log = [];
const ok = m => log.push('  ✓ ' + m);
const bad = m => { failures++; log.push('  ✗ ' + m); };

function withMutatedAudit(edit, only) {
  const dir = mkdtempSync(join(tmpdir(), 'mut-meta-'));
  try {
    cpSync(REPO, dir, { recursive: true, filter: s => !s.includes('/.git/') && !s.endsWith('/.git') });
    const p = join(dir, AUDIT);
    const before = readFileSync(p, 'utf8');
    const after = edit(before);
    if (after === before) return { code: -1, out: 'mutation did not apply — the test fixture is stale' };
    writeFileSync(p, after);
    try {
      const out = execFileSync('node', [p, '--only', only], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return { code: 0, out };
    } catch (e) { return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }; }
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const expectFail = (label, edit, only, signal) => {
  const r = withMutatedAudit(edit, only);
  if (r.code > 0 && signal.test(r.out)) ok(label);
  else bad(`${label} — audit did not fail as expected (code ${r.code}): ${r.out.slice(-220)}`);
};

// 1) Coverage is DERIVED from the live library: deleting a case must fail, not
//    quietly shrink the proven set. This is the property that stops the audit
//    from drifting behind the library as invariants are added.
expectFail('a runnable invariant with no mutation case fails the audit',
  s => s.replace(/^ {2}'INV-21': .*\n/m, ''),
  'INV-04',
  /no mutation case/i);

// 2) A case whose find string has rotted away must fail. The scratchpad version
//    scored this as a neutral "?" — a mutation that cannot be applied tests
//    nothing, so counting it as anything but a failure is a false green.
expectFail('a stale mutation (find string gone) fails the audit',
  s => s.replace("'function storageWarn(e){',", "'function storageWarn_NO_SUCH_FN(e){',"),
  'INV-21',
  /NO-TARGET/);

// 3) The per-invariant signal must be load-bearing. Twenty invariants share
//    check-html.mjs; if the audit accepted any non-zero exit, a mutation that
//    tripped a DIFFERENT invariant's assertion would read as proof for this one.
expectFail('a mutation caught by some other invariant’s assertion fails the audit',
  s => s.replace("'function storageWarn(e){ return;', /storageWarn/i", "'function storageWarn(e){ return;', /parseHealth did not/i"),
  'INV-21',
  /WRONG CHECK/);

console.log('Mutation-audit regression test (tests/mutation-audit.mjs):\n');
console.log(log.join('\n'));
if (failures) { console.error(`\n${failures} case(s) failed — the mutation audit does not fail closed.`); process.exit(1); }
console.log('\nThe mutation audit fails closed on lost coverage, stale cases, and wrong-check credit. ✓');
