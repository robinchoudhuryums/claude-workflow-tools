---SEAMS & INVARIANTS AUDIT BLOCK---
Audit date: 2026-09-04
Subsystem cycles since last seams audit: 3 of 3 (DUE) — first Seams audit this project has run

SEAM INVENTORY:
SM-01 | Canonical Docs ↔ Tooling | CLAUDE.md command bodies → .claude/commands/*.md | Contract: explicit (byte-identical, INV-01/11/17) | Risk: Low — write path re-run in a clean copy: 0 files changed
SM-02 | Canonical Docs ↔ Console | canonical bodies → 16 static <pre> | Contract: explicit (manifest, 8 via command + 8 via section) | Risk: Low
SM-03 | Canonical Docs ↔ Console | canonical bodies → 9 dynamic builders | Contract: explicit, but canonicalCoverage ignores EXTRA rendered lines by design | Risk: Med — a builder may carry unlocked text
SM-04 | Tooling ↔ Tooling | check-output-blocks BLOCKS → check-template-sync WORKFLOW_BLOCKS | Contract: explicit, derived (INV-43) | Risk: Low
SM-05 | Cycle state ↔ Tooling | .cycle/config.md library → invariant-check → mutation-audit | Contract: IMPLICIT — regex parse, no floor tying parsed count to the file | Risk: HIGH (proven silent shrink)
SM-06 | Cycle state ↔ Tooling | same library → verification-pack.readInvariants | Contract: IMPLICIT — a SECOND parser with different strictness; nothing asserts they agree | Risk: HIGH (they disagree on an indented line)
SM-07 | Cycle state ↔ Tooling+Console | PROJECT_HEALTH "Current Standing" labels → portfolio.mjs, portfolio-status.mjs, console parseHealth, /cycle-init skeleton | Contract: IMPLICIT — four independent hard-coded copies of one label set | Risk: HIGH
SM-08 | Cycle state ↔ Tooling | STATE.md headings → SessionStart hook, /cycle-resume, portfolio-status | Contract: explicit (INV-65 shape, INV-24) | Risk: Low-Med — readers take the FIRST match of a heading
SM-09 | Cycle state ↔ Tooling | metrics.csv → scripts/csv.mjs → 3 readers | Contract: explicit since F03 | Risk: Med — the WRITERS are prose instructions in /reflect and §6a; INV-33 guards the template text, nothing validates a written row
SM-10 | Tooling ↔ §4v session | the pack's disclosed seed → the verifier's reproduce command | Contract: explicit but BROKEN | Risk: Med (see INV-52 in the §4v block)
SM-11 | Cycle state ↔ §4v/§6a | .cycle/blocks/ read by `<cycle>-` prefix | Contract: explicit (INV-52/F02) | Risk: Med — a release with no block is invisible to both; v1.30.1 shipped a console change with no block
SM-12 | Console markup ↔ console JS | getElementById ids | Contract: explicit since INV-67 (uniqueness) + INV-50 (existence) | Risk: Med — neither proves the RESOLVED element is the intended one
SM-13 | Canonical ↔ Console ↔ /setup-cycle | Cycle Workflow Config schema, three copies | Contract: explicit (INV-16, console copy now GENERATED from canonical) | Risk: Low
SM-14 | Project config ↔ §1s | Axis B categories | Contract: IMPLICIT — §1s hardcodes the 5 defaults in PART 4 and in this block's field names | Risk: Med — LIVE for this project, whose 5 categories are all custom
SM-15 | Tooling ↔ CI | documented Test Command ↔ sync-check.yml stages | Contract: IMPLICIT — parity holds today (16/16, same order, verified) but INV-14 only asserts CI runs check-template-sync | Risk: Med
SM-16 | Console ↔ external projects | built-in `obs` (23 invariants) and `cla` (24) libraries | Contract: implicit snapshots of OTHER repos' libraries, presented to §4v as "INVARIANT LIBRARY (current — N invariants)" | Risk: Low-Med — unverifiable by construction; the sources live elsewhere

INVARIANT LIBRARY UPDATE:
Method: all 67 executed (invariant-check: 67 runnable / 67 PASS / 0 MANUAL) and mutation-proven
fail-closed (75 mutations). Rule TEXT was then checked against the tree. The 62 not named below are PASS
with no textual drift; the exceptions are listed in full.

INV-52 | FAIL | The reproducibility clause does not hold — see the §4v block. Pre-existing (v1.23.0).
INV-56 | FAIL | The check verifies a covering :focus-visible rule EXISTS, never that it APPLIES. Scoping the file's single rule to `.nav-item` strips the indicator from all 19 inline-suppressed form controls and check-html still reports `✓ 19 … covered`. Coverage today is genuine — confirmed in Chromium that the universal rule reaches a control carrying inline outline:none — but it rests on an unstated, unguarded property. Text is also stale: "15 of the 17 suppressions"; there are now 19 (15 still inline). LATENT, not live.
INV-29 | STALE | Enumerates "(p0,p1,p2,p3,p4post,p4reflect,p5)" — 7 prompts. Since v1.29.0 the manifest locks 16. The rule is true but describes less than half its own scope, and INV-66 now covers the full set.
INV-50 | STALE | Wording overstates what it proves. Both Cycle-6 duplicate-id defects passed under it. INV-67 is the complement, not the replacement.
INV-66 | STALE | Self-contradictory: "Nine had no slash-command counterpart … including `setup`, which DID have one." Nine sat outside every lock; eight had no counterpart. Verified: 8 section-resolved + 8 command-resolved = 16 locked.
INV-15 | PASS (carve-out now live) | The §6a/§6b clause holds. Its documented exception does not extend to §1s, and buildSeamsText still hardcodes the five default category names — confirmed in the source. This project's categories are all custom, so the carve-out degraded THIS audit.

Probed: 67 | Passed: 62 | Failed: 2 | Stale: 3 | Unverifiable: 0

Proposed additions:
INV-NEW-68 | parseInvariants' count equals the INV- lines in the library file, and readInvariants agrees exactly | Guards seam: SM-05, SM-06 | Testable: Yes — PROVEN NEEDED: a new invariant with one leading space is dropped by invariant-check and the mutation audit (both green) while the §4v pack shows 68
INV-NEW-69 | every outline:none suppression is covered by a :focus-visible rule that APPLIES to it | Guards seam: SM-12 | Testable: Yes
INV-NEW-70 | the seed a §4v pack discloses reproduces the probes it printed | Guards seam: SM-10 | Testable: Yes
INV-NEW-71 | the PROJECT_HEALTH "Current Standing" label set is identical across all four artifacts, derived from one definition | Guards seam: SM-07 | Testable: Yes
INV-NEW-72 | every release that changes shipped code has a block in .cycle/blocks/ | Guards seam: SM-11 | Testable: Yes
INV-NEW-73 | §1s asks about the project's CONFIGURED Axis B categories | Guards seam: SM-14 | Testable: Yes, but needs edits to an --assert-locked canonical body AND the block's registered field names
INV-NEW-74 | CI runs every stage of the documented Test Command, in order | Guards seam: SM-15 | Testable: Yes

Proposed retirements:
INV-29 | Subsumed by INV-66 once its enumeration is dropped — keep one rule for "static prompts are locked", not one naming 7 of 16.

HORIZONTAL OBSERVATIONS (evidence for next Axis B scoring):
NOTE: written against this project's CONFIGURED categories. The canonical §1s body asks for the five
DEFAULTS, four of which this project does not use — SM-14, demonstrated by this audit.

Cross-Artifact Drift: Strong. Byte-lock on 20 commands, 16 static + 9 dynamic console prompts, derived WORKFLOW_BLOCKS, CI/Test-Command parity exact at 16/16 in order, gen-commands idempotent on the write path. The exception is SM-07: four independent copies of the PROJECT_HEALTH label contract, none derived.
Silent Prompt Degradation: Two live instances. §1s hardcodes the default Axis B names (SM-14). The §4v pack discloses a seed that does not reproduce its own probes (SM-10) — a verifier following the instruction concludes the selection was steered.
Generated-Artifact Staleness: Generated artifacts are clean (25 prompts render non-empty, no unresolved ${} or "undefined", write path a no-op). But invariant TEXT staleness is entirely unguarded: three rules drifted from what they describe with nothing to catch it — the library is prose that only its Verify field is tested against.
Backward-Compatibility Breakage: Healthy. v1.30.1's removal of 17 CSS classes verified safe. readBlocks keeps its no-cycle path, defensive_count is appended last for older files, legacy 3-field Axis B lines still parse.
Guard / Test Coverage Quality: DEGRADING — the lowest category. Two false greens found in a single audit (INV-56 by mutation, INV-52 by composition) plus a silent-shrink vector in the library parse. Each is the same shape the project has hit in three consecutive cycles: the guard proves the instance someone thought of, not the class. INV-58 fixed this one level down; SM-05 shows the level above is open.

RECOMMENDED FOCUS FOR NEXT SUBSYSTEM CYCLE:
Tooling & Sync Infrastructure. All three failures live there, and two of them (SM-05, SM-10) sit inside
the machinery that grades every other cycle — a false green there is not one bad rule but an
over-reported library. Carry into its scope: INV-68 (library-parse floor, highest value — it makes the
"N/N proven" line mean what it says), INV-69, INV-70, then the three STALE rewordings. INV-71/72/74 are
small and can ride along. Defer INV-73 to a cycle that can afford editing an --assert-locked canonical
body plus registered block field names.

DISPOSITION (added 2026-09-04, after remediation): INV-68/69/70 and the three text repairs landed in
v1.31.0; INV-71/72/74 landed in v1.32.0. INV-73 and the §4v/SessionStart-hook independence question
remain OPEN, both pending a decision rather than work.
---END SEAMS & INVARIANTS AUDIT BLOCK---
