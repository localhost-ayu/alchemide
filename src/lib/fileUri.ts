const DRIVE = /^[a-z]:$/i;

function encodePath(segments: string[]): string {
  return segments
    .map((segment) => (DRIVE.test(segment) ? segment : encodeURIComponent(segment)))
    .join("/");
}

export function fileUri(path: string): string {
  const slashed = path.replace(/\\/g, "/");
  if (slashed.startsWith("//")) {
    const [host = "", ...rest] = slashed.slice(2).split("/");
    return `file://${host}/${encodePath(rest)}`;
  }
  const segments = slashed.split("/").filter((segment, index) => index === 0 || segment !== "");
  if (DRIVE.test(segments[0] ?? "")) {
    return `file:///${encodePath(segments)}`;
  }
  return `file://${encodePath(segments)}`;
}

export function pathFromUri(uri: string, windows: boolean): string | null {
  if (!uri.startsWith("file://")) {
    return null;
  }
  const [host = "", ...rest] = uri.slice("file://".length).split("/");
  const path = rest.map((segment) => decodeURIComponent(segment)).join("/");
  if (host !== "") {
    return `\\\\${host}\\${path.replace(/\//g, "\\")}`;
  }
  if (windows && /^[a-z]:/i.test(path)) {
    return path.replace(/\//g, "\\");
  }
  return `/${path}`;
}
