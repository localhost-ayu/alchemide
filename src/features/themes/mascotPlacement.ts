import type { MascotPosition } from "./theme";

export type Box = { left: number; top: number; width: number; height: number };

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function positionFor(area: Box, mascot: Box, left: number, top: number): MascotPosition {
  const roomX = area.width - mascot.width;
  const roomY = area.height - mascot.height;
  return {
    x: roomX > 0 ? clamp((left - area.left) / roomX) : 0,
    y: roomY > 0 ? clamp((top - area.top) / roomY) : 0,
  };
}

export function isAnimatedFormat(path: string): boolean {
  return /\.(?:gif|webp)$/i.test(path);
}
