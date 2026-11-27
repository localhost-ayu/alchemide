import { isLanguageId } from "../languages";
import { readSnippetDefinitions, type Snippet } from "../snippets";
import codeigniter3 from "./codeigniter3.json";
import codeigniter4 from "./codeigniter4.json";
import go from "./go.json";
import javascript from "./javascript.json";
import laravel from "./laravel.json";
import nextjs from "./nextjs.json";
import node from "./node.json";
import php from "./php.json";
import python from "./python.json";
import react from "./react.json";
import rust from "./rust.json";
import sql from "./sql.json";
import sqlserver from "./sqlserver.json";

type PackFile = { name: string; languages: string[]; snippets: unknown };

export type SnippetPack = {
  id: string;
  name: string;
  snippets: Snippet[];
};

const FILES: Record<string, PackFile> = {
  php,
  javascript,
  rust,
  python,
  go,
  sql,
  node,
  react,
  nextjs,
  laravel,
  codeigniter3,
  codeigniter4,
  sqlserver,
};

export const DEFAULT_PACKS = ["php", "javascript", "rust", "python", "go", "sql"];

export const SNIPPET_PACKS: SnippetPack[] = Object.entries(FILES).map(([id, file]) => ({
  id,
  name: file.name,
  snippets: readSnippetDefinitions(file.snippets, file.languages.filter(isLanguageId)),
}));
