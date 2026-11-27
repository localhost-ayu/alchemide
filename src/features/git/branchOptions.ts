import type { Branch } from "../../lib/types";

export type BranchOption = { kind: "branch"; branch: Branch } | { kind: "create"; name: string };

export function localName(branch: Branch): string {
  return branch.remote ? branch.name.slice(branch.name.indexOf("/") + 1) : branch.name;
}

export function branchOptions(branches: Branch[], query: string): BranchOption[] {
  const needle = query.trim().toLowerCase();
  const matches = branches
    .filter((branch) => branch.name.toLowerCase().includes(needle))
    .map((branch): BranchOption => ({ kind: "branch", branch }));
  const exists = branches.some((branch) => !branch.remote && branch.name === query.trim());
  return needle && !exists ? [{ kind: "create", name: query.trim() }, ...matches] : matches;
}
