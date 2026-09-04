#!/usr/bin/env node
// check-output-blocks.mjs (R13 — prompt-output regression harness)
//
// Extends the sync guard from STRUCTURE to OUTPUT SHAPE. The cycle's value
// is its structured handoff/summary blocks: /audit must emit a well-formed
// SESSION HANDOFF BLOCK that /plan can consume, and so on down the chain.
// If a command's template silently drops a field, breaks a delimiter, or
// stops emitting its block, the chain breaks — and nothing else catches it
// (check-template-sync only verifies a block's NAME appears, not its shape).
//
// This harness statically validates, against CLAUDE.md (canonical) and the
// generated .claude/commands/ files:
//   1. every output block has a balanced open / close delimiter pair
//   2. each block's producing command actually EMITS it (the behavioral
//      assertion — "does /audit still produce a SESSION HANDOFF BLOCK?")
//   3. every occurrence of a block carries all its required fields (shape)
//   4. blocks defined BOTH in a command body and in the Handoff Block
//      Formats reference agree on their field set (no inline-vs-reference
//      field drift)
//   5. no unregistered ---NAME--- block delimiter has crept in unguarded
//
// This is the static, deterministic half of R13 and the part that belongs
// in a CI gate. Running the prompts through an LLM against fixture repos to
// capture REAL output is non-deterministic and needs a runtime — that is a
// separate, non-CI layer (the same runtime boundary that gates R11), not a
// regression test.
//
// Usage:  node scripts/check-output-blocks.mjs
// Exit 0 = all blocks shape-valid, exit 1 = drift detected.
// Importable: exports BLOCKS, findSpans, validate (for the regression test).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// One entry per output block the workflow defines.
//   open / close — exact delimiter lines. close is intentionally asymmetric
//                  for SESSION HANDOFF BLOCK (closes "---END HANDOFF BLOCK---").
//   producer     — the .claude/commands/ file that emits it, or null for a
//                  block produced by a non-command section (Verification Pass).
//   inFormats    — also defined in the "Handoff Block Formats" reference,
//                  so the producer copy + reference copy must both exist.
//   fields       — labels that MUST appear (substring) inside every span.
export const BLOCKS = [
  { name: 'SESSION HANDOFF BLOCK', open: '---SESSION HANDOFF BLOCK---', close: '---END HANDOFF BLOCK---',
    producer: 'audit', inFormats: true,
    fields: ['Scope:', 'Files covered:', 'Audit confidence:', 'FINDINGS:',
      'CROSS-MODULE DEPENDENCIES SURFACED:', 'OPERATOR ACTIONS SURFACED',
      'TOP PRIORITIES:', 'RECOMMENDED PLANNING STARTING POINT:'] },
  { name: 'IMPLEMENTATION HANDOFF BLOCK', open: '---IMPLEMENTATION HANDOFF BLOCK---', close: '---END IMPLEMENTATION HANDOFF BLOCK---',
    producer: 'plan', inFormats: false,
    fields: ['Scope:', 'Systems map reference:', 'ACTIONS TO IMPLEMENT:',
      'HIGH/VERY HIGH RISK ACTIONS', 'POLICY RESPONSE ACTIONS', 'OPERATOR ACTIONS',
      'IMPLEMENT IN THIS ORDER:', 'ORDERING RATIONALE:'] },
  { name: 'IMPLEMENTATION SUMMARY BLOCK', open: '---IMPLEMENTATION SUMMARY BLOCK---', close: '---END IMPLEMENTATION SUMMARY BLOCK---',
    producer: 'implement', inFormats: false,
    fields: ['Session scope:', 'Actions completed:', 'CHANGES MADE:', 'TEST RESULTS:',
      'UNEXPECTED FINDINGS DURING IMPLEMENTATION:', 'OPERATOR ACTIONS / DEPLOY:',
      'FOLLOW-ON ITEMS:', 'DOCUMENTATION UPDATES NEEDED:'] },
  { name: 'TIER 2 HANDOFF BLOCK', open: '---TIER 2 HANDOFF BLOCK---', close: '---END TIER 2 HANDOFF BLOCK---',
    producer: 'targeted-audit', inFormats: true,
    fields: ['Scope:', 'Findings:', 'ACTIONS (implement in this order)', 'CROSS-MODULE RISKS:',
      'OPERATOR ACTIONS SURFACED', 'DO NOT TOUCH:'] },
  { name: 'BROAD SCAN IMPLEMENTATION SUMMARY', open: '---BROAD SCAN IMPLEMENTATION SUMMARY---', close: '---END BROAD SCAN IMPLEMENTATION SUMMARY---',
    producer: 'broad-implement', inFormats: false,
    fields: ['Findings implemented:', 'Files modified:', 'CHANGES:', 'TEST RESULTS:',
      'REGRESSION RISKS:', 'INVARIANTS AT RISK:', 'NET SCORE:', 'OPERATOR ACTIONS / DEPLOY:',
      'FOLLOW-ON ITEMS:', 'DOCUMENTATION UPDATES NEEDED:'] },
  { name: 'TARGETED IMPLEMENTATION SUMMARY', open: '---TARGETED IMPLEMENTATION SUMMARY---', close: '---END TARGETED IMPLEMENTATION SUMMARY---',
    producer: 'targeted-implement', inFormats: false,
    fields: ['Scope:', 'Actions completed:', 'Actions not completed:', 'Files modified:',
      'CHANGES:', 'TEST RESULTS:', 'REGRESSION RISKS:', 'INVARIANTS AT RISK:', 'NET SCORE:',
      'INVARIANT CANDIDATES:', 'OPERATOR ACTIONS / DEPLOY:', 'FOLLOW-ON ITEMS:',
      'DOCUMENTATION UPDATES NEEDED:'] },
  { name: 'CYCLE SUMMARY BLOCK', open: '---CYCLE SUMMARY BLOCK---', close: '---END CYCLE SUMMARY BLOCK---',
    producer: 'reflect', inFormats: false,
    fields: ['Scope:', 'Production fixes:', 'New capabilities/features:', 'Defensive/structural:',
      'New failure modes:', 'Net score:', 'Invariant candidates:',
      'Most structurally significant change:', 'Should-have-been-deferred:'] },
  { name: 'FOLLOW-ON AUDIT ITEMS', open: '---FOLLOW-ON AUDIT ITEMS---', close: '---END FOLLOW-ON AUDIT ITEMS---',
    producer: 'regression', inFormats: false,
    fields: [] }, // free-form list — only the delimiter + producer emission matter
  { name: 'PR REVIEW BLOCK', open: '---PR REVIEW BLOCK---', close: '---END PR REVIEW BLOCK---',
    producer: 'pr-review', inFormats: true,
    fields: ['PR:', 'Files reviewed:', 'Review confidence:', 'VERDICT:', 'One line:',
      'FINDINGS:', 'REGRESSIONS', 'INVARIANTS AT RISK:', 'TEST COVERAGE GAPS',
      'BLOCKING ITEMS', 'NITS'] },
  { name: 'POLICY RESPONSE', open: '---POLICY RESPONSE TRIGGERED---', close: '---END POLICY RESPONSE---',
    producer: null, inFormats: true, // emitted by §6a Health Synthesis when an Axis B category triggers; homed in Handoff Block Formats
    fields: ['Category:', 'Trigger clause:', 'Consecutive poor cycles:', 'Current score:', 'Root pattern:', 'Prescribed policy fix', 'Scope addition:'] },
  { name: 'SEAMS & INVARIANTS AUDIT BLOCK', open: '---SEAMS & INVARIANTS AUDIT BLOCK---', close: '---END SEAMS & INVARIANTS AUDIT BLOCK---',
    producer: null, inFormats: true, // produced by the §1s Seams audit cycle-type (not a slash command); homed in Handoff Block Formats
    fields: ['Audit date:', 'SEAM INVENTORY:', 'INVARIANT LIBRARY UPDATE:', 'Proposed additions:', 'Proposed retirements:', 'HORIZONTAL OBSERVATIONS', 'RECOMMENDED FOCUS FOR NEXT SUBSYSTEM CYCLE:'] },
  { name: 'VERIFICATION BLOCK', open: '---VERIFICATION BLOCK---', close: '---END VERIFICATION BLOCK---',
    producer: null, inFormats: true, // produced by the Verification Pass section, not a slash command
    fields: ['Verified scope:', 'Verification date:', 'INVARIANT PROBE RESULTS:',
      'REGRESSION COUNT:', 'Regressions found:', 'Net score:', 'CYCLE EXECUTION QUALITY:',
      'Tests run to completion:', 'COVERAGE GAP REPORT:', 'Category D ratio:'] },
];

// Return every open..close span (inclusive body) for a delimiter pair, in order.
export function findSpans(text, open, close) {
  const lines = text.split('\n');
  const spans = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== open) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== close) j++;
    if (j < lines.length) { spans.push({ openLine: i, closeLine: j, body: lines.slice(i, j + 1).join('\n') }); i = j; }
  }
  return spans;
}

// Validate the registry against CLAUDE.md + a command-file loader.
// loadCmd(name) returns the command file text, or null if absent.
export function validate(claudeMd, loadCmd) {
  const failures = [];
  const lines = claudeMd.split('\n');
  const opensReg = new Set(BLOCKS.map(b => b.open));
  const closesReg = new Set(BLOCKS.map(b => b.close));

  // Check 5: catch any block delimiter that isn't in the registry.
  for (const ln of lines) {
    const t = ln.trim();
    if (!/^---[A-Z].*---$/.test(t)) continue;
    if (t.startsWith('---END')) {
      if (!closesReg.has(t)) failures.push(`Unregistered block CLOSE delimiter "${t}" — add it to BLOCKS in check-output-blocks.mjs`);
    } else if (!opensReg.has(t)) {
      failures.push(`Unregistered block OPEN delimiter "${t}" — add it to BLOCKS in check-output-blocks.mjs`);
    }
  }

  for (const b of BLOCKS) {
    const opens = lines.filter(l => l.trim() === b.open).length;
    const closes = lines.filter(l => l.trim() === b.close).length;
    if (opens === 0) { failures.push(`${b.name}: open delimiter "${b.open}" not found in CLAUDE.md`); continue; }
    if (opens !== closes) failures.push(`${b.name}: unbalanced delimiters — ${opens} open vs ${closes} close ("${b.close}")`);

    const spans = findSpans(claudeMd, b.open, b.close);
    if (!spans.length) { failures.push(`${b.name}: no well-formed open..close span (delimiter typo?)`); continue; }

    // Field completeness across EVERY occurrence (command body + reference) —
    // this is what catches inline-vs-reference field drift.
    spans.forEach((s, idx) => {
      const missing = b.fields.filter(f => !s.body.includes(f));
      if (missing.length) failures.push(`${b.name} (CLAUDE.md occurrence ${idx + 1} of ${spans.length}): missing field(s): ${missing.join(', ')}`);
    });

    // A block that is both produced by a command and listed in Formats must
    // appear at least twice (the command copy AND the reference copy).
    if (b.inFormats && b.producer && spans.length < 2) {
      failures.push(`${b.name}: declared in Handoff Block Formats + produced by /${b.producer} but found only ${spans.length} occurrence — the reference copy or the command copy is missing`);
    }

    // Behavioral assertion: the producing command file actually emits the block.
    if (b.producer) {
      const cmd = loadCmd(b.producer);
      if (cmd == null) failures.push(`${b.name}: producer command file ${b.producer}.md not found`);
      else if (!cmd.includes(b.open)) failures.push(`${b.name}: /${b.producer} no longer emits the block ("${b.open}" absent from ${b.producer}.md)`);
    }
  }
  return failures;
}

// INV-55 — the console renders these same blocks, in static <pre> displays and
// in builder template literals, and NOTHING checked their shape: dropping
// `Net score:` from the console's VERIFICATION BLOCK, or renaming its END
// delimiter, passed every stage (Cycle-5 §4v). check-template-sync only asks
// whether the block's NAME appears. A block that IS rendered must be well
// formed; a block the console doesn't render is not an error here (that is
// check-template-sync's derived presence check, not this one).
export function validateHtml(htmlText) {
  const failures = [];
  const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  // The console carries these blocks in two containers, and BOTH put syntax on
  // the delimiter line: a builder ends its template literal as "---END X---`;",
  // and a static display ends as "---END X---</pre>". Strip the container
  // punctuation before comparing, or every block in the file reads as
  // unbalanced — a defect in the checker, not in the console. (First run of
  // this check reported 5 such false positives; they were all this.)
  const strip = l => l.trim()
    .replace(/^<pre\b[^>]*>/, '')      // static display opens on the delimiter line
    .replace(/^`/, '')                 // builder opens its template literal there
    .replace(/<\/pre>\s*$/, '')        // …and closes it there too
    .replace(/`\s*;?\s*$/, '')
    .trim();
  const text = unesc(htmlText).split('\n').map(strip).join('\n');
  for (const b of BLOCKS) {
    const opens = text.split('\n').filter(l => l === b.open).length;
    if (!opens) continue;                                  // not rendered in the console — fine
    const closes = text.split('\n').filter(l => l === b.close).length;
    if (opens !== closes) { failures.push(`${b.name}: console has ${opens} open vs ${closes} close ("${b.close}")`); continue; }
    const spans = findSpans(text, b.open, b.close);
    if (!spans.length) { failures.push(`${b.name}: console has the open delimiter but no well-formed span`); continue; }
    spans.forEach((s, i) => {
      const missing = b.fields.filter(f => !s.body.includes(f));
      if (missing.length) failures.push(`${b.name} (console occurrence ${i + 1} of ${spans.length}): missing field(s): ${missing.join(', ')}`);
    });
  }
  return failures;
}

function main() {
  const root = new URL('..', import.meta.url);
  const claudeMd = readFileSync(new URL('CLAUDE.md', root), 'utf8');
  const loadCmd = name => { try { return readFileSync(new URL(`.claude/commands/${name}.md`, root), 'utf8'); } catch { return null; } };
  const failures = validate(claudeMd, loadCmd);
  let htmlBlocks = 0;
  try {
    const htmlText = readFileSync(new URL('claude-code-guide-v2.html', root), 'utf8');
    htmlBlocks = BLOCKS.filter(b => htmlText.includes(b.open)).length;
    failures.push(...validateHtml(htmlText));
  } catch (e) { failures.push('could not read the console for block-shape validation: ' + e.message); }

  console.log('Output-block shape check (R13 — CLAUDE.md ↔ .claude/commands/):\n');
  if (!failures.length) {
    console.log(`  ✓ ${BLOCKS.length} output blocks well-formed in CLAUDE.md + .claude/commands/ (delimiters balanced, required fields present, producers emit them)`);
    console.log(`  ✓ ${htmlBlocks} of them are also rendered by the console, and are shape-valid there too (INV-55)`);
    console.log('\nAll prompt-output blocks are shape-valid. ✓');
    return 0;
  }
  for (const f of failures) console.log('  ✗ ' + f);
  console.error(`\n${failures.length} output-block issue(s) detected.`);
  console.error('Fix the template, regenerate command files (node scripts/gen-commands.mjs),');
  console.error('or update BLOCKS in scripts/check-output-blocks.mjs if a field/delimiter changed on purpose.');
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main());
}
