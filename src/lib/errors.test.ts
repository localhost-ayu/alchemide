import { afterEach, expect, test } from "vitest";
import { errorMessage } from "./errors";
import { setLanguagePreference } from "./i18n";

afterEach(() => setLanguagePreference("en"));

test("turns a Rust error code into a message in the interface language", () => {
  const exists = {
    code: "AlreadyExists",
    message: "a file or folder with that name already exists",
  };
  expect(errorMessage(exists)).toBe("a file or folder with that name already exists");

  setLanguagePreference("pt-BR");
  expect(errorMessage(exists)).toBe("já existe um arquivo ou pasta com esse nome");
  expect(errorMessage({ code: "Git", message: "git: bad ref", detail: "bad ref" })).toBe(
    "git: bad ref",
  );
  expect(errorMessage({ code: "Trash", message: "x", detail: "cross-device" })).toBe(
    "não foi possível mover para a lixeira: cross-device",
  );
});

test("falls back to the English message, an Error or plain text", () => {
  expect(errorMessage({ code: "SomethingNew", message: "new failure" })).toBe("new failure");
  expect(errorMessage(new Error("boom"))).toBe("boom");
  expect(errorMessage("plain")).toBe("plain");
});
