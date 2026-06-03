# Cycle State

## Current
Cycle: 0 (setup)
Phase: idle
Scope: —
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-template-sync.mjs
Updated: 2026-06-03

## In progress (facts to carry forward — NOT judgments)
- /setup-cycle complete; config written to .cycle/config.md.

## Completed this cycle
- setup-cycle | .cycle/config.md | defined 3 subsystems, 12 dimensions, 5 Axis B categories, 18 invariants.

## Pending / not yet done
- First audit cycle has not started.

## Open follow-on items
- None yet.

## Decisions made (so the next session doesn't re-litigate)
- Config stored in .cycle/config.md (not inline in CLAUDE.md) so the canonical template file stays unambiguous; CLAUDE.md has a pointer note.
- Axis B adapted from the default 5 to repo-specific bug shapes (Cross-Artifact Drift, Silent Prompt Degradation, Generated-Artifact Staleness, Backward-Compatibility Breakage, Guard/Test Coverage Quality).
- Test Command is the two node scripts (gen --check + sync guard); HTML console behavior is covered by manual Regression Scenarios S1–S4 (a known coverage gap — candidate for ROADMAP R13).

## Where I left off
Setup is done. Next concrete step: start the first audit with
`/audit Interactive Console (HTML)` (the recommended first subsystem).
