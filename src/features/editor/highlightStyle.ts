import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const highlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.operatorKeyword], color: "var(--syntax-keyword)" },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: "var(--syntax-string)" },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: "var(--syntax-function)",
  },
  { tag: [tags.comment, tags.meta], color: "var(--syntax-comment)", fontStyle: "italic" },
  {
    tag: [tags.variableName, tags.propertyName, tags.attributeName],
    color: "var(--syntax-variable)",
  },
  { tag: [tags.typeName, tags.className, tags.tagName], color: "var(--syntax-type)" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "var(--syntax-number)" },
  { tag: tags.heading, color: "var(--syntax-keyword)", fontWeight: "bold" },
  { tag: tags.link, color: "var(--syntax-type)", textDecoration: "underline" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.invalid, color: "var(--color-error)" },
]);
