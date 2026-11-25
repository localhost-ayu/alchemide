import type { Entry, Environment, Folder } from "./types";

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

export function getEnvironment(): Promise<Environment> {
  return Promise.resolve({ kind: "linux" });
}

export function openFolder(): Promise<Folder | null> {
  return Promise.resolve({ name: "sample-project", path: root });
}

export function listDir(path: string): Promise<Entry[]> {
  return Promise.resolve(tree[path] ?? []);
}
