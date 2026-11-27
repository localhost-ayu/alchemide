export type LanguageId =
  | "php"
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "sql"
  | "markdown"
  | "html"
  | "css"
  | "json"
  | "rust"
  | "python"
  | "go"
  | "plaintext";

const byExtension: Record<string, LanguageId> = {
  php: "php",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  jsx: "jsx",
  tsx: "tsx",
  sql: "sql",
  md: "markdown",
  html: "html",
  css: "css",
  json: "json",
  rs: "rust",
  py: "python",
  pyw: "python",
  pyi: "python",
  go: "go",
};

const labels: Record<LanguageId, string> = {
  php: "PHP",
  javascript: "JavaScript",
  typescript: "TypeScript",
  jsx: "JavaScript JSX",
  tsx: "TypeScript JSX",
  sql: "SQL",
  markdown: "Markdown",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  rust: "Rust",
  python: "Python",
  go: "Go",
  plaintext: "Plain Text",
};

export function languageForPath(path: string): LanguageId {
  const name = path.split(/[\\/]/).pop() ?? "";
  const dot = name.lastIndexOf(".");
  if (dot <= 0) {
    return "plaintext";
  }
  return byExtension[name.slice(dot + 1).toLowerCase()] ?? "plaintext";
}

export function isLanguageId(value: string): value is LanguageId {
  return value in labels;
}

export function languageLabel(language: LanguageId): string {
  return labels[language];
}
