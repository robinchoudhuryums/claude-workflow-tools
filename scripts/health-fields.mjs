// health-fields.mjs
//
// The ONE definition of PROJECT_HEALTH.md's "Current Standing" field labels.
//
// INV-71 (Cycle 6 remediation). These five labels were hard-coded independently
// in four places: portfolio.mjs, portfolio-status.mjs, the console's
// parseHealth(), and the skeleton /cycle-init tells a project to create. They
// matched — verified — but nothing asserted it, and the failure is silent in the
// worst way: a label that drifts on ONE side makes every reader fall back to
// "—", so the portfolio board, the status board and the console Dashboard all
// render a project as unscored rather than erroring. The block they parse is
// LIVE status, not history (Cycle-6 F07), so a silent blank is a wrong answer
// about the present.
//
// Code readers IMPORT this list. The copies that cannot import it — the console
// (a single self-contained HTML file), the CLAUDE.md skeleton, and the generated
// command file — are checked against it by check-template-sync structural
// check 13, which also floors the list so the derivation cannot narrow itself.
// Keyed, not positional: a plain array would have to be destructured in order,
// so reordering it would silently re-map every reader's fields. HEALTH_LABELS is
// derived from this object for the guard, so the two can never disagree.
export const HEALTH_FIELDS = {
  lastSynthesis:  'Last synthesis:',
  overall:        'Overall (weighted avg):',
  summary:        'One-line summary:',
  topVertical:    'Top vertical priority:',
  topHorizontal:  'Top horizontal priority:',
};

export const HEALTH_LABELS = Object.values(HEALTH_FIELDS);

// The section the labels live in — also duplicated across the same artifacts.
export const HEALTH_SECTION = 'Current Standing';
