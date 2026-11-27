import { t } from "./i18n";
import { parseJsonc } from "./jsonc";
import type { LanguageId } from "./languages";

export type Snippet = {
  name: string;
  prefixes: string[];
  body: string;
  description: string;
  languages: LanguageId[] | "all";
};

export type SnippetFileResult = {
  snippets: Snippet[];
  problem: string | null;
};

const VSCODE_LANGUAGES: Record<string, LanguageId[]> = {
  php: ["php"],
  blade: ["php"],
  javascript: ["javascript"],
  typescript: ["typescript"],
  javascriptreact: ["jsx"],
  typescriptreact: ["tsx"],
  sql: ["sql"],
  markdown: ["markdown"],
  html: ["html"],
  css: ["css"],
  json: ["json"],
  jsonc: ["json"],
  rust: ["rust"],
  python: ["python"],
  go: ["go"],
  plaintext: ["plaintext"],
};

export function languagesFromScope(scope: string): LanguageId[] {
  const languages = scope
    .split(",")
    .flatMap((id) => VSCODE_LANGUAGES[id.trim().toLowerCase()] ?? []);
  return [...new Set(languages)];
}

function textList(value: unknown): string[] | null {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }
  return null;
}

export function readSnippetDefinitions(
  definitions: unknown,
  languages: LanguageId[] | "all",
): Snippet[] {
  if (typeof definitions !== "object" || definitions === null || Array.isArray(definitions)) {
    return [];
  }
  return Object.entries(definitions).flatMap(([name, raw]): Snippet[] => {
    if (typeof raw !== "object" || raw === null) {
      return [];
    }
    const fields = raw as Record<string, unknown>;
    const prefixes = textList(fields.prefix)?.filter((prefix) => prefix.trim() !== "");
    const body = textList(fields.body);
    if (!prefixes?.length || !body) {
      return [];
    }
    const scoped =
      typeof fields.scope === "string" && fields.scope.trim() !== ""
        ? languagesFromScope(fields.scope)
        : languages;
    if (scoped !== "all" && scoped.length === 0) {
      return [];
    }
    return [
      {
        name,
        prefixes,
        body: body.join("\n"),
        description: typeof fields.description === "string" ? fields.description : "",
        languages: scoped,
      },
    ];
  });
}

export function readSnippetFile(file: string, content: string): SnippetFileResult {
  let definitions: unknown;
  try {
    definitions = parseJsonc(content);
  } catch {
    return { snippets: [], problem: t("snippets.invalidJson", { file }) };
  }
  if (file.endsWith(".code-snippets")) {
    return { snippets: readSnippetDefinitions(definitions, "all"), problem: null };
  }
  const languages = languagesFromScope(file.replace(/\.json$/, ""));
  if (languages.length === 0) {
    return { snippets: [], problem: t("snippets.unknownLanguage", { file }) };
  }
  return { snippets: readSnippetDefinitions(definitions, languages), problem: null };
}

export function snippetsFor(language: LanguageId, snippets: Snippet[]): Snippet[] {
  return snippets.filter(
    (snippet) => snippet.languages === "all" || snippet.languages.includes(language),
  );
}

type Node =
  | { kind: "text"; value: string }
  | { kind: "tabstop"; index: number; placeholder: Node[] }
  | { kind: "choice"; index: number; options: string[] }
  | { kind: "variable"; name: string; fallback: Node[] | null; transform?: Transform };

type Transform = { regex: string; format: string; flags: string };

type Parsed = { nodes: Node[]; end: number };

const ESCAPABLE = new Set(["$", "}", "\\"]);

function parseChoice(text: string, start: number): { options: string[]; end: number } | null {
  const options: string[] = [];
  let current = "";
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (char === "\\" && index + 1 < text.length) {
      current += text[index + 1];
      index++;
    } else if (char === ",") {
      options.push(current);
      current = "";
    } else if (char === "|" && text[index + 1] === "}") {
      options.push(current);
      return { options, end: index + 2 };
    } else {
      current += char;
    }
  }
  return null;
}

function parseTransform(text: string, start: number): { transform: Transform; end: number } | null {
  const parts = ["", "", ""];
  let part = 0;
  let depth = 0;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (part === 1 && char === "$" && text[index + 1] === "{") {
      depth++;
      parts[part] += char;
    } else if (part === 1 && char === "}" && depth > 0) {
      depth--;
      parts[part] += char;
    } else if (depth > 0) {
      parts[part] += char;
    } else if (char === "\\" && text[index + 1] === "/") {
      parts[part] += "/";
      index++;
    } else if (char === "\\" && index + 1 < text.length) {
      parts[part] += char + text[index + 1];
      index++;
    } else if (char === "/" && part < 2) {
      part++;
    } else if (char === "}" && part === 2) {
      const [regex = "", format = "", flags = ""] = parts;
      return { transform: { regex, format, flags }, end: index + 1 };
    } else {
      parts[part] += char;
    }
  }
  return null;
}

const CASES: Record<string, (text: string) => string> = {
  upcase: (text) => text.toUpperCase(),
  downcase: (text) => text.toLowerCase(),
  capitalize: (text) => text.charAt(0).toUpperCase() + text.slice(1),
  pascalcase: (text) =>
    text
      .split(/[^A-Za-z0-9]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(""),
  camelcase: (text) => {
    const pascal = CASES.pascalcase?.(text) ?? text;
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  },
};

function formatMatch(format: string, groups: (string | undefined)[]): string {
  return format.replace(
    /\$(\d+)|\$\{(\d+)(?::(?:\/(\w+)|\+([^}]*)|-?([^}]*)))?\}|\\(.)/g,
    (_match, plain, index, caseName, ifSet, otherwise, escaped) => {
      if (escaped !== undefined) {
        return escaped;
      }
      const group = groups[Number(plain ?? index)] ?? "";
      if (caseName) {
        return CASES[caseName]?.(group) ?? group;
      }
      if (ifSet !== undefined) {
        return group ? ifSet : "";
      }
      return group || (otherwise ?? "");
    },
  );
}

export function applyTransform(value: string, transform: Transform): string {
  let pattern: RegExp;
  try {
    pattern = new RegExp(transform.regex, transform.flags.replace(/[^gimsuy]/g, ""));
  } catch {
    return value;
  }
  return value.replace(pattern, (...args: unknown[]) => {
    const groups = args.filter((arg): arg is string | undefined => typeof arg !== "number");
    return formatMatch(transform.format, groups.slice(0, -1));
  });
}

function parseNodes(text: string, start: number, insideBraces: boolean): Parsed {
  const nodes: Node[] = [];
  let literal = "";
  let index = start;
  const flush = () => {
    if (literal) {
      nodes.push({ kind: "text", value: literal });
      literal = "";
    }
  };
  while (index < text.length) {
    const char = text[index] ?? "";
    const next = text[index + 1] ?? "";
    if (char === "\\" && ESCAPABLE.has(next)) {
      literal += next;
      index += 2;
      continue;
    }
    if (insideBraces && char === "}") {
      flush();
      return { nodes, end: index + 1 };
    }
    if (char === "$") {
      const simple = /^\$(\d+|[A-Za-z_]\w*)/.exec(text.slice(index));
      if (simple?.[1]) {
        flush();
        const name = simple[1];
        nodes.push(
          /^\d/.test(name)
            ? { kind: "tabstop", index: Number(name), placeholder: [] }
            : { kind: "variable", name, fallback: null },
        );
        index += simple[0].length;
        continue;
      }
      const braced = /^\$\{(\d+|[A-Za-z_]\w*)([:|}/])/.exec(text.slice(index));
      if (braced?.[1] && braced[2]) {
        const name = braced[1];
        const after = index + braced[0].length;
        const isNumber = /^\d/.test(name);
        if (braced[2] === "}") {
          flush();
          nodes.push(
            isNumber
              ? { kind: "tabstop", index: Number(name), placeholder: [] }
              : { kind: "variable", name, fallback: null },
          );
          index = after;
          continue;
        }
        if (braced[2] === "|" && isNumber) {
          const choice = parseChoice(text, after);
          if (choice) {
            flush();
            nodes.push({ kind: "choice", index: Number(name), options: choice.options });
            index = choice.end;
            continue;
          }
        }
        if (braced[2] === "/" && !isNumber) {
          const parsed = parseTransform(text, after);
          if (parsed) {
            flush();
            nodes.push({ kind: "variable", name, fallback: null, transform: parsed.transform });
            index = parsed.end;
            continue;
          }
        }
        if (braced[2] === ":") {
          const inner = parseNodes(text, after, true);
          flush();
          nodes.push(
            isNumber
              ? { kind: "tabstop", index: Number(name), placeholder: inner.nodes }
              : { kind: "variable", name, fallback: inner.nodes },
          );
          index = inner.end;
          continue;
        }
      }
    }
    literal += char;
    index++;
  }
  flush();
  return { nodes, end: index };
}

function variableText(
  node: Extract<Node, { kind: "variable" }>,
  variables: Record<string, string>,
): string | null {
  const value = variables[node.name];
  if (value !== undefined) {
    return node.transform ? applyTransform(value, node.transform) : value;
  }
  return node.fallback ? plainText(node.fallback, variables) : null;
}

function plainNode(node: Node, variables: Record<string, string>): string {
  switch (node.kind) {
    case "text":
      return node.value;
    case "tabstop":
      return plainText(node.placeholder, variables);
    case "choice":
      return node.options[0] ?? "";
    case "variable":
      return variableText(node, variables) ?? node.name;
  }
}

function plainText(nodes: Node[], variables: Record<string, string>): string {
  return nodes.map((node) => plainNode(node, variables)).join("");
}

function escapeBraces(text: string): string {
  return text.replace(/[{}]/g, (brace) => `\\${brace}`);
}

function field(index: number | string, text: string): string {
  return text === "" || /[{}\n]/.test(text) ? `\${${index}}` : `\${${index}:${text}}`;
}

function templateNode(node: Node, variables: Record<string, string>): string {
  switch (node.kind) {
    case "text":
      return escapeBraces(node.value);
    case "tabstop":
      return field(node.index, plainText(node.placeholder, variables));
    case "choice":
      return field(node.index, node.options[0] ?? "");
    case "variable": {
      const value = variableText(node, variables);
      return value === null ? field(node.name, "") : escapeBraces(value);
    }
  }
}

export function toTemplate(body: string, variables: Record<string, string>): string {
  return parseNodes(body, 0, false)
    .nodes.map((node) => templateNode(node, variables))
    .join("");
}

const COMMENTS: Partial<Record<LanguageId, [string, string, string]>> = {
  php: ["//", "/*", "*/"],
  javascript: ["//", "/*", "*/"],
  typescript: ["//", "/*", "*/"],
  jsx: ["//", "/*", "*/"],
  tsx: ["//", "/*", "*/"],
  rust: ["//", "/*", "*/"],
  go: ["//", "/*", "*/"],
  css: ["/*", "/*", "*/"],
  sql: ["--", "/*", "*/"],
  python: ["#", '"""', '"""'],
  html: ["<!--", "<!--", "-->"],
  markdown: ["<!--", "<!--", "-->"],
};

const pad = (value: number) => String(value).padStart(2, "0");

export function snippetVariables(
  path: string,
  language: LanguageId,
  now: Date,
  uuid: () => string,
): Record<string, string> {
  const separator = path.includes("\\") ? "\\" : "/";
  const cut = path.lastIndexOf(separator);
  const fileName = path.slice(cut + 1);
  const dot = fileName.lastIndexOf(".");
  const [line = "", blockStart = "", blockEnd = ""] = COMMENTS[language] ?? [];
  const month = now.toLocaleString("en", { month: "long" });
  const day = now.toLocaleString("en", { weekday: "long" });
  return {
    TM_FILENAME: fileName,
    TM_FILENAME_BASE: dot > 0 ? fileName.slice(0, dot) : fileName,
    TM_DIRECTORY: cut > 0 ? path.slice(0, cut) : "",
    TM_FILEPATH: path,
    TM_SELECTED_TEXT: "",
    CLIPBOARD: "",
    CURRENT_YEAR: String(now.getFullYear()),
    CURRENT_YEAR_SHORT: String(now.getFullYear()).slice(-2),
    CURRENT_MONTH: pad(now.getMonth() + 1),
    CURRENT_MONTH_NAME: month,
    CURRENT_MONTH_NAME_SHORT: month.slice(0, 3),
    CURRENT_DATE: pad(now.getDate()),
    CURRENT_DAY_NAME: day,
    CURRENT_DAY_NAME_SHORT: day.slice(0, 3),
    CURRENT_HOUR: pad(now.getHours()),
    CURRENT_MINUTE: pad(now.getMinutes()),
    CURRENT_SECOND: pad(now.getSeconds()),
    CURRENT_SECONDS_UNIX: String(Math.floor(now.getTime() / 1000)),
    UUID: uuid(),
    LINE_COMMENT: line,
    BLOCK_COMMENT_START: blockStart,
    BLOCK_COMMENT_END: blockEnd,
  };
}
