import { type PointerEvent, useEffect, useRef } from "react";
import { registerCommands } from "../../lib/commands";
import { setMascotLocked, useMascotLock } from "./mascotLock";
import { isAnimatedFormat, positionFor } from "./mascotPlacement";
import type { MascotPosition, ThemeMascot } from "./theme";
import { useAssetUrl } from "./useAssetUrl";
import { useThemeStore } from "./useThemeStore";

function prefersStill(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function placeMascot(mascot: ThemeMascot, position: MascotPosition | undefined): Promise<void> {
  const { position: _position, ...rest } = mascot;
  return useThemeStore.getState().setCustom({ mascot: position ? { ...rest, position } : rest });
}

function StillFrame({ url, className }: { url: string; className: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
    };
    image.src = url;
  }, [url]);

  return <canvas ref={canvasRef} className={className} />;
}

export function Mascot() {
  const mascot = useThemeStore((state) => state.custom.mascot ?? state.theme.mascot);
  const animations = useThemeStore((state) => state.effects.animations);
  const locked = useMascotLock((state) => state.locked);
  const url = useAssetUrl(mascot?.path ?? null);
  const drag = useRef<{ dx: number; dy: number; position?: MascotPosition } | null>(null);

  useEffect(
    () =>
      registerCommands([
        {
          id: "themes.toggleMascot",
          title: "Show or hide the mascot",
          keys: "Ctrl+Alt+M",
          run: () => {
            const { theme, effects, commit } = useThemeStore.getState();
            commit(theme, { ...effects, mascot: !effects.mascot });
          },
        },
        {
          id: "themes.toggleMascotLock",
          title: "Lock or unlock the mascot to move it",
          run: () => setMascotLocked(!useMascotLock.getState().locked),
        },
      ]),
    [],
  );

  if (!mascot || !url) {
    return null;
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (locked || event.button !== 0) {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    drag.current = { dx: event.clientX - box.left, dy: event.clientY - box.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const area = event.currentTarget.parentElement;
    if (!drag.current || !area) {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    const position = positionFor(
      area.getBoundingClientRect(),
      box,
      event.clientX - drag.current.dx,
      event.clientY - drag.current.dy,
    );
    drag.current.position = position;
    const root = document.documentElement;
    root.dataset.mascotCorner = "free";
    root.style.setProperty("--mascot-x", String(position.x));
    root.style.setProperty("--mascot-y", String(position.y));
  };

  const onPointerUp = () => {
    const position = drag.current?.position;
    drag.current = null;
    if (position) {
      void placeMascot(mascot, position);
    }
  };

  const still = (!animations || prefersStill()) && isAnimatedFormat(mascot.path);
  const handlers = locked
    ? {}
    : {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: onPointerUp,
        onDoubleClick: () => void placeMascot(mascot, undefined),
        title: "Drag to move, double click to return to the corner",
      };

  return (
    <div className="mascot" aria-hidden="true" data-locked={locked} {...handlers}>
      {still ? (
        <StillFrame url={url} className="mascot__image" />
      ) : (
        <img className="mascot__image" src={url} alt="" draggable={false} />
      )}
    </div>
  );
}
