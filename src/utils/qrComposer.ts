import QRCodeStyling, {
  type CornerDotType,
  type CornerSquareType,
  type Options,
} from 'qr-code-styling';
import type {
  CornerStyle,
  QRFrameConfig,
  QRProjectState,
  TextSize,
} from '../types/qr';
import { serializePayload } from './qrSerializer';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

export const LABEL_MAX_CHARS = 28;
export const SUBLABEL_MAX_CHARS = 44;

export const SYSTEM_FONT_NOTE =
  "Fonts use your operating system's default stacks. Recipients on other platforms may see slightly different typography.";

export function computeTextSizes(
  targetWidth: number,
  textSize: TextSize,
): { label: number; sublabel: number } {
  const labelPct = { sm: 0.04, md: 0.055, lg: 0.075 }[textSize];
  const sublabelPct = { sm: 0.025, md: 0.035, lg: 0.045 }[textSize];
  return {
    label: Math.round(targetWidth * labelPct),
    sublabel: Math.round(targetWidth * sublabelPct),
  };
}

export function getSystemFontStack(fontFamily: QRFrameConfig['fontFamily']): string {
  switch (fontFamily) {
    case 'serif':
      return 'ui-serif, Georgia, serif';
    case 'mono':
      return 'ui-monospace, SFMono-Regular, monospace';
    case 'sans':
    default:
      return 'ui-sans-serif, system-ui, sans-serif';
  }
}

export function squareForCornerStyle(cornerStyle: CornerStyle): CornerSquareType {
  switch (cornerStyle) {
    case 'square':
      return 'square';
    case 'dot':
      return 'dot';
    case 'extra-rounded':
      return 'extra-rounded';
  }
}

export function dotForCornerStyle(cornerStyle: CornerStyle): CornerDotType {
  switch (cornerStyle) {
    case 'square':
      return 'square';
    case 'dot':
      return 'dot';
    case 'extra-rounded':
      return 'dot';
  }
}

export function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function truncateWordBoundary(raw: string, maxChars: number): string {
  const trimmed = raw.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  if (maxChars <= 1) {
    return trimmed.slice(0, Math.max(0, maxChars));
  }

  const budget = maxChars - 1;
  const sliced = trimmed.slice(0, budget);
  const lastSpace = sliced.lastIndexOf(' ');

  if (lastSpace >= Math.floor(budget * 0.5)) {
    return `${sliced.slice(0, lastSpace).trimEnd()}…`;
  }

  return `${sliced.trimEnd()}…`;
}

function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string,
  bold: boolean,
): number {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${bold ? '700' : '500'} ${fontSize}px ${fontFamily}`;
      return ctx.measureText(text).width;
    }
  }
  return text.length * fontSize * (bold ? 0.64 : 0.56);
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

function createPlaceholderSvg(targetWidth: number, fontStack: string): SVGSVGElement {
  const svg = createSvgElement('svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', `0 0 ${targetWidth} ${targetWidth}`);
  svg.setAttribute('width', String(targetWidth));
  svg.setAttribute('height', String(targetWidth));

  const inset = Math.max(2, Math.round(targetWidth * 0.015));
  const rect = createSvgElement('rect');
  rect.setAttribute('x', String(inset));
  rect.setAttribute('y', String(inset));
  rect.setAttribute('width', String(targetWidth - inset * 2));
  rect.setAttribute('height', String(targetWidth - inset * 2));
  rect.setAttribute('rx', String(Math.round(targetWidth * 0.04)));
  rect.setAttribute('fill', '#111827');
  rect.setAttribute('stroke', '#334155');
  rect.setAttribute('stroke-width', String(Math.max(1.5, Math.round(targetWidth * 0.005))));
  rect.setAttribute('stroke-dasharray', `${Math.round(targetWidth * 0.025)} ${Math.round(targetWidth * 0.018)}`);
  svg.appendChild(rect);

  const fontSize = Math.max(12, Math.round(targetWidth * 0.045));
  const textEl = createSvgElement('text');
  textEl.setAttribute('x', String(targetWidth / 2));
  textEl.setAttribute('y', String(targetWidth / 2));
  textEl.setAttribute('text-anchor', 'middle');
  textEl.setAttribute('dominant-baseline', 'central');
  textEl.setAttribute('fill', '#94A3B8');
  textEl.setAttribute('font-family', fontStack);
  textEl.setAttribute('font-size', String(fontSize));
  textEl.setAttribute('font-weight', '500');
  textEl.textContent = 'Enter content to generate QR';

  const maxTextWidth = Math.round(targetWidth * 0.8);
  if (measureTextWidth('Enter content to generate QR', fontSize, fontStack, false) > maxTextWidth) {
    textEl.setAttribute('textLength', String(maxTextWidth));
    textEl.setAttribute('lengthAdjust', 'spacingAndGlyphs');
  }

  svg.appendChild(textEl);
  return svg;
}

function appendSvgText(
  parent: SVGSVGElement,
  options: {
    rawText: string;
    maxChars: number;
    x: number;
    y: number;
    availableWidth: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    bold: boolean;
    opacity?: number;
  },
): void {
  const truncated = truncateWordBoundary(options.rawText, options.maxChars);
  if (truncated === '') {
    return;
  }

  const textEl = createSvgElement('text');
  textEl.setAttribute('x', String(options.x));
  textEl.setAttribute('y', String(options.y));
  textEl.setAttribute('text-anchor', 'middle');
  textEl.setAttribute('dominant-baseline', 'central');
  textEl.setAttribute('fill', options.color);
  textEl.setAttribute('font-family', options.fontFamily);
  textEl.setAttribute('font-size', String(options.fontSize));
  textEl.setAttribute('font-weight', options.bold ? '700' : '500');
  if (options.opacity !== undefined) {
    textEl.setAttribute('opacity', String(options.opacity));
  }

  // XMLSerializer escapes &, <, > in text nodes automatically; keep literal text readable
  // while exposing escapeXmlText for string-serialized SVG/HTML contexts.
  textEl.textContent = truncated;

  const renderedWidth = measureTextWidth(
    truncated,
    options.fontSize,
    options.fontFamily,
    options.bold,
  );
  if (renderedWidth > options.availableWidth) {
    textEl.setAttribute('textLength', String(options.availableWidth));
    textEl.setAttribute('lengthAdjust', 'spacingAndGlyphs');
  }

  parent.appendChild(textEl);
}

interface FrameLayout {
  qrSize: number;
  qrX: number;
  qrY: number;
  cornerRadius: number;
}

function computeFrameLayout(
  template: QRFrameConfig['template'],
  targetWidth: number,
  hasLabel: boolean,
  hasSublabel: boolean,
): FrameLayout {
  switch (template) {
    case 'none': {
      const margin = Math.max(8, Math.round(targetWidth * 0.025));
      const qrSize = Math.max(64, targetWidth - margin * 2);
      return {
        qrSize,
        qrX: Math.round((targetWidth - qrSize) / 2),
        qrY: Math.round((targetWidth - qrSize) / 2),
        cornerRadius: 0,
      };
    }
    case 'bottom-banner': {
      const bannerHeight = Math.round(targetWidth * 0.22);
      const upperHeight = targetWidth - bannerHeight;
      const pad = Math.round(targetWidth * 0.045);
      const qrSize = Math.max(64, Math.min(targetWidth - pad * 2, upperHeight - pad * 2));
      return {
        qrSize,
        qrX: Math.round((targetWidth - qrSize) / 2),
        qrY: Math.round((upperHeight - qrSize) / 2),
        cornerRadius: Math.round(targetWidth * 0.04),
      };
    }
    case 'top-badge': {
      const badgeHeight = Math.round(targetWidth * 0.15);
      const footerHeight = hasSublabel
        ? Math.round(targetWidth * 0.12)
        : Math.round(targetWidth * 0.05);
      const pad = Math.round(targetWidth * 0.045);
      const vMargin = Math.round(targetWidth * 0.025);
      const availableHeight = targetWidth - badgeHeight - footerHeight;
      const qrSize = Math.max(
        64,
        Math.min(targetWidth - pad * 2, availableHeight - vMargin * 2),
      );
      return {
        qrSize,
        qrX: Math.round((targetWidth - qrSize) / 2),
        qrY: badgeHeight + Math.round((availableHeight - qrSize) / 2),
        cornerRadius: Math.round(targetWidth * 0.04),
      };
    }
    case 'card-border': {
      const sidePad = Math.round(targetWidth * 0.07);
      const topZone = hasLabel ? Math.round(targetWidth * 0.13) : sidePad;
      const bottomZone = hasSublabel ? Math.round(targetWidth * 0.11) : sidePad;
      const vMargin = Math.round(targetWidth * 0.025);
      const availableHeight = targetWidth - topZone - bottomZone;
      const qrSize = Math.max(
        64,
        Math.min(targetWidth - sidePad * 2, availableHeight - vMargin * 2),
      );
      return {
        qrSize,
        qrX: Math.round((targetWidth - qrSize) / 2),
        qrY: topZone + Math.round((availableHeight - qrSize) / 2),
        cornerRadius: Math.round(targetWidth * 0.04),
      };
    }
  }
}

export async function composeQRSvg(
  state: QRProjectState,
  targetWidth: number,
): Promise<SVGSVGElement> {
  const safeWidth = Math.max(64, Math.round(targetWidth));
  const fontStack = getSystemFontStack(state.frame.fontFamily);
  const serialized = serializePayload(state.payload);

  if (serialized === '') {
    return createPlaceholderSvg(safeWidth, fontStack);
  }

  const hasLabel = state.frame.label.trim() !== '';
  const hasSublabel = state.frame.sublabel.trim() !== '';
  const layout = computeFrameLayout(
    state.frame.template,
    safeWidth,
    hasLabel,
    hasSublabel,
  );

  const options: Partial<Options> = {
    type: 'svg',
    width: layout.qrSize,
    height: layout.qrSize,
    data: serialized,
    margin: 4,
    ...(state.style.logoDataUrl !== null ? { image: state.style.logoDataUrl } : {}),
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.35,
      margin: 6,
      crossOrigin: 'anonymous',
    },
    qrOptions: {
      errorCorrectionLevel: state.style.errorCorrection,
    },
    dotsOptions: {
      color: state.style.fgColor,
      type: state.style.dotStyle,
    },
    backgroundOptions: {
      color: state.style.bgColor,
    },
    cornersSquareOptions: {
      color: state.style.fgColor,
      type: squareForCornerStyle(state.style.cornerStyle),
    },
    cornersDotOptions: {
      color: state.style.fgColor,
      type: dotForCornerStyle(state.style.cornerStyle),
    },
  };

  const hiddenDiv = document.createElement('div');
  hiddenDiv.style.cssText =
    'position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;';
  document.body.appendChild(hiddenDiv);

  let qrSvg: SVGSVGElement | null = null;
  try {
    const qr = new QRCodeStyling(options);
    await qr.append(hiddenDiv);
    if (qr._svgDrawingPromise) {
      await qr._svgDrawingPromise;
    }
    qrSvg = hiddenDiv.querySelector('svg');
    if (!qrSvg) {
      throw new Error('QRCodeStyling did not produce an SVG element.');
    }
    qrSvg.remove();
  } finally {
    hiddenDiv.remove();
  }

  const masterSvg = createSvgElement('svg');
  masterSvg.setAttribute('xmlns', SVG_NS);
  masterSvg.setAttribute('xmlns:xlink', XLINK_NS);
  masterSvg.setAttribute('viewBox', `0 0 ${safeWidth} ${safeWidth}`);
  masterSvg.setAttribute('width', String(safeWidth));
  masterSvg.setAttribute('height', String(safeWidth));

  const rootBgColor =
    state.frame.template === 'none'
      ? state.style.bgColor
      : state.frame.frameBgColor;

  const bgRect = createSvgElement('rect');
  bgRect.setAttribute('x', '0');
  bgRect.setAttribute('y', '0');
  bgRect.setAttribute('width', String(safeWidth));
  bgRect.setAttribute('height', String(safeWidth));
  if (layout.cornerRadius > 0) {
    bgRect.setAttribute('rx', String(layout.cornerRadius));
    bgRect.setAttribute('ry', String(layout.cornerRadius));
  }
  bgRect.setAttribute('fill', rootBgColor);
  masterSvg.appendChild(bgRect);

  if (state.frame.template === 'card-border') {
    const strokeWidth = Math.max(3, Math.round(safeWidth * 0.008));
    const inset = strokeWidth / 2;
    const borderRect = createSvgElement('rect');
    borderRect.setAttribute('x', String(inset));
    borderRect.setAttribute('y', String(inset));
    borderRect.setAttribute('width', String(safeWidth - strokeWidth));
    borderRect.setAttribute('height', String(safeWidth - strokeWidth));
    borderRect.setAttribute('rx', String(Math.max(0, layout.cornerRadius - inset)));
    borderRect.setAttribute('fill', 'none');
    borderRect.setAttribute('stroke', state.frame.textColor);
    borderRect.setAttribute('stroke-opacity', '0.35');
    borderRect.setAttribute('stroke-width', String(strokeWidth));
    masterSvg.appendChild(borderRect);
  }

  if (state.frame.template !== 'none') {
    const qrSurface = createSvgElement('rect');
    const surfacePad = Math.max(4, Math.round(safeWidth * 0.015));
    qrSurface.setAttribute('x', String(layout.qrX - surfacePad));
    qrSurface.setAttribute('y', String(layout.qrY - surfacePad));
    qrSurface.setAttribute('width', String(layout.qrSize + surfacePad * 2));
    qrSurface.setAttribute('height', String(layout.qrSize + surfacePad * 2));
    qrSurface.setAttribute('rx', String(Math.round(safeWidth * 0.02)));
    qrSurface.setAttribute('fill', state.style.bgColor);
    masterSvg.appendChild(qrSurface);
  }

  qrSvg.setAttribute('x', String(layout.qrX));
  qrSvg.setAttribute('y', String(layout.qrY));
  qrSvg.setAttribute('width', String(layout.qrSize));
  qrSvg.setAttribute('height', String(layout.qrSize));
  qrSvg.setAttribute('viewBox', `0 0 ${layout.qrSize} ${layout.qrSize}`);
  masterSvg.appendChild(qrSvg);

  const availableTextWidth = Math.round(safeWidth * 0.84);
  const textSizes = computeTextSizes(safeWidth, state.frame.textSize);
  const labelFontSize = textSizes.label;
  const sublabelFontSize = textSizes.sublabel;

  if (state.frame.template === 'bottom-banner') {
    const bannerHeight = Math.round(safeWidth * 0.22);
    const bannerY = safeWidth - bannerHeight;

    const bannerRect = createSvgElement('rect');
    bannerRect.setAttribute('x', '0');
    bannerRect.setAttribute('y', String(bannerY));
    bannerRect.setAttribute('width', String(safeWidth));
    bannerRect.setAttribute('height', String(bannerHeight));
    bannerRect.setAttribute('rx', String(layout.cornerRadius));
    bannerRect.setAttribute('fill', state.frame.frameBgColor);
    masterSvg.appendChild(bannerRect);

    // Square off the top seam of the rounded bottom banner so corners stay crisp at the bottom only
    const seamFiller = createSvgElement('rect');
    seamFiller.setAttribute('x', '0');
    seamFiller.setAttribute('y', String(bannerY));
    seamFiller.setAttribute('width', String(safeWidth));
    seamFiller.setAttribute('height', String(Math.min(bannerHeight / 2, layout.cornerRadius)));
    seamFiller.setAttribute('fill', state.frame.frameBgColor);
    masterSvg.appendChild(seamFiller);

    if (hasLabel && hasSublabel) {
      appendSvgText(masterSvg, {
        rawText: state.frame.label,
        maxChars: LABEL_MAX_CHARS,
        x: safeWidth / 2,
        y: bannerY + bannerHeight * 0.36,
        availableWidth: availableTextWidth,
        fontSize: labelFontSize,
        fontFamily: fontStack,
        color: state.frame.textColor,
        bold: true,
      });
      appendSvgText(masterSvg, {
        rawText: state.frame.sublabel,
        maxChars: SUBLABEL_MAX_CHARS,
        x: safeWidth / 2,
        y: bannerY + bannerHeight * 0.72,
        availableWidth: availableTextWidth,
        fontSize: sublabelFontSize,
        fontFamily: fontStack,
        color: state.frame.textColor,
        bold: false,
        opacity: 0.82,
      });
    } else if (hasLabel) {
      appendSvgText(masterSvg, {
        rawText: state.frame.label,
        maxChars: LABEL_MAX_CHARS,
        x: safeWidth / 2,
        y: bannerY + bannerHeight * 0.5,
        availableWidth: availableTextWidth,
        fontSize: labelFontSize,
        fontFamily: fontStack,
        color: state.frame.textColor,
        bold: true,
      });
    } else if (hasSublabel) {
      appendSvgText(masterSvg, {
        rawText: state.frame.sublabel,
        maxChars: SUBLABEL_MAX_CHARS,
        x: safeWidth / 2,
        y: bannerY + bannerHeight * 0.5,
        availableWidth: availableTextWidth,
        fontSize: sublabelFontSize,
        fontFamily: fontStack,
        color: state.frame.textColor,
        bold: false,
        opacity: 0.82,
      });
    }
  } else if (state.frame.template === 'top-badge') {
    const badgeHeight = Math.round(safeWidth * 0.15);

    const badgeRect = createSvgElement('rect');
    badgeRect.setAttribute('x', '0');
    badgeRect.setAttribute('y', '0');
    badgeRect.setAttribute('width', String(safeWidth));
    badgeRect.setAttribute('height', String(badgeHeight));
    badgeRect.setAttribute('rx', String(layout.cornerRadius));
    badgeRect.setAttribute('fill', state.frame.frameBgColor);
    masterSvg.appendChild(badgeRect);

    const seamFiller = createSvgElement('rect');
    seamFiller.setAttribute('x', '0');
    seamFiller.setAttribute('y', String(badgeHeight - Math.min(badgeHeight / 2, layout.cornerRadius)));
    seamFiller.setAttribute('width', String(safeWidth));
    seamFiller.setAttribute('height', String(Math.min(badgeHeight / 2, layout.cornerRadius)));
    seamFiller.setAttribute('fill', state.frame.frameBgColor);
    masterSvg.appendChild(seamFiller);

    if (hasLabel) {
      appendSvgText(masterSvg, {
        rawText: state.frame.label,
        maxChars: LABEL_MAX_CHARS,
        x: safeWidth / 2,
        y: badgeHeight * 0.52,
        availableWidth: availableTextWidth,
        fontSize: labelFontSize,
        fontFamily: fontStack,
        color: state.frame.textColor,
        bold: true,
      });
    }

    if (hasSublabel) {
      const footerHeight = Math.round(safeWidth * 0.12);
      appendSvgText(masterSvg, {
        rawText: state.frame.sublabel,
        maxChars: SUBLABEL_MAX_CHARS,
        x: safeWidth / 2,
        y: safeWidth - footerHeight * 0.5,
        availableWidth: availableTextWidth,
        fontSize: sublabelFontSize,
        fontFamily: fontStack,
        color: state.frame.textColor,
        bold: false,
        opacity: 0.85,
      });
    }
  } else if (state.frame.template === 'card-border') {
    if (hasLabel) {
      const topZone = Math.round(safeWidth * 0.13);
      appendSvgText(masterSvg, {
        rawText: state.frame.label,
        maxChars: LABEL_MAX_CHARS,
        x: safeWidth / 2,
        y: topZone * 0.55,
        availableWidth: availableTextWidth,
        fontSize: labelFontSize,
        fontFamily: fontStack,
        color: state.frame.textColor,
        bold: true,
      });
    }

    if (hasSublabel) {
      const bottomZone = Math.round(safeWidth * 0.11);
      appendSvgText(masterSvg, {
        rawText: state.frame.sublabel,
        maxChars: SUBLABEL_MAX_CHARS,
        x: safeWidth / 2,
        y: safeWidth - bottomZone * 0.48,
        availableWidth: availableTextWidth,
        fontSize: sublabelFontSize,
        fontFamily: fontStack,
        color: state.frame.textColor,
        bold: false,
        opacity: 0.85,
      });
    }
  }

  return masterSvg;
}
