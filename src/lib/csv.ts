/**
 * Cells that start with =, +, -, @ or a control character are treated as
 * formulas by Excel and Sheets. A guest could type one into any free-text
 * field, so such cells get a leading apostrophe, which spreadsheets render as
 * plain text.
 */
function neutralise(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

function cell(v: unknown): string {
  const s = neutralise(v == null ? "" : String(v));
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}
