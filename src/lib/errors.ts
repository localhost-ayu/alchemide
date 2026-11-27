import { type MessageKey, t } from "./i18n";
import { en } from "./locales/en";

type ErrorPayload = { code: string; message: string; detail?: string | null };

function isPayload(value: unknown): value is ErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ErrorPayload).code === "string" &&
    typeof (value as ErrorPayload).message === "string"
  );
}

function keyFor(code: string): MessageKey | null {
  const key = `error.${code}`;
  return key in en ? (key as MessageKey) : null;
}

export function errorMessage(raw: unknown): string {
  if (!isPayload(raw)) {
    return raw instanceof Error ? raw.message : String(raw);
  }
  const key = keyFor(raw.code);
  return key ? t(key, { detail: raw.detail ?? "" }) : raw.message;
}
