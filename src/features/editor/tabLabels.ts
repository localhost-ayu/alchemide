function segments(path: string): string[] {
  return path.split(/[\\/]/).filter(Boolean);
}

function parentFolders(path: string): string[] {
  return segments(path).slice(0, -1).reverse();
}

function distinguishingDepth(folders: string[][]): number {
  const deepest = Math.max(...folders.map((parents) => parents.length));
  for (let depth = 1; depth <= deepest; depth++) {
    const suffixes = folders.map((parents) => parents.slice(0, depth).join("/"));
    if (new Set(suffixes).size === suffixes.length) {
      return depth;
    }
  }
  return deepest;
}

export function tabDetails(paths: string[]): Map<string, string> {
  const byName = new Map<string, string[]>();
  for (const path of paths) {
    const name = segments(path).pop() ?? path;
    byName.set(name, [...(byName.get(name) ?? []), path]);
  }
  const details = new Map<string, string>();
  for (const group of byName.values()) {
    if (group.length < 2) {
      continue;
    }
    const folders = group.map(parentFolders);
    const depth = distinguishingDepth(folders);
    group.forEach((path, index) => {
      const shown = (folders[index] ?? []).slice(0, depth).reverse();
      details.set(path, shown.length > 0 ? shown.join("/") : "/");
    });
  }
  return details;
}
