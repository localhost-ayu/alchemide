import type { AssetKind, Entry, Environment, FileContent, Folder, Settings } from "./types";

const root = "/home/user/sample-project";

const tree: Record<string, Entry[]> = {
  [root]: [
    { name: "public", path: `${root}/public`, isDir: true },
    { name: "src", path: `${root}/src`, isDir: true },
    { name: "index.php", path: `${root}/index.php`, isDir: false },
    { name: "package.json", path: `${root}/package.json`, isDir: false },
    { name: "query.sql", path: `${root}/query.sql`, isDir: false },
    { name: "README.md", path: `${root}/README.md`, isDir: false },
  ],
  [`${root}/public`]: [{ name: "index.html", path: `${root}/public/index.html`, isDir: false }],
  [`${root}/src`]: [
    { name: "App.tsx", path: `${root}/src/App.tsx`, isDir: false },
    { name: "main.ts", path: `${root}/src/main.ts`, isDir: false },
    { name: "styles.css", path: `${root}/src/styles.css`, isDir: false },
  ],
};

const files: Record<string, string> = {
  [`${root}/README.md`]: "# Sample project\n\nA small project used by the web mode.\n",
  [`${root}/index.php`]: '<?php\n\necho "Hello from PHP";\n',
  [`${root}/package.json`]: '{\n  "name": "sample-project",\n  "private": true\n}\n',
  [`${root}/query.sql`]: "SELECT id, name\nFROM users\nWHERE active = 1;\n",
  [`${root}/public/index.html`]: "<!doctype html>\n<html>\n  <body></body>\n</html>\n",
  [`${root}/src/App.tsx`]:
    'export function App() {\n  const greeting = "Hello";\n  return <h1>{greeting}</h1>;\n}\n',
  [`${root}/src/main.ts`]: 'import "./styles.css";\n\nconsole.log("ready");\n',
  [`${root}/src/styles.css`]: "body {\n  margin: 0;\n}\n",
};

export function getEnvironment(): Promise<Environment> {
  return Promise.resolve({ kind: "linux" });
}

export function openFolder(): Promise<Folder | null> {
  return Promise.resolve({ name: "sample-project", path: root });
}

export function listDir(path: string): Promise<Entry[]> {
  return Promise.resolve(tree[path] ?? []);
}

export function readFile(path: string): Promise<FileContent> {
  const text = files[path];
  if (text === undefined) {
    return Promise.reject(new Error(`file not found: ${path}`));
  }
  return Promise.resolve({ text, hasBom: false });
}

export function writeFile(path: string, text: string, _hasBom: boolean): Promise<void> {
  files[path] = text;
  return Promise.resolve();
}

export function onCloseRequested(_canClose: () => boolean): Promise<() => void> {
  return Promise.resolve(() => {});
}

export function readMockFile(path: string): string | undefined {
  return files[path];
}

const fsChangeHandlers = new Set<(dirs: string[]) => void>();

export function onFsChange(handler: (dirs: string[]) => void): Promise<() => void> {
  fsChangeHandlers.add(handler);
  return Promise.resolve(() => fsChangeHandlers.delete(handler));
}

export function emitMockFsChange(dirs: string[]): void {
  for (const handler of fsChangeHandlers) {
    handler(dirs);
  }
}

export function setMockDir(path: string, entries: Entry[]): void {
  tree[path] = entries;
}

let settings: Settings = {};

export function loadSettings(): Promise<Settings> {
  return Promise.resolve(structuredClone(settings));
}

export function saveSettings(next: Settings): Promise<void> {
  settings = structuredClone(next);
  return Promise.resolve();
}

const sampleAssets: Record<AssetKind, { path: string; svg: string }> = {
  background: {
    path: "backgrounds/sample-lab.svg",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><defs><linearGradient id="g"><stop offset="0" stop-color="#2b1f45"/><stop offset="1" stop-color="#0d3b2e"/></linearGradient></defs><rect width="16" height="9" fill="url(#g)"/></svg>',
  },
  mascot: {
    path: "mascots/sample-flask.svg",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="12"><path d="M4 0h2v4l4 7H0l4-7z" fill="#b6f24a"/></svg>',
  },
};

export function importAsset(kind: AssetKind): Promise<string | null> {
  return Promise.resolve(sampleAssets[kind].path);
}

const sampleVideo = "backgrounds/sample-loop.webm";

export function assetUrl(relative: string): Promise<string> {
  if (relative === sampleVideo) {
    return Promise.resolve("data:video/webm;base64,");
  }
  const asset = Object.values(sampleAssets).find((candidate) => candidate.path === relative);
  if (!asset) {
    return Promise.reject(new Error(`asset not found: ${relative}`));
  }
  return Promise.resolve(`data:image/svg+xml,${encodeURIComponent(asset.svg)}`);
}
