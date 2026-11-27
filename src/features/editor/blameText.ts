import { t } from "../../lib/i18n";
import { timeAgo } from "../../lib/timeAgo";
import type { Blame } from "../../lib/types";

export const UNCOMMITTED = "0".repeat(40);

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
