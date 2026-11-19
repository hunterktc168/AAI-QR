import { describe, expect, it } from 'vitest';
import { getContrastRatio, isDarkOnLight } from '../colorContrast';

describe('colorContrast', () => {
  it('10. returns 21 for #000 vs #fff and 1 for #fff vs #fff', () => {
    expect(getContrastRatio('#000', '#fff')).toBeCloseTo(21, 5);
    expect(getContrastRatio('#fff', '#fff')).toBeCloseTo(1, 5);
  });

  it('11. isDarkOnLight("#000", "#fff") returns false (luminance check)', () => {
    expect(isDarkOnLight('#000', '#fff')).toBe(false);
    expect(isDarkOnLight('#fff', '#000')).toBe(true);
  });

  it('12. accepts 3-digit hex and matches equivalent 6-digit hex', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(
      getContrastRatio('#000', '#fff'),
      10,
    );
    expect(getContrastRatio('#abc', '#123')).toBeCloseTo(
      getContrastRatio('#aabbcc', '#112233'),
      10,
    );
  });

  it('throws RangeError on invalid hex colors', () => {
    expect(() => getContrastRatio('#12', '#fff')).toThrow(RangeError);
    expect(() => getContrastRatio('not-hex', '#fff')).toThrow(RangeError);
  });
});
