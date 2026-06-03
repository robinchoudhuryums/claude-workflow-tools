# Cycle State

## Current
Cycle: 1
Phase: implement (F01–F03 done; awaiting next selection)
Scope: Interactive Console (HTML), Tooling & Sync Infrastructure
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-template-sync.mjs
Updated: 2026-06-03

## In progress (facts to carry forward — NOT judgments)
- First broad-scan complete (8 findings F01–F08). F01–F03 implemented this session.

## Completed this cycle
- F01 | claude-code-guide-v2.html | HTML reflect prompt now emits a ---CYCLE SUMMARY BLOCK--- (the input §6a synthesis consumes).
- F02 (partial) | claude-code-guide-v2.html | HTML regression prompt gained the invariant Verify-test step and the git-verified-vs-deploy-verified note, matching canonical /regression.
- F03 | scripts/check-template-sync.mjs | guard now pins HTML prompt-behavior parity (reflect block delimiter, regression Verify/deploy markers) and asserts all 7 workflow output blocks appear in both CLAUDE.md and the HTML console.
- F03 | .cycle/config.md | added INV-19 (HTML prompts stay behaviorally aligned with canonical commands).

## Pending / not yet done
- F04 (no automated HTML-JS coverage), F05 (innerHTML of pasted content), F06 (silent state-write failures) — not yet implemented.

## Open follow-on items
- RESOLVED: §1 audit reconciliation — HTML §1 (p1) now uses /audit's 12 focus areas + "fire this month?" + effort/time. (F02 complete.) Note: p1 focus-area parity is content-aligned but NOT independently guarded (recurs only under R3 convergence).
- The durable fix for the HTML-as-fourth-copy problem is ROADMAP R3 (generate the HTML prompts from CLAUDE.md). The F03 guard markers are a bounded mitigation, not the full solution.
- F07/F08 docs: F07 fixed via /sync-docs; F08 (HTML §-section prose non-exhaustive) left as optional polish.
- Tight guard markers add maintenance cost: intentionally rewording a guarded prompt requires updating both artifacts together (this is the guard working as designed, but worth knowing).

## Decisions made (so the next session doesn't re-litigate)
- Did NOT rewrite the §1 Layered Audit (p1) — flagged as a design decision rather than a mechanical sync (per /broad-implement "stop if more complex than expected").
- F03 implemented as marker + structural-block parity checks (bounded), not full HTML/CLAUDE.md generation convergence (that is R3).

## Where I left off
F01–F03 implemented, Test Command green. Next concrete step: decide the §1
audit reconciliation question (above) to finish F02, or run /broad-implement
on the next finding cluster (F04 + F05 are the highest-value remaining).
Consider /sync-docs for F07/F08 (docs drift) and /reflect is already done.
