import { useUpdaterStore } from "./useUpdaterStore";

export function UpdateSettings() {
  const checkOnStart = useUpdaterStore((state) => state.checkOnStart);
  const setCheckOnStart = useUpdaterStore((state) => state.setCheckOnStart);

  return (
    <section className="settings__section">
      <h3>Updates</h3>
      <label className="settings__field">
        <span>Check for updates on start</span>
        <input
          type="checkbox"
          checked={checkOnStart}
          onChange={(event) => setCheckOnStart(event.target.checked)}
        />
      </label>
    </section>
  );
}
