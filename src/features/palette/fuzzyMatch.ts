export type FuzzyMatch = {
  score: number;
  indices: number[];
};

function isWordStart(text: string, index: number): boolean {
  if (index === 0) {
    return true;
  }
  const previous = text[index - 1] ?? "";
  const current = text[index] ?? "";
  return (
    /[\s/\\._-]/.test(previous) ||
    (previous === previous.toLowerCase() && current !== current.toLowerCase())
  );
}

export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const needle = query.replace(/\s+/g, "").toLowerCase();
  if (!needle) {
    return { score: 0, indices: [] };
  }
  const haystack = text.toLowerCase();
  const indices: number[] = [];
  let score = 0;
  let from = 0;
  for (const char of needle) {
    const index = haystack.indexOf(char, from);
    if (index === -1) {
      return null;
    }
    const previous = indices[indices.length - 1];
    score += 1;
    if (previous !== undefined && index === previous + 1) {
      score += 10;
    }
    if (isWordStart(text, index)) {
      score += 6;
    }
    score -= Math.min(index - from, 10) * 0.5;
    indices.push(index);
    from = index + 1;
  }
  return { score: score - text.length * 0.01, indices };
}

export function rankByFuzzy<T>(query: string, items: T[], text: (item: T) => string): T[] {
  return items
    .map((item) => ({ item, match: fuzzyMatch(query, text(item)) }))
    .filter((entry): entry is { item: T; match: FuzzyMatch } => entry.match !== null)
    .sort((a, b) => b.match.score - a.match.score)
    .map((entry) => entry.item);
}
