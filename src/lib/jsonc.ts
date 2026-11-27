export function stripJsonComments(text: string): string {
  let result = "";
  let inString = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];
    if (inString) {
      result += char;
      if (char === "\\") {
        result += next ?? "";
        index++;
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
      result += char;
    } else if (char === "/" && next === "/") {
      while (index < text.length && text[index] !== "\n") {
        index++;
      }
      result += "\n";
    } else if (char === "/" && next === "*") {
      const end = text.indexOf("*/", index + 2);
      index = end < 0 ? text.length : end + 1;
    } else {
      result += char;
    }
  }
  return result;
}

function removeTrailingCommas(text: string): string {
  let result = "";
  let inString = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      result += char;
      if (char === "\\") {
        result += text[index + 1] ?? "";
        index++;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === ",") {
      const rest = text.slice(index + 1).trimStart();
      if (rest.startsWith("}") || rest.startsWith("]")) {
        continue;
      }
    }
    result += char;
  }
  return result;
}

export function parseJsonc(text: string): unknown {
  return JSON.parse(removeTrailingCommas(stripJsonComments(text.replace(/^\uFEFF/, ""))));
}
