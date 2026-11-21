import { describe, expect, it } from 'vitest';
import { computeTextSizes } from '../qrComposer';

describe('computeTextSizes', () => {
  it('scales monotonically sm < md < lg at any width', () => {
    for (const w of [256, 512, 1024, 2048]) {
      const sm = computeTextSizes(w, 'sm');
      const md = computeTextSizes(w, 'md');
      const lg = computeTextSizes(w, 'lg');
      expect(md.label).toBeGreaterThan(sm.label);
      expect(lg.label).toBeGreaterThan(md.label);
      expect(md.sublabel).toBeGreaterThan(sm.sublabel);
      expect(lg.sublabel).toBeGreaterThan(md.sublabel);
    }
  });

  it('produces integer pixel sizes', () => {
    const sizes = computeTextSizes(512, 'md');
    expect(Number.isInteger(sizes.label)).toBe(true);
    expect(Number.isInteger(sizes.sublabel)).toBe(true);
  });
});
