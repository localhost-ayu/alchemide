import { type MessageKey, t } from "../../lib/i18n";
import type { Blame } from "../../lib/types";

export const UNCOMMITTED = "0".repeat(40);

const UNITS: [number, MessageKey, MessageKey][] = [
  [365 * 24 * 3600, "time.year", "time.years"],
  [30 * 24 * 3600, "time.month", "time.months"],
  [7 * 24 * 3600, "time.week", "time.weeks"],
  [24 * 3600, "time.day", "time.days"],
  [3600, "time.hour", "time.hours"],
  [60, "time.minute", "time.minutes"],
];

export function timeAgo(seconds: number, nowSeconds: number): string {
  const elapsed = Math.max(0, nowSeconds - seconds);
  for (const [size, one, many] of UNITS) {
    const count = Math.floor(elapsed / size);
    if (count >= 1) {
      return count === 1 ? t(one) : t(many, { count });
    }
  }
  return t("time.justNow");
}

export type BlameLabel = { text: string; title: string };

export function blameLabel(blame: Blame, line: number, nowSeconds: number): BlameLabel | null {
  const hash = blame.lines[line - 1];
  const commit = hash ? blame.commits[hash] : undefined;
  if (!hash || !commit) {
    return null;
  }
  if (hash === UNCOMMITTED) {
    return { text: t("blame.uncommitted"), title: t("blame.notCommitted") };
  }
  return {
    text: t("blame.label", { author: commit.author, age: timeAgo(commit.time, nowSeconds) }),
    title: `${hash.slice(0, 7)} ${commit.summary}`,
  };
}
