#!/usr/bin/env node
// gen-commands.mjs
//
// Generates .claude/commands/<name>.md from the command templates in
// CLAUDE.md (the canonical source). Each command in CLAUDE.md is a
// `### /<name>` heading followed by a fenced ``` block containing the
// prompt body; this script extracts every such block and writes one file
// per command so consumers can copy the whole directory.
//
// Usage:
//   node scripts/gen-commands.mjs          # write/refresh the files
//   node scripts/gen-commands.mjs --check  # exit 1 if any file is stale,
//                                          # missing, or orphaned (for CI)

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const claudeMd = readFileSync(new URL('CLAUDE.md', root), 'utf8');

function extractCommands(md) {
  const lines = md.split('\n');
  const cmds = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^### (\/[a-z0-9-]+)\s*$/i);
    if (!m) continue;
    const name = m[1].slice(1); // strip leading '/'
    // The fenced body must open within the next few lines of the heading.
    let j = i + 1;
    while (j < lines.length && j <= i + 3 && lines[j].trim() !== '```') j++;
    if (j >= lines.length || lines[j].trim() !== '```') continue; // no body
    const body = [];
    j++;
    while (j < lines.length && lines[j].trim() !== '```') { body.push(lines[j]); j++; }
    cmds[name] = body.join('\n').replace(/\s+$/, '') + '\n';
  }
  return cmds;
}

const cmds = extractCommands(claudeMd);
const names = Object.keys(cmds).sort();
if (!names.length) { console.error('No command templates found in CLAUDE.md'); process.exit(1); }

const dir = new URL('.claude/commands/', root);
const check = process.argv.includes('--check');

if (check) {
  const stale = [];
  for (const n of names) {
    let cur = null;
    try { cur = readFileSync(new URL(`${n}.md`, dir), 'utf8'); } catch (e) {}
    if (cur !== cmds[n]) stale.push(n);
  }
  let orphans = [];
  try {
    orphans = readdirSync(dir).filter(f => f.endsWith('.md') && !names.includes(f.slice(0, -3)));
  } catch (e) {}
  if (stale.length || orphans.length) {
    if (stale.length) console.error('Stale or missing command files: ' + stale.join(', '));
    if (orphans.length) console.error('Orphan command files not in CLAUDE.md: ' + orphans.join(', '));
    console.error('Run: node scripts/gen-commands.mjs');
    process.exit(1);
  }
  console.log(`.claude/commands/ is current (${names.length} commands).`);
  process.exit(0);
}

mkdirSync(dir, { recursive: true });
for (const n of names) writeFileSync(new URL(`${n}.md`, dir), cmds[n]);
console.log(`Generated ${names.length} command files into .claude/commands/:\n  ${names.join(', ')}`);
