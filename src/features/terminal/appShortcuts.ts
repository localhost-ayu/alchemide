export const CHORD_WINDOW_MS = 1500;

type Key = {
  key: string;
  code?: string;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

export function isChordStart(event: Key): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k";
}

export function reachesApp(event: Key, msSinceChordStart: number): boolean {
  const key = event.key.toLowerCase();
  const withControl = event.ctrlKey || event.metaKey;
  if (msSinceChordStart < CHORD_WINDOW_MS) {
    return true;
  }
  if (withControl && (key === "`" || event.code === "Backquote")) {
    return true;
  }
  if (withControl && event.altKey && key === "m") {
    return true;
  }
  return withControl && !event.altKey && (key === "k" || key === "b");
}
