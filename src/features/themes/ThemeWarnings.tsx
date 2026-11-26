import { useThemeStore } from "./useThemeStore";

export function ThemeWarnings() {
  const warnings = useThemeStore((state) => state.warnings);
  const dismiss = useThemeStore((state) => state.dismissWarnings);

  if (warnings.length === 0) {
    return null;
  }
  return (
    <div className="theme-warnings panel" role="status">
      <ul>
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
      <button type="button" onClick={dismiss}>
        Dismiss
      </button>
    </div>
  );
}
