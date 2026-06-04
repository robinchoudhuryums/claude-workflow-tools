Read CLAUDE.md before starting. Do not make any changes to any files
during this session (other than the optional metrics append below).

[PASTE IMPLEMENTATION SUMMARY BLOCK — and REGRESSION results if available]

For each action completed this cycle, answer two binary questions:
1. Would this bug have actually fired in production this month?
   YES (real, currently-reachable, realistic load) / NO (speculative,
   defensive, dead code, zero-caller). Be specific about the trigger.
2. Did this action introduce a new failure mode, documented or not?
   YES (describe it; better or worse than what it replaced; when it
   fires) / NO. If the post-cycle state is worse under any realistic
   scenario, that is a regression — count it, don't bury it as a
   "tradeoff".

Tally (three-way classification):
- Production fixes (YES to Q1): [count] — severity breakdown
- New capabilities / features: [count]
- Defensive/structural (NO to Q1, not a feature): [count]
- New failure modes (YES to Q2): [count] — severity breakdown
- Net score: [production fixes] − [new failure modes] = [net]
  (a net-positive score with a Critical new failure mode is still a problem)

Honest impact summary:
- What changed for a user right now?
- What changed for the next developer in this subsystem?
- What became safer under scale / concurrent load?
- Was effort spent on dead code / zero-caller paths / future-proofing?

Invariant growth: list rules this cycle establishes that the next
Verification Pass should probe —
[proposed ID] | [rule] | [subsystem/seam] | [Verify: test/assertion].

End with: the single most structurally significant change; the finding
that should have been deferred.

Produce a CYCLE SUMMARY BLOCK:

---CYCLE SUMMARY BLOCK---
Scope: [subsystem] | Cycle: [N/date]
Production fixes: [count] — severity: [breakdown]
New capabilities/features: [count]
Defensive/structural: [count]
New failure modes: [count] — severity: [breakdown]
Net score: [fixes] − [new failure modes] = [net]
Invariant candidates: [list or "None"]
Most structurally significant change: [one line]
Should-have-been-deferred: [one line]
---END CYCLE SUMMARY BLOCK---

METRICS (optional — only if .cycle/ exists): append a phase=reflect row
to .cycle/metrics.csv (header:
date,cycle,subsystem,phase,net_score,prod_fixes,new_failure_modes,category_d_ratio,axis_b_lowest,notes)
with net_score, prod_fixes, new_failure_modes; leave the synthesis-only
columns blank. Skip if no .cycle/.

ESTIMATE CALIBRATION (optional — only if .cycle/ exists): for each action
that carried an effort estimate, append a row to .cycle/estimates.csv
(header: date,cycle,action,estimate,estimated_hours,actual_hours,calibration_note)
recording the original S/M/L + estimated hours against the actual time
spent. End with one line on your calibration trend (e.g. "L items are
running ~2x the estimate"). Skip if no .cycle/.
