export type LineEnding = "LF" | "CRLF";

export function detectLineEnding(text: string): LineEnding {
  const firstBreak = text.indexOf("\n");
  return firstBreak > 0 && text[firstBreak - 1] === "\r" ? "CRLF" : "LF";
}

export function joinLines(lines: readonly string[], ending: LineEnding): string {
  return lines.join(ending === "CRLF" ? "\r\n" : "\n");
}
