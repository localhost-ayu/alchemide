import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const highlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.operatorKeyword], color: "#ff7ac6" },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: "#b6f24a" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "#ffc857" },
  { tag: [tags.comment, tags.meta], color: "#6d6485", fontStyle: "italic" },
  { tag: [tags.variableName, tags.propertyName, tags.attributeName], color: "#c9b8ff" },
  { tag: [tags.typeName, tags.className, tags.tagName], color: "#7ad7ff" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "#ffa36c" },
  { tag: tags.heading, color: "#ff7ac6", fontWeight: "bold" },
  { tag: tags.link, color: "#7ad7ff", textDecoration: "underline" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.invalid, color: "#ff5c5c" },
]);
