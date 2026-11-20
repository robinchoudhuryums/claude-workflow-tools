#!/usr/bin/env node
// gen-commands.mjs
//
// Generates .claude/commands/<name>.md from the command templates in
// CLAUDE.md (the canonical source). Each command in CLAUDE.md is a
// `### /<name>` heading followed by a fenced ``` block containing the
// prompt body; this script extracts every such block and writes one file
// per command so consumers can copy the whole directory.
//
// A body line that is exactly `{{include: <section heading>}}` is replaced by
// the fenced block under `### <section heading>` — the Verification Pass,
// Seams audit and Health Synthesis bodies are canonical sections locked to the
// console, and /verify, /seams-audit and /health-synthesis run them. Expanding
// at generation keeps ONE source for each body while the command file a
// consumer copies still carries the full text. An include that names no
// fenced section is an error, never an empty expansion.
//
// Usage:
//   node scripts/gen-commands.mjs          # write/refresh the files
//   node scripts/gen-commands.mjs --check  # exit 1 if any file is stale,
//                                          # missing, or orphaned (for CI)

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { sectionBody } from './gen-html-prompts.mjs';   // the one extractor the console lock uses

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

const INCLUDE = /^\{\{include: (.+)\}\}$/;
function expandIncludes(body, md, name, problems) {
  const mdLines = md.split('\n');
  return body.split('\n').map(line => {
    const m = line.match(INCLUDE);
    if (!m) return line;
    const heading = m[1].trim();
    // exact heading, not a prefix: a truncated name must not resolve to a longer section
    const text = mdLines.includes('### ' + heading) ? sectionBody(md, heading) : null;
    if (text == null) { problems.push(`/${name}: include names no section with a fenced body: "${heading}"`); return line; }
    return text;
  }).join('\n');
}

const cmds = extractCommands(claudeMd);
const names = Object.keys(cmds).sort();
if (!names.length) { console.error('No command templates found in CLAUDE.md'); process.exit(1); }
const includeProblems = [];
for (const n of names) cmds[n] = expandIncludes(cmds[n], claudeMd, n, includeProblems).replace(/\s+$/, '') + '\n';
if (includeProblems.length) { console.error('Unresolved include(s) in CLAUDE.md command templates:\n  ' + includeProblems.join('\n  ')); process.exit(1); }

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
