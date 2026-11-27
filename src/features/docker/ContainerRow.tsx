import { requestTerminal } from "../../lib/terminalRequests";
import type { DockerContainer } from "../../lib/types";
import { isActive, logsCommand } from "./containers";
import { useDockerStore } from "./useDockerStore";

type Props = { container: DockerContainer };

export function ContainerRow({ container }: Props) {
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
          {pending ? `${pending}ing…` : container.status}
          {container.ports && ` · ${container.ports}`}
        </span>
      </div>
      <div className="docker__actions">
        {active ? (
          <button
            type="button"
            aria-label={`Stop ${name}`}
            title="Stop"
            disabled={Boolean(pending)}
            onClick={() => run(container.id, "stop")}
          >
            ■
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Start ${name}`}
            title="Start"
            disabled={Boolean(pending)}
            onClick={() => run(container.id, "start")}
          >
            ▶
          </button>
        )}
        <button
          type="button"
          aria-label={`Restart ${name}`}
          title="Restart"
          disabled={Boolean(pending) || !active}
          onClick={() => run(container.id, "restart")}
        >
          ↻
        </button>
        <button
          type="button"
          aria-label={`Logs of ${name}`}
          title="Logs in the terminal"
          onClick={() => requestTerminal({ label: name, command: logsCommand(container) })}
        >
          ≡
        </button>
      </div>
    </li>
  );
}
