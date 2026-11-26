import { useActivityStore } from "../../lib/activityStore";
import { FlaskSpinner } from "./FlaskSpinner";

export function ActivityIndicator() {
  const busy = useActivityStore((state) => state.busy > 0);
  const message = useActivityStore((state) => state.message);

  return (
    <span className="activity" role="status">
      {busy && <FlaskSpinner />}
      {message && (
        <span key={message.id} className="activity__message">
          {message.text}
        </span>
      )}
    </span>
  );
}
