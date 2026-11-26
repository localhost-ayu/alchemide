export type CodeLanguage =
  | "typescript"
  | "tsx"
  | "javascript"
  | "jsx"
  | "php"
  | "sql"
  | "html"
  | "css"
  | "json"
  | "shellscript"
  | "markdown"
  | "rust"
  | "yaml";

const ALIASES: Record<string, CodeLanguage> = {
  ts: "typescript",
  typescript: "typescript",
  tsx: "tsx",
  js: "javascript",
  javascript: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  php: "php",
  sql: "sql",
  html: "html",
  css: "css",
  json: "json",
  sh: "shellscript",
  bash: "shellscript",
  shell: "shellscript",
  zsh: "shellscript",
  console: "shellscript",
  md: "markdown",
  markdown: "markdown",
  rs: "rust",
  rust: "rust",
  yml: "yaml",
  yaml: "yaml",
};

export function codeLanguage(className: string | undefined): CodeLanguage | null {
  const match = /(?:^|\s)language-([\w-]+)/.exec(className ?? "");
  return match?.[1] ? (ALIASES[match[1].toLowerCase()] ?? null) : null;
}
