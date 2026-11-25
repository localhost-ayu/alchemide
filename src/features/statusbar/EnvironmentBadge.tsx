import { useEffect, useState } from "react";
import { getEnvironment } from "../../lib/ipc";
import { formatEnvironment } from "./formatEnvironment";

export function EnvironmentBadge() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    getEnvironment()
      .then((environment) => setLabel(formatEnvironment(environment)))
      .catch(() => setLabel(null));
  }, []);

  if (!label) {
    return null;
  }
  return <span className="environment-badge">{label}</span>;
}
