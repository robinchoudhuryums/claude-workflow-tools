# Cycle State

## Current
Cycle: 1
Phase: implement (F01–F05 + F02 done; F06–F08 remain)
Scope: Interactive Console (HTML), Tooling & Sync Infrastructure
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs
Updated: 2026-06-03

## In progress (facts to carry forward — NOT judgments)
- First broad-scan complete (8 findings F01–F08). F01–F03 implemented this session.

## Completed this cycle
- F01 | claude-code-guide-v2.html | HTML reflect prompt now emits a ---CYCLE SUMMARY BLOCK--- (the input §6a synthesis consumes).
- F02 | claude-code-guide-v2.html | HTML regression prompt gained invariant Verify-test + deploy-verified notes; §1 audit prompt converged to /audit's 12 focus areas + "fire this month?" + effort/time.
- F03 | scripts/check-template-sync.mjs, .cycle/config.md | guard pins HTML prompt-behavior parity + 7 workflow blocks; added INV-19.
- F04 | scripts/check-html.mjs, .cycle/config.md, .github/workflows/sync-check.yml | new automated HTML-JS coverage (syntax + builders + behavior), wired into Test Command and CI; INV-04/05/09 now executable via it.
- F05 | claude-code-guide-v2.html, .cycle/config.md | added esc() and escaped all stored/pasted content in innerHTML (archive, invariants, project/subsystem tables, form rows); fixed the broken archive Copy-content onclick (JSON.stringify in a double-quoted attribute); added INV-20.

## Pending / not yet done
- F06 (silent state-write failures), F07/F08 (F07 done via sync-docs; F08 optional polish) — F06 not yet implemented.

## Open follow-on items
- RESOLVED: §1 audit reconciliation — HTML §1 (p1) now uses /audit's 12 focus areas + "fire this month?" + effort/time. (F02 complete.) Note: p1 focus-area parity is content-aligned but NOT independently guarded (recurs only under R3 convergence).
- The durable fix for the HTML-as-fourth-copy problem is ROADMAP R3 (generate the HTML prompts from CLAUDE.md). The F03 guard markers are a bounded mitigation, not the full solution.
- F07/F08 docs: F07 fixed via /sync-docs; F08 (HTML §-section prose non-exhaustive) left as optional polish.
- Tight guard markers add maintenance cost: intentionally rewording a guarded prompt requires updating both artifacts together (this is the guard working as designed, but worth knowing).

## Decisions made (so the next session doesn't re-litigate)
- Did NOT rewrite the §1 Layered Audit (p1) — flagged as a design decision rather than a mechanical sync (per /broad-implement "stop if more complex than expected").
- F03 implemented as marker + structural-block parity checks (bounded), not full HTML/CLAUDE.md generation convergence (that is R3).

## Where I left off
F01–F05 + F02 implemented; full Test Command (gen --check + check-html +
sync guard) green. Only F06 (wrap silent localStorage writes with a
visible failure message) remains from the first broad-scan, plus F08
(optional HTML prose polish). Next: /broad-implement F06, or call the
cycle and run a Verification Pass + Health Synthesis to score it.
