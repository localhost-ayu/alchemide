import type { HighlighterCore, ThemedToken } from "shiki/core";
import { createCssVariablesTheme, createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { CodeLanguage } from "./codeLanguage";

const THEME = "alchemide";
export const TOKENIZE_TIME_LIMIT_MS = 5000;

const LOADERS: Record<CodeLanguage, () => Promise<unknown>> = {
  typescript: () => import("shiki/langs/typescript.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  php: () => import("shiki/langs/php.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  shellscript: () => import("shiki/langs/shellscript.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
};

let highlighter: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [createCssVariablesTheme({ name: THEME, variablePrefix: "--shiki-" })],
    langs: [],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

export async function tokenize(code: string, language: CodeLanguage): Promise<ThemedToken[][]> {
  const instance = await getHighlighter();
  if (!instance.getLoadedLanguages().includes(language)) {
    await instance.loadLanguage((await LOADERS[language]()) as never);
  }
  return instance.codeToTokens(code, {
    lang: language,
    theme: THEME,
    tokenizeTimeLimit: TOKENIZE_TIME_LIMIT_MS,
  }).tokens;
}
