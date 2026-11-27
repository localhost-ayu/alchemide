export const AA_CONTRAST = 4.5;

function fullHex(hex: string): string {
  if (hex.length === 4 || hex.length === 5) {
    return `#${[...hex.slice(1)].map((digit) => digit + digit).join("")}`;
  }
  return hex;
}

export function toColorInput(hex: string): string {
  return fullHex(hex).slice(0, 7).toLowerCase();
}

export function fromColorInput(picked: string, previous: string): string {
  const alpha = fullHex(previous).slice(7);
  return `${picked.toLowerCase()}${alpha}`;
}

function luminance(hex: string): number {
  const color = toColorInput(hex);
  const channels = [1, 3, 5].map(
    (start) => Number.parseInt(color.slice(start, start + 2), 16) / 255,
  );
  const [r = 0, g = 0, b = 0] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [light = 0, dark = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
