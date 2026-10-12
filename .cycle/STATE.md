# Cycle State

## Current
Cycle: 7
Phase: implement
Scope: broad (Cycle-7 /broad-scan, 2026-10-12 — 50 findings F01–F50, 8 fix batches, expansion plan E1–E4)
Test Command: node scripts/gen-commands.mjs --check && node scripts/check-html.mjs && node scripts/check-template-sync.mjs && node scripts/gen-html-prompts.mjs --assert && node scripts/check-output-blocks.mjs && node tests/guard.test.mjs && node tests/render-metrics.test.mjs && node tests/cycle-context.test.mjs && node tests/invariant-check.test.mjs && node tests/portfolio.test.mjs && node tests/portfolio-status.test.mjs && node tests/gen-html-prompts.test.mjs && node tests/check-output-blocks.test.mjs && node tests/verification-pack.test.mjs && node tests/mutation-audit.test.mjs && node tests/mutation-audit.mjs
Subsystem cycles since last Seams audit: 0 (cadence 3 — /reflect increments it, a Seams audit resets it)
Updated: 2026-10-12

## In progress (facts to carry forward — NOT judgments)
- Batch 1 is complete (v1.35.0). Batches 2–8 and the expansion plan are not started.
- The scan's full output (50 findings, ratings, batch + expansion plans) exists only in the session chat — the
  scan writes no file. Batch definitions below are the record of what each batch contains.
- Cycle was set to 7 BY HAND in this checkpoint: the scan ran on v1.34.0, before CYCLE OPEN existed (F01).
  From v1.35.0 on, the opening audit writes it.

## Completed this cycle
- v1.35.0 | Batch 1 | F01 CYCLE OPEN step in /broad-scan, /audit, /targeted-audit owns the Cycle increment;
  implement CHECKPOINTs + /cycle-resume set Phase: implement, /reflect sets Phase: reflect, /cycle-init starts
  Cycle at 0; INV-12 gating check covers the new step. F02 §1s body ends with a gated SEAM COUNTER reset and
  reads the configured cadence. F03 §6a opener permits its step-8 metrics append. F04 /reflect exemption covers
  BLOCKS; <letter> defined. F06 /broad-implement points at the Invariant Library.

## Pending / not yet done
- Batch 2 — console data correctness: F12 (stale prompts after editing the active project), F13 (§6a fill form
  copies one block to every subsystem), F14 (malformed repo spec shows green Live; no fetch timeout), F15 (stale
  activeProjectId), F16 (malformed non-project keys brick init via import), F17 (stale fill forms after switch).
- Batch 3 — consumer script correctness: F33 (symlinked scripts no-op exit 0), F34 (verification-pack unusable
  in a consumer), F32 (render-metrics/netTrend sum synthesis net; test asserts it), F35 (CRLF parsers disagree),
  F36 (seams cadence reads the template default), F39, F40, F41.
- Batch 4 — keyboard & layout: F24, F25, F26, F22, F23. Batch 5 — focus, feedback, theme: F30, F27, F29, F28.
- Batch 6 — guard false greens I: F31 (CI YAML read as text), F45 (hostile fixture never seeds remote Dashboard
  data), F18 (199-char placeholder cap), F48, F49, F20. Lands AFTER Batches 2–3.
- Batch 7 — guard false greens II: F47 (order-blind canonicalCoverage), F46, F50 (block copies disagree now),
  F37, F38, F44.
- Batch 8 — docs/agnosticism: F10 (HIPAA-only "generic" security add-on), F42 (invariant-check runs arbitrary
  shell; header says otherwise), F07, F08, F05 (v1.33.0 missing from the re-pull list), F09, F11, F19, F21.
- Deferred: F43 (hook framing/size cap) — tied to the §4v-vs-SessionStart-hook decision.
- Expansion (optional): E1 ST4+G5, E2 ST1+G1, E3 G2, E4 ST3+G4. Not batched: ST2 (packaging decision), G3.
- OPEN DECISIONS (operator, not work): INV-73 (§1s hardcodes the five default Axis B categories); §4v
  independence vs the SessionStart hook; R21's /audit vs /targeted-audit dead-code asymmetry.
- Phase "verify" is still written by nothing — §4v is read-only. The §4v-vs-hook decision depends on it.

## Open follow-on items
- deleteProject() leaves ccg:<pid>:invariants / :archive / :cycle behind; a new project deriving the
  same id inherits a dead project's invariants.
- The project form splits invariant lines on `|`, so rule text containing a pipe mis-parses (this
  repo's own INV-08/INV-46 would).
- --accent is 3.4:1 on the light surface; left alone deliberately as the identity colour.
- The `#fff` phase-dot label on a semantic fill is 2.3:1 — perceptual, for S8.
- legacyCopy()'s SUCCESS path is still unexercised (the stub execCommand returns false).
- Strategic: CSP (needs event delegation, L), no LICENSE file.

## Decisions made (so the next session doesn't re-litigate)
- The console's prompts are GENERATED/LOCKED from CLAUDE.md. As of v1.29.0 this covers EVERY static
  <pre> as well as all nine dynamic builders, and gen-html-prompts --assert fails if a new static
  prompt appears with no manifest entry. There is no unlocked tier left.
- Prompts with no slash-command counterpart (§1 variants, §4 pre-check, §5 add-ons, §7 blocks, the
  §4v reference) are canonical SECTIONS in CLAUDE.md, not new commands — each extends a command that
  already exists, so minting one would duplicate a body rather than extend it.
- net_score stays a strict gate; hardening shows up in defensive_count.
- R11 (Dynamic Workflows orchestrator) is HELD until DW leaves research preview.
- STATE.md is rolling and template-shaped; narrative history goes to .cycle/HISTORY.md (F15), and
  check-template-sync now fails if this file grows a section the template does not define.
- A GUARD MUST PROVE THE PROPERTY ITS COVERAGE RESTS ON, not a proxy for it. INV-56 proved a covering
  :focus-visible rule EXISTED; coverage actually rested on that rule being UNIVERSAL, which nothing
  asserted. Same shape as INV-68: the proven set rested on both parsers agreeing, and nothing measured
  them against the file. When a check passes, ask what unstated property makes its conclusion true.
- /broad-scan keeps fixes and new capability in SEPARATE plans: findings go in numbered Batches, G/ST
  items only in Expansion batches (E1…), never in a Batch or its hour total. G/ST work is a capability,
  never a production fix (net_score stays strict). ST, not S, because S1… is the Regression Scenario id.
- buildPack DERIVES its probes from the seed it prints and takes no `probes` override. The override is
  what let disclosure and use diverge; re-adding one reopens the class.

## Where I left off
Cycle 7 open; Batch 1 shipped as v1.35.0 (state ownership — CYCLE OPEN). Next: /broad-implement Batch 2
(console data correctness), then Batch 3 (consumer scripts). Batches 6–7 tighten guards and must land after
the defects they would expose are fixed. The scan output is in chat only; the batch list above is the record.
