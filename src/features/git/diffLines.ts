export type DiffLineKind = "added" | "removed" | "hunk" | "meta" | "context";

export function classifyDiffLine(line: string): DiffLineKind {
  if (line.startsWith("+++") || line.startsWith("---")) {
    return "meta";
  }
  if (line.startsWith("@@")) {
    return "hunk";
  }
  if (/^(diff |index |new file|deleted file|similarity|rename |old mode|new mode)/.test(line)) {
    return "meta";
  }
  if (line.startsWith("+")) {
    return "added";
  }
  if (line.startsWith("-")) {
    return "removed";
  }
  return "context";
}

export function changeLabel(code: string | null): string {
  switch (code) {
    case "M":
      return "modified";
    case "A":
      return "added";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    case "C":
      return "copied";
    case "?":
      return "untracked";
    case "U":
      return "conflict";
    default:
      return "";
  }
}
