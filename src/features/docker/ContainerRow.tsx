import { type MessageKey, useT } from "../../lib/i18n";
import { requestTerminal } from "../../lib/terminalRequests";
import type { ContainerAction, DockerContainer } from "../../lib/types";
import { isActive, logsCommand } from "./containers";
import { useDockerStore } from "./useDockerStore";

type Props = { container: DockerContainer };

const PENDING_KEYS: Record<ContainerAction, MessageKey> = {
  start: "docker.starting",
  stop: "docker.stopping",
  restart: "docker.restarting",
};

export function ContainerRow({ container }: Props) {
  const t = useT();
  const pending = useDockerStore((state) => state.pending[container.id]);
  const run = useDockerStore((state) => state.run);
  const active = isActive(container);
  const { name } = container;

  return (
    <li className="docker__row" data-state={container.state} aria-busy={Boolean(pending)}>
      <span className="docker__dot" aria-hidden="true" />
      <div className="docker__info">
        <span className="docker__name" title={container.image}>
          {name}
        </span>
        <span className="docker__meta">
          {pending ? t(PENDING_KEYS[pending]) : container.status}
          {container.ports && ` · ${container.ports}`}
        </span>
      </div>
      <div className="docker__actions">
        {active ? (
          <button
            type="button"
            aria-label={t("docker.stopNamed", { name })}
            title={t("docker.stop")}
            disabled={Boolean(pending)}
            onClick={() => run(container.id, "stop")}
          >
            ■
          </button>
        ) : (
          <button
            type="button"
            aria-label={t("docker.startNamed", { name })}
            title={t("docker.start")}
            disabled={Boolean(pending)}
            onClick={() => run(container.id, "start")}
          >
            ▶
          </button>
        )}
        <button
          type="button"
          aria-label={t("docker.restartNamed", { name })}
          title={t("docker.restart")}
          disabled={Boolean(pending) || !active}
          onClick={() => run(container.id, "restart")}
        >
          ↻
        </button>
        <button
          type="button"
          aria-label={t("docker.logsOf", { name })}
          title={t("docker.logsInTerminal")}
          onClick={() => requestTerminal({ label: name, command: logsCommand(container) })}
        >
          ≡
        </button>
      </div>
    </li>
  );
}
