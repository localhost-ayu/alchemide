import { useCallback } from "react";
import { create } from "zustand";
import { en } from "./locales/en";
import { ptBR } from "./locales/ptBR";

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
export type Language = "en" | "pt-BR";
export type LanguagePreference = "system" | Language;
export type MessageValues = Record<string, string | number>;
export type Translate = (key: MessageKey, values?: MessageValues) => string;

export const LANGUAGE_PREFERENCES: LanguagePreference[] = ["system", "pt-BR", "en"];

const MESSAGES: Record<Language, Messages> = { en, "pt-BR": ptBR };

export function resolveLanguage(
  preference: LanguagePreference,
  systemLanguages: readonly string[],
): Language {
  if (preference !== "system") {
    return preference;
  }
  return systemLanguages.some((language) => language.toLowerCase().startsWith("pt"))
    ? "pt-BR"
    : "en";
}

export function format(template: string, values?: MessageValues): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    values?.[name] === undefined ? placeholder : String(values[name]),
  );
}

export function translate(language: Language, key: MessageKey, values?: MessageValues): string {
  return format(MESSAGES[language][key], values);
}

export const useLanguageStore = create<{ language: Language }>(() => ({ language: "en" }));

function systemLanguages(): readonly string[] {
  if (typeof navigator === "undefined") {
    return [];
  }
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

export function setLanguagePreference(preference: LanguagePreference): void {
  const language = resolveLanguage(preference, systemLanguages());
  useLanguageStore.setState({ language });
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
}

export function t(key: MessageKey, values?: MessageValues): string {
  return translate(useLanguageStore.getState().language, key, values);
}

export function useT(): Translate {
  const language = useLanguageStore((state) => state.language);
  return useCallback(
    (key: MessageKey, values?: MessageValues) => translate(language, key, values),
    [language],
  );
}
