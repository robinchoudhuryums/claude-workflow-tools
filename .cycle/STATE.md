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
- F02 (remainder): the HTML §1 "Layered Audit" (p1) uses a flag-list rather than /audit's 12 numbered focus areas. Reconciling them is a DESIGN DECISION (which structure is canonical?) — needs operator input before rewriting. Not done.
- F04 (no automated HTML-JS coverage), F05 (innerHTML of pasted content), F06 (silent state-write failures), F07/F08 (docs/console-prose drift) — not selected this session.

## Open follow-on items
- DECISION NEEDED: should the HTML §1 audit prompt be rewritten to match /audit's 12 focus areas, or is the "Layered Audit" intentionally distinct? (Blocks full F02.)
- The durable fix for the HTML-as-fourth-copy problem is ROADMAP R3 (generate the HTML prompts from CLAUDE.md). The F03 guard markers are a bounded mitigation, not the full solution.
- Tight guard markers add maintenance cost: intentionally rewording a guarded prompt requires updating both artifacts together (this is the guard working as designed, but worth knowing).

## Decisions made (so the next session doesn't re-litigate)
- Did NOT rewrite the §1 Layered Audit (p1) — flagged as a design decision rather than a mechanical sync (per /broad-implement "stop if more complex than expected").
- F03 implemented as marker + structural-block parity checks (bounded), not full HTML/CLAUDE.md generation convergence (that is R3).

## Where I left off
F01–F03 implemented, Test Command green. Next concrete step: decide the §1
audit reconciliation question (above) to finish F02, or run /broad-implement
on the next finding cluster (F04 + F05 are the highest-value remaining).
Consider /sync-docs for F07/F08 (docs drift) and /reflect is already done.
