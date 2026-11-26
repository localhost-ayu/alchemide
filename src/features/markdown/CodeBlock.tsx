import { useEffect, useState } from "react";
import type { ThemedToken } from "shiki/core";
import type { CodeLanguage } from "./codeLanguage";
import { tokenize } from "./highlighter";

type CodeBlockProps = {
  code: string;
  language: CodeLanguage;
};

const ITALIC = 1;
const BOLD = 2;

function tokenStyle(token: ThemedToken) {
  const fontStyle = token.fontStyle ?? 0;
  return {
    color: token.color,
    fontStyle: fontStyle & ITALIC ? "italic" : undefined,
    fontWeight: fontStyle & BOLD ? "bold" : undefined,
  };
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [lines, setLines] = useState<ThemedToken[][] | null>(null);

  useEffect(() => {
    let current = true;
    tokenize(code, language)
      .then((tokens) => current && setLines(tokens))
      .catch(() => current && setLines(null));
    return () => {
      current = false;
    };
  }, [code, language]);

  if (!lines) {
    return <code className={`language-${language}`}>{code}</code>;
  }
  return (
    <code className={`language-${language}`} data-highlighted="true">
      {lines.map((line, lineIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity besides their position
        <span key={lineIndex} className="code-line">
          {line.map((token) => (
            <span key={token.offset} style={tokenStyle(token)}>
              {token.content}
            </span>
          ))}
          {lineIndex < lines.length - 1 && "\n"}
        </span>
      ))}
    </code>
  );
}
