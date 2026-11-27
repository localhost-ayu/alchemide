import type { Blame } from "../../lib/types";

export const UNCOMMITTED = "0".repeat(40);

const UNITS: [number, string][] = [
  [365 * 24 * 3600, "year"],
  [30 * 24 * 3600, "month"],
  [7 * 24 * 3600, "week"],
  [24 * 3600, "day"],
  [3600, "hour"],
  [60, "minute"],
];

export function timeAgo(seconds: number, nowSeconds: number): string {
  const elapsed = Math.max(0, nowSeconds - seconds);
  for (const [size, unit] of UNITS) {
    const count = Math.floor(elapsed / size);
    if (count >= 1) {
      return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}

export type BlameLabel = { text: string; title: string };

export function blameLabel(blame: Blame, line: number, nowSeconds: number): BlameLabel | null {
  const hash = blame.lines[line - 1];
  const commit = hash ? blame.commits[hash] : undefined;
  if (!hash || !commit) {
    return null;
  }
  if (hash === UNCOMMITTED) {
    return { text: "You, uncommitted", title: "Not committed yet" };
  }
  return {
    text: `${commit.author}, ${timeAgo(commit.time, nowSeconds)}`,
    title: `${hash.slice(0, 7)} ${commit.summary}`,
  };
}
