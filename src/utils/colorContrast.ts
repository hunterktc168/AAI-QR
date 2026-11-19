const SHORT_HEX_RE = /^#?[0-9a-fA-F]{3}$/;
const FULL_HEX_RE = /^#?[0-9a-fA-F]{6}$/;

function parseHexToRgb(hex: string): readonly [number, number, number] {
  const trimmed = hex.trim();
  let expanded: string;

  if (SHORT_HEX_RE.test(trimmed)) {
    const raw = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
    const r = raw.slice(0, 1);
    const g = raw.slice(1, 2);
    const b = raw.slice(2, 3);
    expanded = `${r}${r}${g}${g}${b}${b}`;
  } else if (FULL_HEX_RE.test(trimmed)) {
    expanded = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  } else {
    throw new RangeError(`Invalid hex color: "${hex}"`);
  }

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);

  return [r, g, b];
}

function linearizeChannel(channel8Bit: number): number {
  const srgb = channel8Bit / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(hex: string): number {
  const [r, g, b] = parseHexToRgb(hex);
  return (
    0.2126 * linearizeChannel(r) +
    0.7152 * linearizeChannel(g) +
    0.0722 * linearizeChannel(b)
  );
}

export function getContrastRatio(fgHex: string, bgHex: string): number {
  const fgLum = getRelativeLuminance(fgHex);
  const bgLum = getRelativeLuminance(bgHex);
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Renamed from `isInverted`. Performs a relative luminance comparison
 * (`fgLuminance > bgLuminance`), not a WCAG contrast threshold check.
 */
export function isDarkOnLight(fgHex: string, bgHex: string): boolean {
  return getRelativeLuminance(fgHex) > getRelativeLuminance(bgHex);
}
