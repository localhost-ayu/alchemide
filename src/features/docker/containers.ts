import { t } from "../../lib/i18n";
import type { DockerContainer } from "../../lib/types";

const ACTIVE_STATES = new Set(["running", "restarting", "paused"]);

export function isActive(container: DockerContainer): boolean {
  return ACTIVE_STATES.has(container.state);
}

function byProjectThenName(a: DockerContainer, b: DockerContainer): number {
  if (a.project !== b.project) {
    if (a.project === null) {
      return 1;
    }
    if (b.project === null) {
      return -1;
    }
    return a.project.localeCompare(b.project);
  }
  return a.name.localeCompare(b.name);
}

export function splitByState(containers: DockerContainer[]): {
  active: DockerContainer[];
  inactive: DockerContainer[];
} {
  const sorted = [...containers].sort(byProjectThenName);
  return {
    active: sorted.filter(isActive),
    inactive: sorted.filter((container) => !isActive(container)),
  };
}

export function shortId(container: DockerContainer): string {
  return container.id.slice(0, 12);
}

export function logsCommand(container: DockerContainer): string {
  return `docker logs --follow --tail 200 ${shortId(container)}`;
}

export function dockerNotice(error: string): string {
  if (/not installed|not on the PATH/i.test(error)) {
    return t("docker.missing");
  }
  if (/error during connect|cannot connect|daemon|pipe/i.test(error)) {
    return t("docker.notRunning");
  }
  return error.replace(/^Error:\s*/, "");
}
