import { useEffect } from "react";
import type { DockerContainer } from "../../lib/types";
import { ContainerRow } from "./ContainerRow";
import { dockerNotice, splitByState } from "./containers";
import { useDockerStore } from "./useDockerStore";
import "./Docker.css";

export const REFRESH_INTERVAL_MS = 5000;

type Props = { visible: boolean };

function Group({ title, containers }: { title: string; containers: DockerContainer[] }) {
  return (
    <section className="docker__group" aria-label={`${title} containers`}>
      <h3 className="docker__heading">
        {title} · {containers.length}
      </h3>
      <ul className="docker__list">
        {containers.map((container) => (
          <ContainerRow key={container.id} container={container} />
        ))}
      </ul>
    </section>
  );
}

export function DockerPanel({ visible }: Props) {
  const containers = useDockerStore((state) => state.containers);
  const error = useDockerStore((state) => state.error);
  const loaded = useDockerStore((state) => state.loaded);
  const refresh = useDockerStore((state) => state.refresh);

  useEffect(() => {
    if (!visible) {
      return;
    }
    refresh();
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [visible, refresh]);

  const { active, inactive } = splitByState(containers);

  return (
    <div className="docker">
      <header className="docker__header">
        <h2 className="docker__title">Docker</h2>
        <button
          type="button"
          className="docker__refresh"
          aria-label="Refresh containers"
          title="Refresh"
          onClick={() => refresh()}
        >
          ↻
        </button>
      </header>
      {error && (
        <p className="docker__notice" role="status">
          {dockerNotice(error)}
        </p>
      )}
      {loaded && !error && containers.length === 0 && (
        <p className="docker__notice">No containers yet.</p>
      )}
      {active.length > 0 && <Group title="Running" containers={active} />}
      {inactive.length > 0 && <Group title="Stopped" containers={inactive} />}
    </div>
  );
}
