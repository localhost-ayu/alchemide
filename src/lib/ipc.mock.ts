import type {
  AssetKind,
  Entry,
  Environment,
  FileContent,
  Folder,
  ProjectFile,
  Settings,
  TerminalOutput,
  TerminalProfile,
} from "./types";

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
  [`${root}/README.md`]: [
    "# Sample project",
    "",
    "A small project used by the web mode.",
    "",
    "| Reagent | Amount |",
    "| --- | --- |",
    "| Acid | 2 ml |",
    "",
    "- [x] Mix",
    "- [ ] Heat",
    "",
    "```ts",
    'const flask = "ready";',
    "```",
    "",
  ].join("\n"),
  [`${root}/index.php`]: '<?php\n\necho "Hello from PHP";\n',
  [`${root}/package.json`]: '{\n  "name": "sample-project",\n  "private": true\n}\n',
  [`${root}/query.sql`]: "SELECT id, name\nFROM users\nWHERE active = 1;\n",
  [`${root}/public/index.html`]: "<!doctype html>\n<html>\n  <body></body>\n</html>\n",
  [`${root}/src/App.tsx`]:
    'export function App() {\n  const greeting = "Hello";\n  return <h1>{greeting}</h1>;\n}\n',
  [`${root}/src/main.ts`]: 'import "./styles.css";\n\nconsole.log("ready");\n',
  [`${root}/src/styles.css`]: "body {\n  margin: 0;\n}\n",
};

let environment: Environment = { kind: "linux" };
const workspaceHandlers = new Set<(folder: Folder) => void>();

export function getEnvironment(): Promise<Environment> {
  return Promise.resolve(environment);
}

export function setMockEnvironment(next: Environment): void {
  environment = next;
}

export function openFolder(): Promise<Folder | null> {
  const folder = { name: "sample-project", path: root };
  for (const handler of workspaceHandlers) {
    handler(folder);
  }
  return Promise.resolve(folder);
}

export function onWorkspaceChange(handler: (folder: Folder) => void): Promise<() => void> {
  workspaceHandlers.add(handler);
  return Promise.resolve(() => workspaceHandlers.delete(handler));
}

export function listDir(path: string): Promise<Entry[]> {
  return Promise.resolve(tree[path] ?? []);
}

export function listFiles(): Promise<ProjectFile[]> {
  const files: ProjectFile[] = [];
  const visit = (dir: string) => {
    for (const entry of tree[dir] ?? []) {
      if (entry.isDir) {
        visit(entry.path);
      } else {
        files.push({ path: entry.path, relative: entry.path.slice(root.length + 1) });
      }
    }
  };
  visit(root);
  return Promise.resolve(files.sort((a, b) => a.relative.localeCompare(b.relative)));
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

const PROMPT = "\x1b[32mlab\x1b[0m:~/sample-project$ ";
const outputHandlers = new Set<(output: TerminalOutput) => void>();
const exitHandlers = new Set<(id: number) => void>();
const openTerminals = new Map<number, string>();
let nextTerminal = 1;

function emitOutput(id: number, data: string): void {
  for (const handler of outputHandlers) {
    handler({ id, data });
  }
}

const PROFILES: TerminalProfile[] = [
  { id: "shell", label: "bash" },
  { id: "wsl:Ubuntu", label: "WSL · Ubuntu" },
];

export function terminalProfiles(): Promise<TerminalProfile[]> {
  return Promise.resolve(PROFILES);
}

export function terminalOpen(
  profile: string | null,
  _cols: number,
  _rows: number,
): Promise<number> {
  if (profile !== null && !PROFILES.some((candidate) => candidate.id === profile)) {
    return Promise.reject(new Error("this terminal profile is not available"));
  }
  const id = nextTerminal++;
  openTerminals.set(id, "");
  setTimeout(() => emitOutput(id, `Mock shell #${id}\r\n${PROMPT}`), 0);
  return Promise.resolve(id);
}

export function terminalWrite(id: number, data: string): Promise<void> {
  const line = openTerminals.get(id);
  if (line === undefined) {
    return Promise.reject(new Error("this terminal is no longer open"));
  }
  if (data === "\r") {
    openTerminals.set(id, "");
    const reply = line.trim() === "" ? "" : `ran: ${line}\r\n`;
    emitOutput(id, `\r\n${reply}${PROMPT}`);
  } else {
    openTerminals.set(id, line + data);
    emitOutput(id, data);
  }
  return Promise.resolve();
}

export function terminalResize(_id: number, _cols: number, _rows: number): Promise<void> {
  return Promise.resolve();
}

export function terminalClose(id: number): Promise<void> {
  openTerminals.delete(id);
  for (const handler of exitHandlers) {
    handler(id);
  }
  return Promise.resolve();
}

export function onTerminalOutput(handler: (output: TerminalOutput) => void): Promise<() => void> {
  outputHandlers.add(handler);
  return Promise.resolve(() => outputHandlers.delete(handler));
}

export function onTerminalExit(handler: (id: number) => void): Promise<() => void> {
  exitHandlers.add(handler);
  return Promise.resolve(() => exitHandlers.delete(handler));
}

const openedLinks: string[] = [];

export function openExternal(url: string): Promise<void> {
  if (!/^(?:https?:\/\/|mailto:)./i.test(url.trim())) {
    return Promise.reject(new Error("only web and mail links can be opened"));
  }
  openedLinks.push(url);
  return Promise.resolve();
}

export function mockOpenedLinks(): string[] {
  return [...openedLinks];
}
