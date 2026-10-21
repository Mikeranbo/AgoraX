/** Client-side CSV export, no library. */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // Suggestions, names and contact fields are typed by strangers. A cell starting with
  // = + - @ is executed as a formula by Excel/Sheets, so neutralise those — but leave
  // plain numbers and phone numbers (+31612345678) untouched.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s) && !/^[+-]?\d[\d\s]*$/.test(s)) {
    s = `'${s}`;
  }
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, header: string[], rows: unknown[][]) {
  // BOM so Excel reads UTF-8 (names, emoji) correctly.
  const blob = new Blob(['﻿' + toCsv(header, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
