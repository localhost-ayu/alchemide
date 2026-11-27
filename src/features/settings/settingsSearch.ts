export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesSearch(text: string, query: string): boolean {
  const needle = normalizeForSearch(query);
  if (!needle) {
    return true;
  }
  const haystack = normalizeForSearch(text);
  return needle.split(" ").every((word) => haystack.includes(word));
}

export function filterSettings(root: HTMLElement, query: string): number {
  let visible = 0;
  for (const section of root.querySelectorAll<HTMLElement>(".settings__section")) {
    const heading = section.querySelector("h3")?.textContent ?? "";
    const headingMatches = Boolean(query.trim()) && matchesSearch(heading, query);
    let sectionVisible = 0;
    for (const field of section.querySelectorAll<HTMLElement>(".settings__field")) {
      const show = headingMatches || matchesSearch(field.textContent ?? "", query);
      field.hidden = !show;
      sectionVisible += show ? 1 : 0;
    }
    section.hidden = sectionVisible === 0 && !headingMatches && Boolean(query.trim());
    visible += sectionVisible;
  }
  return visible;
}
