import type {
  AssetKind,
  ChangedFile,
  Commit,
  ContainerAction,
  DockerContainer,
  Entry,
  Environment,
  FileContent,
  Folder,
  GitStatus,
  LspMessage,
  LspStart,
  ProjectFile,
  ReplaceSummary,
  ReplaceTarget,
  SearchBatch,
  SearchDone,
  SearchQuery,
  Settings,
  SnippetFile,
  SnippetImport,
  TerminalOutput,
  TerminalProfile,
  UpdateInfo,
  UserThemeFile,
  VscodeTheme,
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

const LOOSE_FILE = "/home/user/notes/todo.md";

const files: Record<string, string> = {
  [LOOSE_FILE]: "# Notes\n\n- [ ] Water the plants\n",
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

let lastFolderRemembered = false;

export function setMockLastFolder(remembered: boolean): void {
  lastFolderRemembered = remembered;
}

export function reopenLastFolder(): Promise<Folder | null> {
  return lastFolderRemembered ? openFolder() : Promise.resolve(null);
}

export function pickFile(): Promise<string | null> {
  return Promise.resolve(LOOSE_FILE);
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

let userThemes = new Map<string, unknown>();

export function setMockUserThemes(themes: Record<string, unknown>): void {
  userThemes = new Map(Object.entries(themes));
}

export function mockUserThemes(): Record<string, unknown> {
  return Object.fromEntries(userThemes);
}

export function listUserThemes(): Promise<UserThemeFile[]> {
  const files = [...userThemes.keys()].sort();
  return Promise.resolve(
    files.map((file) => ({ file, theme: structuredClone(userThemes.get(file)) ?? null })),
  );
}

function themeFileName(name: string): string {
  const stem =
    name
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "theme";
  let file = `${stem}.json`;
  for (let counter = 2; userThemes.has(file); counter++) {
    file = `${stem}-${counter}.json`;
  }
  return file;
}

export function saveUserTheme(file: string | null, theme: unknown): Promise<string> {
  const name = (theme as { name?: unknown } | null)?.name;
  if (typeof name !== "string" || name.trim() === "") {
    return Promise.reject(new Error("a theme must be a JSON object with a name"));
  }
  const target = file ?? themeFileName(name);
  userThemes.set(target, structuredClone(theme));
  return Promise.resolve(target);
}

export function deleteUserTheme(file: string): Promise<void> {
  userThemes.delete(file);
  return Promise.resolve();
}

let themeToImport: unknown | null = null;
const exportedThemes: unknown[] = [];

export function setMockThemeToImport(theme: unknown | null): void {
  themeToImport = theme;
}

export function mockExportedThemes(): unknown[] {
  return structuredClone(exportedThemes);
}

export function importTheme(): Promise<unknown | null> {
  return Promise.resolve(structuredClone(themeToImport));
}

export function exportTheme(theme: unknown): Promise<boolean> {
  exportedThemes.push(structuredClone(theme));
  return Promise.resolve(true);
}

const MOCK_VSCODE_THEMES: Record<string, { entry: VscodeTheme; theme: unknown }> = {
  "/vscode/theme-defaults/themes/dark_modern.json": {
    entry: {
      label: "Dark Modern",
      extension: "theme-defaults",
      path: "/vscode/theme-defaults/themes/dark_modern.json",
      dark: true,
    },
    theme: {
      name: "Dark Modern",
      type: "dark",
      colors: {
        "editor.background": "#1F1F1F",
        "editor.foreground": "#CCCCCC",
        "sideBar.background": "#181818",
        focusBorder: "#0078D4",
      },
      tokenColors: [
        { scope: "keyword.control", settings: { foreground: "#C586C0" } },
        { scope: "string", settings: { foreground: "#CE9178" } },
        { scope: "comment", settings: { foreground: "#6A9955" } },
      ],
    },
  },
  "/vscode/theme-solarized-light/themes/solarized-light.json": {
    entry: {
      label: "Solarized Light",
      extension: "theme-solarized-light",
      path: "/vscode/theme-solarized-light/themes/solarized-light.json",
      dark: false,
    },
    theme: {
      name: "Solarized Light",
      type: "light",
      colors: { "editor.background": "#FDF6E3", "editor.foreground": "#657B83" },
      tokenColors: [{ scope: "keyword", settings: { foreground: "#859900" } }],
    },
  },
};

let vscodeThemeToPick: unknown | null = null;

export function setMockVscodeThemeToPick(theme: unknown | null): void {
  vscodeThemeToPick = theme;
}

export function listVscodeThemes(): Promise<VscodeTheme[]> {
  return Promise.resolve(Object.values(MOCK_VSCODE_THEMES).map(({ entry }) => ({ ...entry })));
}

export function loadVscodeTheme(path: string): Promise<unknown> {
  const found = MOCK_VSCODE_THEMES[path];
  return found
    ? Promise.resolve(structuredClone(found.theme))
    : Promise.reject(new Error("the file is not a valid theme"));
}

export function pickVscodeTheme(): Promise<unknown | null> {
  return Promise.resolve(structuredClone(vscodeThemeToPick));
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
const sampleGif = "mascots/sample-dance.gif";
const ONE_PIXEL_GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";

export function assetUrl(relative: string): Promise<string> {
  if (relative === sampleVideo) {
    return Promise.resolve("data:video/webm;base64,");
  }
  if (relative === sampleGif) {
    return Promise.resolve(ONE_PIXEL_GIF);
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

let userSnippetFiles: SnippetFile[] = [];
let vscodeSnippetFiles: SnippetFile[] | null = [
  {
    file: "php.json",
    content: JSON.stringify({
      Hello: { prefix: "hello", body: 'echo "Hello from VS Code";$0' },
    }),
  },
];

export function setMockSnippets(user: SnippetFile[], vscode: SnippetFile[] | null): void {
  userSnippetFiles = user;
  vscodeSnippetFiles = vscode;
}

export function listUserSnippets(): Promise<SnippetFile[]> {
  return Promise.resolve([...userSnippetFiles]);
}

export function importVscodeSnippets(): Promise<SnippetImport> {
  if (!vscodeSnippetFiles) {
    return Promise.resolve({ copied: 0, found: false });
  }
  const fresh = vscodeSnippetFiles.filter(
    (source) => !userSnippetFiles.some((file) => file.content === source.content),
  );
  userSnippetFiles = [...userSnippetFiles, ...fresh];
  return Promise.resolve({ copied: fresh.length, found: true });
}

let zoom = 1;

export function mockZoom(): number {
  return zoom;
}

export function setZoom(scale: number): Promise<void> {
  zoom = Math.min(1.6, Math.max(0.7, scale));
  return Promise.resolve();
}

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

const resultHandlers = new Set<(batch: SearchBatch) => void>();
const doneHandlers = new Set<(done: SearchDone) => void>();

function mockPattern(query: SearchQuery): RegExp {
  const source = query.regex ? query.text : query.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(source, query.caseSensitive ? "g" : "gi");
}

export function searchStart(id: number, query: SearchQuery): Promise<void> {
  if (!query.text) {
    return Promise.reject(new Error("type something to search"));
  }
  const pattern = mockPattern(query);
  const matches: SearchBatch["matches"] = [];
  for (const [path, text] of Object.entries(files).sort()) {
    text.split("\n").forEach((line, index) => {
      const ranges = [...line.matchAll(pattern)].map((found): [number, number] => [
        found.index,
        found.index + found[0].length,
      ]);
      if (ranges.length > 0) {
        matches.push({
          path,
          relative: path.slice(root.length + 1),
          line: index + 1,
          preview: line,
          ranges,
        });
      }
    });
  }
  setTimeout(() => {
    for (const handler of resultHandlers) {
      handler({ id, matches });
    }
    for (const handler of doneHandlers) {
      handler({ id, total: matches.length, truncated: false });
    }
  }, 0);
  return Promise.resolve();
}

export function onSearchResults(handler: (batch: SearchBatch) => void): Promise<() => void> {
  resultHandlers.add(handler);
  return Promise.resolve(() => resultHandlers.delete(handler));
}

export function onSearchDone(handler: (done: SearchDone) => void): Promise<() => void> {
  doneHandlers.add(handler);
  return Promise.resolve(() => doneHandlers.delete(handler));
}

export function replaceMatches(
  query: SearchQuery,
  replacement: string,
  targets: ReplaceTarget[],
): Promise<ReplaceSummary> {
  let filesChanged = 0;
  let replacements = 0;
  for (const target of targets) {
    const text = files[target.path];
    if (text === undefined) {
      continue;
    }
    let count = 0;
    files[target.path] = text
      .split("\n")
      .map((line, index) => {
        if (!target.lines.includes(index + 1)) {
          return line;
        }
        return line.replace(mockPattern(query), (...args) => {
          count += 1;
          return query.regex ? args[0].replace(mockPattern(query), replacement) : replacement;
        });
      })
      .join("\n");
    if (count > 0) {
      filesChanged += 1;
      replacements += count;
    }
  }
  return Promise.resolve({ files: filesChanged, replacements });
}

let availableUpdate: UpdateInfo | null = null;
let installedUpdates = 0;

export function setMockUpdate(update: UpdateInfo | null): void {
  availableUpdate = update;
}

export function mockInstalledUpdates(): number {
  return installedUpdates;
}

export function checkUpdate(): Promise<UpdateInfo | null> {
  return Promise.resolve(availableUpdate);
}

export function installUpdate(): Promise<void> {
  if (!availableUpdate) {
    return Promise.reject(new Error("there is no update to install"));
  }
  installedUpdates += 1;
  return Promise.resolve();
}

const INITIAL_CONTAINERS: DockerContainer[] = [
  {
    id: "a1b2c3d4e5f6",
    name: "shop-db-1",
    image: "mysql:8.4",
    state: "running",
    status: "Up 2 hours",
    ports: "0.0.0.0:3306->3306/tcp",
    project: "shop",
  },
  {
    id: "b2c3d4e5f6a1",
    name: "shop-mail-1",
    image: "axllent/mailpit:v1.22",
    state: "exited",
    status: "Exited (0) 5 days ago",
    ports: "",
    project: "shop",
  },
  {
    id: "c3d4e5f6a1b2",
    name: "scratch",
    image: "alpine",
    state: "exited",
    status: "Exited (0) 3 weeks ago",
    ports: "",
    project: null,
  },
];

let containers: DockerContainer[] | null = structuredClone(INITIAL_CONTAINERS);
const dockerActions: string[] = [];

export function setMockDocker(available: boolean): void {
  containers = available ? structuredClone(INITIAL_CONTAINERS) : null;
  dockerActions.length = 0;
}

export function mockDockerActions(): string[] {
  return [...dockerActions];
}

export function dockerContainers(): Promise<DockerContainer[]> {
  return containers
    ? Promise.resolve(structuredClone(containers))
    : Promise.reject(new Error("Docker is not installed or not on the PATH"));
}

export function dockerAction(id: string, action: ContainerAction): Promise<void> {
  const container = containers?.find((candidate) => candidate.id === id);
  if (!container) {
    return Promise.reject(new Error("Docker: No such container"));
  }
  dockerActions.push(`${action} ${container.name}`);
  container.state = action === "stop" ? "exited" : "running";
  container.status = action === "stop" ? "Exited (0) Less than a second ago" : "Up 1 second";
  return Promise.resolve();
}

const lspMessageHandlers = new Set<(message: LspMessage) => void>();
const lspExitHandlers = new Set<(id: number) => void>();
const runningServers = new Set<number>();
let mockServerFamilies = new Set(["typescript"]);

const SERVER_FAMILIES: Record<string, { family: string; name: string; install: string }> = {
  javascript: {
    family: "typescript",
    name: "TypeScript language server",
    install: "npm install -g typescript-language-server typescript",
  },
  typescript: {
    family: "typescript",
    name: "TypeScript language server",
    install: "npm install -g typescript-language-server typescript",
  },
  jsx: {
    family: "typescript",
    name: "TypeScript language server",
    install: "npm install -g typescript-language-server typescript",
  },
  tsx: {
    family: "typescript",
    name: "TypeScript language server",
    install: "npm install -g typescript-language-server typescript",
  },
  php: { family: "php", name: "Intelephense", install: "npm install -g intelephense" },
  sql: { family: "sql", name: "sqls", install: "go install github.com/sqls-server/sqls@latest" },
};

const FAMILY_IDS: Record<string, number> = { typescript: 1, php: 2, sql: 3 };

export function setMockLanguageServers(families: string[]): void {
  mockServerFamilies = new Set(families);
}

export function stopMockLanguageServer(id: number): void {
  runningServers.delete(id);
  for (const handler of lspExitHandlers) {
    handler(id);
  }
}

export function lspStart(language: string): Promise<LspStart> {
  const server = SERVER_FAMILIES[language];
  if (!server) {
    return Promise.resolve({ kind: "unsupported" });
  }
  if (!mockServerFamilies.has(server.family)) {
    return Promise.resolve({ kind: "missing", name: server.name, install: server.install });
  }
  const id = FAMILY_IDS[server.family] ?? 0;
  runningServers.add(id);
  return Promise.resolve({ kind: "ready", id, root, name: server.name });
}

type MockRequest = {
  id?: number;
  method?: string;
  params?: { textDocument?: { uri?: string; text?: string }; contentChanges?: { text?: string }[] };
};

function mockReply(id: number, payload: unknown): void {
  setTimeout(() => {
    for (const handler of lspMessageHandlers) {
      handler({ id, message: JSON.stringify(payload) });
    }
  }, 0);
}

const MOCK_RESULTS: Record<string, unknown> = {
  initialize: {
    capabilities: {
      textDocumentSync: 1,
      completionProvider: { triggerCharacters: ["."] },
      hoverProvider: true,
      definitionProvider: true,
    },
  },
  "textDocument/completion": {
    isIncomplete: false,
    items: [
      { label: "flaskReady", kind: 6, detail: "const flaskReady: boolean" },
      { label: "mixReagents", kind: 3, detail: "function mixReagents(): void" },
    ],
  },
  "textDocument/definition": {
    uri: `file://${root}/src/main.ts`,
    range: { start: { line: 2, character: 8 }, end: { line: 2, character: 11 } },
  },
  "textDocument/hover": {
    contents: { kind: "markdown", value: "Mock hover from the lab server" },
  },
};

function mockDiagnostics(id: number, request: MockRequest): void {
  const uri = request.params?.textDocument?.uri;
  const changes = request.params?.contentChanges ?? [];
  const text = request.params?.textDocument?.text ?? changes[changes.length - 1]?.text;
  if (!uri || text === undefined) {
    return;
  }
  const diagnostics = text.split("\n").flatMap((line, index) => {
    const column = line.indexOf("debugger");
    return column < 0
      ? []
      : [
          {
            range: {
              start: { line: index, character: column },
              end: { line: index, character: column + "debugger".length },
            },
            severity: 1,
            message: "Unexpected debugger statement",
          },
        ];
  });
  mockReply(id, {
    jsonrpc: "2.0",
    method: "textDocument/publishDiagnostics",
    params: { uri, diagnostics },
  });
}

export function lspSend(id: number, message: string): Promise<void> {
  if (!runningServers.has(id)) {
    return Promise.reject(new Error("this language server is no longer running"));
  }
  const request = JSON.parse(message) as MockRequest;
  if (request.method === "textDocument/didOpen" || request.method === "textDocument/didChange") {
    mockDiagnostics(id, request);
  }
  if (request.id !== undefined && request.method) {
    mockReply(id, { jsonrpc: "2.0", id: request.id, result: MOCK_RESULTS[request.method] ?? null });
  }
  return Promise.resolve();
}

export function lspStop(id: number): Promise<void> {
  runningServers.delete(id);
  return Promise.resolve();
}

export function onLspMessage(handler: (message: LspMessage) => void): Promise<() => void> {
  lspMessageHandlers.add(handler);
  return Promise.resolve(() => lspMessageHandlers.delete(handler));
}

export function onLspExit(handler: (id: number) => void): Promise<() => void> {
  lspExitHandlers.add(handler);
  return Promise.resolve(() => lspExitHandlers.delete(handler));
}

type MockGit = { files: ChangedFile[]; log: Commit[] };

const INITIAL_GIT: MockGit = {
  files: [
    { path: "src/App.tsx", originalPath: null, staged: null, unstaged: "M" },
    { path: "README.md", originalPath: null, staged: "M", unstaged: null },
    { path: "notes.txt", originalPath: null, staged: null, unstaged: "?" },
  ],
  log: [
    {
      hash: "4f1c2a9e0b7d6c5a4b3c2d1e0f9a8b7c6d5e4f3a",
      shortHash: "4f1c2a9",
      author: "Sample Author",
      date: "2026-11-26T10:00:00-03:00",
      subject: "feat: first sample commit",
    },
  ],
};

let git: MockGit = structuredClone(INITIAL_GIT);

export function resetMockGit(): void {
  git = structuredClone(INITIAL_GIT);
}

export function gitStatus(): Promise<GitStatus> {
  return Promise.resolve({ branch: "main", files: structuredClone(git.files) });
}

export function gitDiff(path: string, staged: boolean, untracked: boolean): Promise<string> {
  const label = untracked ? "new file" : staged ? "staged" : "unstaged";
  return Promise.resolve(
    `diff --git a/${path} b/${path}\n@@ -1,2 +1,2 @@ ${label}\n-old line\n+new line\n unchanged\n`,
  );
}

export function gitStage(paths: string[]): Promise<void> {
  git.files = git.files.map((file) =>
    paths.includes(file.path)
      ? {
          ...file,
          staged: file.unstaged === "?" ? "A" : (file.unstaged ?? file.staged),
          unstaged: null,
        }
      : file,
  );
  return Promise.resolve();
}

export function gitStageAll(): Promise<void> {
  return gitStage(git.files.map((file) => file.path));
}

export function gitUnstage(paths: string[]): Promise<void> {
  git.files = git.files.map((file) =>
    paths.includes(file.path)
      ? { ...file, unstaged: file.staged === "A" ? "?" : file.staged, staged: null }
      : file,
  );
  return Promise.resolve();
}

export function gitCommit(message: string): Promise<string> {
  if (!message.trim()) {
    return Promise.reject(new Error("git: write a commit message"));
  }
  const staged = git.files.filter((file) => file.staged);
  if (staged.length === 0) {
    return Promise.reject(new Error("git: nothing to commit"));
  }
  const hash = `${(git.log.length + 1).toString(16).padStart(7, "0")}${"a".repeat(33)}`;
  git.log = [
    {
      hash,
      shortHash: hash.slice(0, 7),
      author: "Sample Author",
      date: new Date().toISOString(),
      subject: message.split("\n")[0] ?? "",
    },
    ...git.log,
  ];
  git.files = git.files.filter((file) => file.unstaged).map((file) => ({ ...file, staged: null }));
  return Promise.resolve(hash.slice(0, 7));
}

export function gitLog(): Promise<Commit[]> {
  return Promise.resolve(structuredClone(git.log));
}

export function gitShow(hash: string): Promise<string> {
  const commit = git.log.find((entry) => entry.hash === hash);
  return commit
    ? Promise.resolve(
        `${commit.subject}\n\ndiff --git a/src/App.tsx b/src/App.tsx\n@@ -1 +1 @@\n-before\n+after\n`,
      )
    : Promise.reject(new Error("git: unknown commit"));
}
