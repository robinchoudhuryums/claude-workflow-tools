---VERIFICATION BLOCK---
Verified scope: Interactive Console (HTML) + Tooling & Sync Infrastructure + Canonical Templates & Docs
Verification date: 2026-09-04
Cycle being verified: Cycle 6 — v1.26.0 … v1.30.0 (+ v1.30.1, which had no block in the pack)

INDEPENDENCE CAVEAT (recorded because it is itself a finding): the verifying session did not participate
in the implementation, but the SessionStart hook auto-loaded .cycle/STATE.md — including the implementer's
first-person narrative and self-assessment — which contradicts §4v's own opening instruction. Every probe
below was run from code reads, executions and a real browser rather than from that text.

INVARIANT PROBE RESULTS:
Machine probe, re-run by the verifier at ceee3be and at tip 90ebd88: invariant-check 67 runnable /
67 PASS / 0 FAIL / 0 MANUAL; mutation audit 67/67 proven fail-closed across 75 mutations. Rule TEXT was
then checked against the tree: every file path and code symbol named in all 67 rules resolves (only
.cycle/console-state.json is absent, correctly — INV-40 says it must never hold credentials). The 62
not named below are PASS with no textual drift; the exceptions are listed in full.

MANDATORY ROTATION PROBES (the pack's five — reproduced from the full seed sha):
INV-38 | §1s + POLICY RESPONSE blocks registered, homed, shape-guarded | PASS | both in the BLOCKS registry (check-output-blocks.mjs:87,90); both present under "## Handoff Block Formats"
INV-13 | every installable command's full text in CLAUDE.md | PASS | derived: 20 .claude/commands/*.md vs 20 `### /name` templates, empty set difference
INV-02 | every README table command has a CLAUDE.md template | PASS | 20 table rows, 0 without a template
INV-27 | portfolio ranks lowest-first, averages only scored, flags unscored | PASS | behavioural run on 3 fixtures: order b(4.0)→a(8.5)→c(—), avg 6.3 across 2 scored, c flagged
INV-17 | gen-commands idempotent | PASS | stronger than --check: ran the WRITE path in a clean copy → 0 files changed

PROBES THE PACK'S OWN REPRODUCE COMMAND YIELDS (probed because reproducibility is broken — see INV-52):
INV-58 | mutation audit fails closed 3 ways | PASS | rotted a find string by hand → "✗ NO-TARGET", exit 1
INV-07 | built-ins resolve to DEFAULT_AXIS_B | PASS | verified on the CONSEQUENCE: buildP6aText for both built-ins names all 5 default categories; neither carries its own axisB
INV-39 | R18 structural/perceptual split co-present | PASS | both markers in CLAUDE.md, console and README
INV-37 | Dashboard pure parsers | PASS | parseHealth on the REAL PROJECT_HEALTH.md returns all 5 fields; parseRepoSpec accepts owner/repo, rejects garbage; scoreColor returns --on-* tokens
INV-44 | every nav href resolves to a real panel | PASS | live DOM: 20 links, 20 panels, 0 orphans, exactly 1 visible

CYCLE-TOUCHED / NEW:
INV-67 | every markup id unique | PASS | live DOM: 188 ids, 0 duplicates; 25 doCopy targets == 25 <pre> ids; no stale 't1'/'setup' reference survives the rename
INV-20/45/53 | escaping at the sinks, jsArg in attribute context | PASS | hostile payloads through fill values, project name, subsystem names and invariants: 0 executions in Chromium
INV-63 | fill form offers every operator placeholder, no format token | PASS | 16 prompts, 31 fields, §1 = 5; all 31 sampled — every one an operator input, no [ID]/[X/10]/[Severity]
INV-64 | probes a pure function of a stated seed | PASS | prefix form rotates on a 1-char seed change; suffix form does not — bug and fix both reproduced
INV-61 | no literal hex text colour; --on-* clears 4.5:1 | PASS | re-derived from CSS: 48 pairs, 0 failures, worst 4.97; 0 literal `color:#…` outside token blocks
INV-62 | labels + drawer aria-expanded/Escape/focus return | PASS | 57 controls 0 unlabelled 0 dangling; drawer driven at 375px; desktop Escape inert
INV-59/60/65/66 | id stability, dashboard failure reason, STATE shape, static prompt lock | PASS | mutation-proven; psetup carries the R18 lines; STATE.md at template shape
INV-50 | every id a render writes to exists | PASS | but its wording overstates its scope — it proves existence, not that the resolved element is the intended one
INV-52 | §4v pack derived; probes seeded reproducibly so a verifier can confirm the selection | FAIL (one clause) | probes ARE seeded from the commit sha and were NOT implementer-chosen (proved: full-sha selection == the pack's five). But buildPack is handed seed.slice(0,12) while selectProbes gets the full sha, so the DISCLOSED seed and reproduce command yield a different five: full sha → INV-38,13,02,27,17 (printed); 12-char → INV-58,07,39,37,44. The reproducibility clause — the invariant's whole purpose — does not hold. Its test asserts the unit and never the composition. Pre-existing since v1.23.0, NOT a Cycle-6 regression.
Probed: 67 | Passed: 66 | Failed: 1 | Unverified: 0

REGRESSION COUNT:
Regressions found: 0
R1 | None found | — | — | —
Eleven candidates were examined and rejected on evidence: the loadCustomProjects normalization hot path
(MEASURED: 21 calls/render at 1.79ms each with 25 large projects, sub-ms at realistic scale);
normalizeProject dropping name-less projects (pre-cycle that input BRICKED init — strictly better); the
whole-backup refusal (pre-cycle it half-imported); readBlocks cycle-scoping (excluded blocks are NAMED,
asserted at verification-pack.test.mjs:131); the t1a/psetup rename (25 doCopy args == 25 pre ids, and the
Tier 1 fill form was inside the destroyed subtree so no stored key can be orphaned); F11 dropping a
co-located placeholder (none exists across the 16 prompts; guard rule (a) fails if one appears); the
document-wide Escape listener (verified inert on desktop); the .fill-select and score-chip visual changes
(deliberate, verified rendering); pf-invs consuming rule text that is exactly "INV-NN" (not a realistic
rule); unquoted comma metrics rows in consumer projects (pre-existing, unchanged); and v1.30.1's dead-CSS
removal (all removed classes unreferenced; browser results identical to v1.30.0).
Net score: 15 − 0 = 15

BOOKKEEPING FOR §6a: the cycle-6 metrics row reads 13 − 0 because /reflect ran BEFORE the v1.30.0
duplicate-id fixes. CONFIRMED by re-derivation: the batch blocks claim 6+4+4 = 14 production fixes and
/reflect correctly demoted F15 to defensive → 13; DUP-1 (High) and DUP-2 (Medium) landed after that row.
True cycle total 15 − 0 with 5 defensive.

CYCLE EXECUTION QUALITY:
Tests run to completion: YES — re-run by the verifier at two commits, not read from the summaries: exit 0,
  292 ✓ (exactly the claimed 292), invariant-check 67/67, mutation audit 67/67 across 75 mutations.
  External artifacts: GitHub Actions "Template sync check" runs #90–#99, conclusion=success on every
  Cycle-6 commit including /reflect, v1.30.0, v1.30.1 and both PR merges.
Common Gotchas cross-checked: YES — visible in the code, not merely asserted. buildFillForm routes every
  handler arg through jsArg() per the Cycle-5 esc()/&#39; gotcha; selectSeededInvariants carries the
  FNV-avalanche gotcha AND explicitly contrasts it with verification-pack.mjs's sha256; renderTier1
  documents the getElementById document-order rule at the fix site.
New Common Gotchas added: YES — 12 new entries in .cycle/config.md this cycle, including the
  derivation-narrows-itself, interaction-only-render, near-miss-regex (\bfor= vs data-for=),
  non-avalanching-hash and flat-id-map entries.

COVERAGE GAP REPORT:
Fixes with regression tests: 16 of 19
Category D candidates (fixes without regression tests):
F07 | PROJECT_HEALTH Current Standing corrected to live status | nothing asserts the block is current; a staleness check is the only mechanical form
F08 | .cycle/config.md cycle-number / test-count drift | no guard ties config.md's stated counts to the live tree
F10 | /cycle-init carries a project-agnostic PROJECT_HEALTH skeleton | the skeleton's 5 field labels match the parsers today (verified), but NOTHING asserts it — three parsers and one generator hard-code them independently
F17 | mobile layout stacks | COUNTED AS COVERED but narrow: check-html pins the literal CSS rule, so a revert fails; a different cause of overflow would not. This is ROADMAP R20's gap.
Category D ratio: 16% (3 of 19 claimed fixes) — 13% (2 of 15) counting production fixes only

INVARIANTS THE VERIFIER RECOMMENDS ADDING:
1. The §4v pack's disclosed seed must reproduce its own printed probes (closes the INV-52 clause above).
2. /cycle-init's PROJECT_HEALTH skeleton labels must equal the labels every consumer parses, derived.
3. Reword INV-50 to its true scope.
4. Every release that changes shipped code must have a block in .cycle/blocks/ (v1.30.1 had none, so
   neither §4v nor §6a can see it).
5. §4v's independence needs protecting from the SessionStart hook (see the caveat at the top).
---END VERIFICATION BLOCK---
