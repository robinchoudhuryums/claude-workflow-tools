#!/usr/bin/env node
// cycle-context.mjs — SessionStart hook (ROADMAP R6).
//
// Prints the workflow "substrate" (per CLAUDE.md "Cycle State & Memory":
// the things safe to carry forward — STATE, invariants, current standing)
// so a fresh Claude Code session starts oriented without manual pasting.
// Wire it via .claude/settings.json:
//   { "hooks": { "SessionStart": [ { "hooks": [
//       { "type": "command", "command": "node \"${CLAUDE_PROJECT_DIR:-.}/scripts/cycle-context.mjs\"" } ] } ] } }
//
// F11 (Cycle 8): rooted at the PROJECT directory. Claude Code gives a hook
// CLAUDE_PROJECT_DIR; the command above and `root` below both use it and fall
// back to the working directory. A hook runs in the session's CURRENT directory,
// which moves when the session changes directory; with a bare relative path in
// the command and process.cwd() here, a hook fired from a subdirectory could
// not find this script, and would have looked for .cycle/ in the wrong place.
//
// Fully additive and fail-safe: with no .cycle/ it prints nothing; it
// never throws and always exits 0, so it can't break a session.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const read = p => { try { return readFileSync(p, 'utf8'); } catch { return null; } };

// Extract the body of a "## <heading>" section from a markdown doc.
function section(md, heading) {
  if (!md) return null;
  const lines = md.split('\n');
  const h = heading.toLowerCase();
  const i = lines.findIndex(l => /^##\s+/.test(l) && l.replace(/^##\s+/, '').trim().toLowerCase().startsWith(h));
  if (i === -1) return null;
  const body = [];
  for (let j = i + 1; j < lines.length; j++) { if (/^##\s+/.test(lines[j])) break; body.push(lines[j]); }
  return body.join('\n').trim();
}

try {
  if (!existsSync(join(root, '.cycle'))) process.exit(0); // not adopted — stay quiet

  // v1.53.0: FACTS ONLY. The hook loads into every session — a verification
  // session too — so it carries what is objectively so (the cycle, its phase,
  // the score line) and not the implementer's narrative (Where I left off,
  // Pending, the standing's prose), which anchored a §4v session on the
  // implementer's own account of the work. Commands that need those read
  // STATE.md themselves; /cycle-status shows them on request.
  const out = ['=== WORKFLOW CONTEXT (auto-loaded by SessionStart hook — facts only) ==='];
  const state = read(join(root, '.cycle', 'STATE.md'));
  const current = section(state, 'Current');
  if (current) out.push(`\n## Current\n${current}`);
  const standing = section(read(join(root, 'PROJECT_HEALTH.md')), 'Current Standing');
  if (standing) {
    // The score line only: each field up to its first " — " (a priority's name and
    // score, not the paragraph that argues for it). The summary and live-status
    // prose are the synthesis's judgment, not a fact a new session should start from.
    const FIELDS = ['Last synthesis:', 'Overall (weighted avg):', 'Top vertical priority:', 'Top horizontal priority:'];
    const lines = standing.split('\n').filter(l => FIELDS.some(f => l.startsWith(f))).map(l => l.split(' — ')[0]);
    if (lines.length) out.push(`\n## Current Standing (PROJECT_HEALTH.md, score line only)\n${lines.join('\n')}`);
  }

  const hasCfg = existsSync(join(root, '.cycle', 'config.md'));
  const cfg = (hasCfg && read(join(root, '.cycle', 'config.md'))) || read(join(root, 'CLAUDE.md'));
  // F35 (Cycle 7): tolerate leading whitespace, matching the INV-68 floor's
  // ground truth, so the hook counts what invariant-check and the pack parse.
  const invCount = cfg ? (cfg.match(/^[ \t]*INV-\d+\s*\|/gm) || []).length : 0;
  if (invCount) out.push(`\nInvariant library: ${invCount} invariants (see ${hasCfg ? '.cycle/config.md' : 'CLAUDE.md'}). Carry these forward; re-derive audit findings with fresh eyes.`);

  out.push('\nThese are facts, not the implementer\'s notes: what was done, what is pending and where the last session left off are in .cycle/STATE.md — run /cycle-status to see them, /cycle-resume to continue. A new audit or a verification starts with fresh eyes.');
  out.push('=== END WORKFLOW CONTEXT ===');
  process.stdout.write(out.join('\n') + '\n');
} catch {
  // Never break a session over context loading.
}
process.exit(0);
