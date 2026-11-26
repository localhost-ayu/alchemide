import { useEffect, useState } from "react";
import { getEnvironment, onWorkspaceChange } from "../../lib/ipc";
import { formatEnvironment } from "./formatEnvironment";

export function EnvironmentBadge() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    const refresh = () => {
      getEnvironment()
        .then((environment) => current && setLabel(formatEnvironment(environment)))
        .catch(() => current && setLabel(null));
    };
    refresh();
    const subscription = onWorkspaceChange(refresh);
    return () => {
      current = false;
      subscription.then((unsubscribe) => unsubscribe());
    };
  }, []);

  if (!label) {
    return null;
  }
  return <span className="environment-badge">{label}</span>;
}
