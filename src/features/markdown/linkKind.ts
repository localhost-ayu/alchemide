export type LinkKind = "external" | "anchor" | "other";

export function linkKind(href: string | undefined): LinkKind {
  if (!href) {
    return "other";
  }
  if (href.startsWith("#")) {
    return "anchor";
  }
  return /^(?:https?:\/\/|mailto:)/i.test(href) ? "external" : "other";
}

export function isRemoteImage(src: string | undefined): boolean {
  return /^https?:\/\//i.test(src ?? "");
}
