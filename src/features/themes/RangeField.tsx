type RangeFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
};

export function RangeField({ label, value, min, max, step, format, onChange }: RangeFieldProps) {
  return (
    <label className="theme-editor__range">
      <span>{label}</span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output className="theme-editor__hex">{format(value)}</output>
    </label>
  );
}
