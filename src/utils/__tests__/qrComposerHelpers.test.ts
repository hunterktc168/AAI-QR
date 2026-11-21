import { describe, expect, it } from 'vitest';
import {
  dotForCornerStyle,
  escapeXmlText,
  getSystemFontStack,
  LABEL_MAX_CHARS,
  squareForCornerStyle,
  SUBLABEL_MAX_CHARS,
  truncateWordBoundary,
} from '../qrComposer';
import { formatExportFilename } from '../qrExporter';

describe('qrComposer & qrExporter pure helpers', () => {
  it('maps corner styles to locked qr-code-styling square and dot types', () => {
    expect(squareForCornerStyle('square')).toBe('square');
    expect(dotForCornerStyle('square')).toBe('square');

    expect(squareForCornerStyle('dot')).toBe('dot');
    expect(dotForCornerStyle('dot')).toBe('dot');

    expect(squareForCornerStyle('extra-rounded')).toBe('extra-rounded');
    expect(dotForCornerStyle('extra-rounded')).toBe('dot');
  });

  it('returns OS-native system font stacks', () => {
    expect(getSystemFontStack('sans')).toBe('ui-sans-serif, system-ui, sans-serif');
    expect(getSystemFontStack('serif')).toBe('ui-serif, Georgia, serif');
    expect(getSystemFontStack('mono')).toBe('ui-monospace, SFMono-Regular, monospace');
  });

  it('truncates label and sublabel cleanly on word boundaries', () => {
    const shortLabel = 'SCAN FOR MENU';
    expect(truncateWordBoundary(shortLabel, LABEL_MAX_CHARS)).toBe('SCAN FOR MENU');

    const longLabel = 'SCAN HERE FOR FULL RESTAURANT DINING MENU';
    const truncatedLabel = truncateWordBoundary(longLabel, LABEL_MAX_CHARS);
    expect(truncatedLabel.length).toBeLessThanOrEqual(LABEL_MAX_CHARS);
    expect(truncatedLabel.endsWith('…')).toBe(true);
    expect(truncatedLabel).toBe('SCAN HERE FOR FULL…');

    const longSublabel =
      'Scan this QR code with your phone camera to view all seasonal specials today';
    const truncatedSublabel = truncateWordBoundary(longSublabel, SUBLABEL_MAX_CHARS);
    expect(truncatedSublabel.length).toBeLessThanOrEqual(SUBLABEL_MAX_CHARS);
    expect(truncatedSublabel.endsWith('…')).toBe(true);
  });

  it('escapes &, <, >, ", and \' entities', () => {
    expect(escapeXmlText(`A & B <tag> "q" 's'`)).toBe(
      'A &amp; B &lt;tag&gt; &quot;q&quot; &#39;s&#39;',
    );
  });

  it('formats export filenames as qr-{category}-{YYYYMMDD-HHmmss}.{ext}', () => {
    const sampleDate = new Date(2026, 10, 19, 9, 5, 7);
    expect(formatExportFilename('wifi', 'png', sampleDate)).toBe(
      'qr-wifi-20261119-090507.png',
    );
    expect(formatExportFilename('vcard', 'jpg', sampleDate)).toBe(
      'qr-vcard-20261119-090507.jpg',
    );
    expect(formatExportFilename('url', 'svg', sampleDate)).toBe(
      'qr-url-20261119-090507.svg',
    );
  });
});
