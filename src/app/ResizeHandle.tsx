import { type KeyboardEvent, type PointerEvent, useRef } from "react";

type ResizeHandleProps = {
  label: string;
  orientation: "vertical" | "horizontal";
  size: number;
  min: number;
  max: number;
  grow: 1 | -1;
  onPreview: (size: number) => void;
  onCommit: (size: number) => void;
  onReset: () => void;
};

const KEY_STEP = 16;

export function ResizeHandle({
  label,
  orientation,
  size,
  min,
  max,
  grow,
  onPreview,
  onCommit,
  onReset,
}: ResizeHandleProps) {
  const start = useRef<{ pointer: number; size: number } | null>(null);
  const position = (event: PointerEvent) =>
    orientation === "vertical" ? event.clientX : event.clientY;

  const handleMove = (event: PointerEvent) => {
    if (!start.current) {
      return;
    }
    onPreview(start.current.size + (position(event) - start.current.pointer) * grow);
  };

  const handleUp = (event: PointerEvent) => {
    if (!start.current) {
      return;
    }
    const next = start.current.size + (position(event) - start.current.pointer) * grow;
    start.current = null;
    onCommit(next);
  };

  const handleKey = (event: KeyboardEvent) => {
    const keys =
      orientation === "vertical" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
    const direction = keys.indexOf(event.key);
    if (direction === -1) {
      return;
    }
    event.preventDefault();
    const sign = (direction === 1 ? 1 : -1) * grow;
    onCommit(size + sign * KEY_STEP);
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: an <hr> cannot be focused and dragged
    <div
      className={`resize-handle resize-handle--${orientation}`}
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={orientation}
      aria-valuenow={size}
      aria-valuemin={min}
      aria-valuemax={max}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        start.current = { pointer: position(event), size };
      }}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onDoubleClick={onReset}
      onKeyDown={handleKey}
    />
  );
}
