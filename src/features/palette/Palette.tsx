import { type KeyboardEvent, useState } from "react";
import { useDismiss } from "../../lib/dismiss";
import { useKeepInView } from "../../lib/useKeepInView";

export type PaletteItem = {
  id: string;
  label: string;
  detail?: string;
  hint?: string;
};

type PaletteProps = {
  label: string;
  placeholder: string;
  query: string;
  items: PaletteItem[];
  emptyText: string;
  onQueryChange: (query: string) => void;
  onChoose: (item: PaletteItem) => void;
  onClose: () => void;
};

export function Palette({
  label,
  placeholder,
  query,
  items,
  emptyText,
  onQueryChange,
  onChoose,
  onClose,
}: PaletteProps) {
  const [index, setIndex] = useState(0);
  const panelRef = useDismiss(true, onClose);
  const highlighted = items[Math.min(index, items.length - 1)];
  useKeepInView(highlighted && `palette-${highlighted.id}`);

  const handleKeyDown = (event: KeyboardEvent) => {
    const count = Math.max(items.length, 1);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((current) => (current + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((current) => (current - 1 + count) % count);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (highlighted) {
        onChoose(highlighted);
      }
    }
  };

  return (
    <div className="palette__overlay">
      <div ref={panelRef} className="palette panel" role="dialog" aria-label={label}>
        <input
          className="palette__search"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-items"
          aria-activedescendant={highlighted ? `palette-${highlighted.id}` : undefined}
          aria-label={label}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={onClose}
          // biome-ignore lint/a11y/noAutofocus: palettes open from a shortcut and must take focus
          autoFocus
        />
        <div id="palette-items" className="palette__list" role="listbox">
          {items.map((item, position) => (
            <div
              key={item.id}
              id={`palette-${item.id}`}
              role="option"
              tabIndex={-1}
              aria-selected={item === highlighted}
              className="palette__item"
              onMouseEnter={() => setIndex(position)}
              onMouseDown={(event) => {
                event.preventDefault();
                onChoose(item);
              }}
            >
              <span className="palette__label">
                {item.label}
                {item.detail && <span className="palette__detail">{item.detail}</span>}
              </span>
              {item.hint && <kbd className="palette__hint">{item.hint}</kbd>}
            </div>
          ))}
          {items.length === 0 && <p className="palette__empty">{emptyText}</p>}
        </div>
      </div>
    </div>
  );
}
