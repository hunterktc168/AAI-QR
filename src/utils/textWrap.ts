import type { TextFontFamily } from '../types/sign';
import { getSystemFontStack } from './qrComposer';

const MM_TO_PX = 96 / 25.4; // 1 mm in CSS pixels at standard 96 DPI
export const WRAP_SAFETY_MARGIN = 0.97; // 3% safety margin to guard against canvas vs SVG subpixel glyph divergence

export type TextMeasureFn = (
  text: string,
  fontSizeMm: number,
  fontFamily: TextFontFamily,
  bold: boolean,
  italic?: boolean,
) => number;

let cachedCanvasCtx: CanvasRenderingContext2D | null = null;

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') {
    return null;
  }
  if (!cachedCanvasCtx) {
    const canvas = document.createElement('canvas');
    cachedCanvasCtx = canvas.getContext('2d');
  }
  return cachedCanvasCtx;
}

/**
 * Measures text width in millimetres.
 * Uses Canvas 2D in the browser, or deterministic character-advance heuristic in Node/Vitest.
 */
export function measureTextWidthMm(
  text: string,
  fontSizeMm: number,
  fontFamily: TextFontFamily,
  bold: boolean,
  italic = false,
  customMeasureFn?: TextMeasureFn,
): number {
  if (text.length === 0) {
    return 0;
  }

  if (customMeasureFn) {
    return customMeasureFn(text, fontSizeMm, fontFamily, bold, italic);
  }

  const ctx = getCanvasContext();
  if (ctx) {
    const fontSizePx = fontSizeMm * MM_TO_PX;
    const fontStack = getSystemFontStack(fontFamily);
    ctx.font = `${italic ? 'italic ' : ''}${bold ? '700' : '400'} ${fontSizePx}px ${fontStack}`;
    const widthPx = ctx.measureText(text).width;
    return widthPx / MM_TO_PX;
  }

  // Fallback heuristic for headless/Node environments
  const boldFactor = bold ? 1.1 : 1.0;
  const italicFactor = italic ? 1.02 : 1.0;
  const ratio =
    fontFamily === 'mono' ? 0.6 : fontFamily === 'serif' ? 0.55 : 0.52;
  return text.length * fontSizeMm * ratio * boldFactor * italicFactor;
}

export interface WrapTextOptions {
  text: string;
  boxWidthMm: number;
  fontSizeMm: number;
  fontFamily: TextFontFamily;
  bold?: boolean;
  italic?: boolean;
  boxHeightMm?: number;
  lineHeight: number;
  shrinkToFit?: boolean;
  minFontSizeMm?: number;
  measureFn?: TextMeasureFn;
}

export interface WrappedTextResult {
  lines: string[];
  fontSizeMm: number;
  totalHeightMm: number;
  lineStepMm: number;
}

function computeLines(
  text: string,
  safeBoxWidthMm: number,
  fontSizeMm: number,
  fontFamily: TextFontFamily,
  bold: boolean,
  italic: boolean,
  measureFn?: TextMeasureFn,
): { lines: string[]; maxLineWidthMm: number } {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];
  let maxLineWidthMm = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (trimmed === '') {
      lines.push('');
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';
    let currentLineWidth = 0;

    for (const word of words) {
      if (currentLine === '') {
        const wordWidth = measureTextWidthMm(
          word,
          fontSizeMm,
          fontFamily,
          bold,
          italic,
          measureFn,
        );
        currentLine = word;
        currentLineWidth = wordWidth;
      } else {
        const candidate = `${currentLine} ${word}`;
        const candidateWidth = measureTextWidthMm(
          candidate,
          fontSizeMm,
          fontFamily,
          bold,
          italic,
          measureFn,
        );

        if (candidateWidth <= safeBoxWidthMm) {
          currentLine = candidate;
          currentLineWidth = candidateWidth;
        } else {
          lines.push(currentLine);
          if (currentLineWidth > maxLineWidthMm) {
            maxLineWidthMm = currentLineWidth;
          }
          currentLine = word;
          currentLineWidth = measureTextWidthMm(
            word,
            fontSizeMm,
            fontFamily,
            bold,
            italic,
            measureFn,
          );
        }
      }
    }

    if (currentLine !== '') {
      lines.push(currentLine);
      if (currentLineWidth > maxLineWidthMm) {
        maxLineWidthMm = currentLineWidth;
      }
    }
  }

  return { lines, maxLineWidthMm };
}

export interface TextVerticalMetrics {
  readonly lineStepMm: number;
  readonly totalHeightMm: number;
}

/**
 * Single shared calculation for vertical line step and total text block height.
 * Both `wrapTextLines` (`totalHeightMm`) and SVG `<tspan>` line positioning (`lineStepMm`)
 * read `lineHeight` exclusively through this function.
 */
export function computeTextVerticalMetrics(
  fontSizeMm: number,
  lineHeight: number,
  lineCount: number,
): TextVerticalMetrics {
  const lineStepMm = fontSizeMm * lineHeight;
  const totalHeightMm = lineCount * lineStepMm;
  return { lineStepMm, totalHeightMm };
}

/**
 * Breaks text into lines wrapped within boxWidthMm (applying a 3% safety margin).
 * If shrinkToFit is enabled, iteratively scales fontSizeMm down so that
 * the text fits both boxWidthMm and boxHeightMm.
 */
export function wrapTextLines(options: WrapTextOptions): WrappedTextResult {
  const {
    text,
    boxWidthMm,
    fontSizeMm: initialFontSizeMm,
    fontFamily,
    bold = false,
    italic = false,
    boxHeightMm,
    lineHeight,
    shrinkToFit = false,
    minFontSizeMm = 1.5,
    measureFn,
  } = options;

  // 3% wrap safety margin
  const safeBoxWidthMm = boxWidthMm * WRAP_SAFETY_MARGIN;

  let currentFontSizeMm = Math.max(minFontSizeMm, initialFontSizeMm);
  const step = 0.95;

  if (shrinkToFit) {
    while (currentFontSizeMm > minFontSizeMm) {
      const { lines, maxLineWidthMm } = computeLines(
        text,
        safeBoxWidthMm,
        currentFontSizeMm,
        fontFamily,
        bold,
        italic,
        measureFn,
      );

      const { lineStepMm, totalHeightMm } = computeTextVerticalMetrics(
        currentFontSizeMm,
        lineHeight,
        lines.length,
      );

      const fitsWidth = maxLineWidthMm <= safeBoxWidthMm + 0.01;
      const fitsHeight =
        boxHeightMm === undefined || totalHeightMm <= boxHeightMm + 0.01;

      if (fitsWidth && fitsHeight) {
        return {
          lines,
          fontSizeMm: currentFontSizeMm,
          totalHeightMm,
          lineStepMm,
        };
      }

      currentFontSizeMm *= step;
    }
    currentFontSizeMm = minFontSizeMm;
  }

  const { lines } = computeLines(
    text,
    safeBoxWidthMm,
    currentFontSizeMm,
    fontFamily,
    bold,
    italic,
    measureFn,
  );

  const { lineStepMm, totalHeightMm } = computeTextVerticalMetrics(
    currentFontSizeMm,
    lineHeight,
    lines.length,
  );

  return {
    lines,
    fontSizeMm: currentFontSizeMm,
    totalHeightMm,
    lineStepMm,
  };
}
