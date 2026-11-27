import { AA_CONTRAST, contrast, fromColorInput, toColorInput } from "./colors";

type ColorFieldProps = {
  label: string;
  value: string;
  background?: string;
  onChange: (value: string) => void;
};

export function ColorField({ label, value, background, onChange }: ColorFieldProps) {
  const ratio = background ? contrast(value, background) : null;
  const isLow = ratio !== null && ratio < AA_CONTRAST;

  return (
    <label className="theme-editor__color">
      <input
        type="color"
        aria-label={label}
        value={toColorInput(value)}
        onChange={(event) => onChange(fromColorInput(event.target.value, value))}
      />
      <span className="theme-editor__color-label">{label}</span>
      <code className="theme-editor__hex">{value}</code>
      {ratio !== null && (
        <span
          className="theme-editor__contrast"
          data-low={isLow}
          title={isLow ? "Below the WCAG AA contrast of 4.5:1 on the background" : undefined}
        >
          {ratio.toFixed(1)}:1
        </span>
      )}
    </label>
  );
}
