import { type MessageKey, t } from "./i18n";

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
