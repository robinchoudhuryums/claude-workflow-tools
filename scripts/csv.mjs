// csv.mjs — the ONE CSV parser for .cycle/metrics.csv (and estimates.csv).
//
// F03 (Cycle 6): three scripts read metrics.csv and two of them split rows on
// a bare comma, assuming only the `notes` column could ever contain one. Any
// row whose SUBSYSTEM contains a comma — "Auth, Security & HIPAA" and
// "Coaching, Gamification & LMS" in the built-in projects — was silently
// skipped by verification-pack's cycleTotals and portfolio-status's netTrend,
// quoted or not. render-metrics parsed quotes correctly but privately. A
// third copy of the parse is exactly the parallel-source-of-truth drift this
// tool polices, so all three now import this.
//
// RFC-4180 shape: fields may be double-quoted; a doubled quote inside a quoted
// field is a literal quote; CRLF and LF both end a row. Import-safe (no CLI).

/** Parse one CSV row into its fields. */
export function parseRow(line) {
  const out = [];
  let field = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(field); field = ''; }
    else if (c === '\r') { /* trailing CR from a CRLF row */ }
    else field += c;
  }
  out.push(field);
  return out;
}

/** Parse a whole CSV text into rows of fields (blank lines skipped). */
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field); if (row.length > 1 || row[0] !== '') rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
