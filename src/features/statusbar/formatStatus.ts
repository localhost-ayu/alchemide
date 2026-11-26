import type { Cursor } from "../../lib/editorStore";

export function formatPosition(cursor: Cursor): string {
  return `Ln ${cursor.line}, Col ${cursor.column}`;
}

export function formatLineCount(count: number): string {
  return count === 1 ? "1 line" : `${count} lines`;
}

export function formatEncoding(hasBom: boolean): string {
  return hasBom ? "UTF-8 with BOM" : "UTF-8";
}
