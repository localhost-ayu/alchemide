import {
  autocompletion,
  type Completion,
  type CompletionSource,
  snippet,
} from "@codemirror/autocomplete";
import { EditorState, type Extension } from "@codemirror/state";
import type { LanguageId } from "../../lib/languages";
import { useSnippetStore } from "../../lib/snippetStore";
import { type Snippet, snippetsFor, snippetVariables, toTemplate } from "../../lib/snippets";

const PREFIX = /[\w@!-]+$/;

function completionFor(
  path: string,
  language: LanguageId,
  item: Snippet,
  prefix: string,
): Completion {
  return {
    label: prefix,
    detail: item.name,
    info: item.description || undefined,
    type: "snippet",
    boost: -1,
    apply: (view, completion, from, to) => {
      const variables = snippetVariables(path, language, new Date(), () => crypto.randomUUID());
      snippet(toTemplate(item.body, variables))(view, completion, from, to);
    },
  };
}

export function snippetCompletion(path: string, language: LanguageId): Extension {
  const source: CompletionSource = (context) => {
    const word = context.matchBefore(PREFIX);
    if (!word && !context.explicit) {
      return null;
    }
    const snippets = snippetsFor(language, useSnippetStore.getState().snippets);
    if (snippets.length === 0) {
      return null;
    }
    return {
      from: word?.from ?? context.pos,
      options: snippets.flatMap((item) =>
        item.prefixes.map((prefix) => completionFor(path, language, item, prefix)),
      ),
      validFor: /^[\w@!-]*$/,
    };
  };
  return [autocompletion(), EditorState.languageData.of(() => [{ autocomplete: source }])];
}
