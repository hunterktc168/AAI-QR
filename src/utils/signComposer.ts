import QRCodeStyling, { type Options } from 'qr-code-styling';
import type {
  ImageElement,
  PageDimensions,
  QRElement,
  ShapeElement,
  SignDocument,
  SignElement,
  TextElement,
} from '../types/sign';
import { getPageDimensions } from '../types/sign';
import {
  dotForCornerStyle,
  getSystemFontStack,
  squareForCornerStyle,
} from './qrComposer';
import { serializePayload } from './qrSerializer';
import { type TextMeasureFn, wrapTextLines } from './textWrap';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

/**
 * Minimal SVG DOM Element shim for headless / Node test execution.
 */
class HeadlessSvgElement {
  readonly tagName: string;
  readonly namespaceURI = SVG_NS;
  readonly attributes: Record<string, string> = {};
  readonly children: HeadlessSvgElement[] = [];
  textContent = '';

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  setAttribute(name: string, value: string): void {
    this.attributes[name] = value;
  }

  setAttributeNS(_ns: string | null, name: string, value: string): void {
    this.attributes[name] = value;
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] ?? null;
  }

  getAttributeNS(_ns: string | null, name: string): string | null {
    return this.attributes[name] ?? null;
  }

  appendChild<T extends HeadlessSvgElement>(child: T): T {
    this.children.push(child);
    return child;
  }

  insertBefore<T extends HeadlessSvgElement>(
    newChild: T,
    refChild: HeadlessSvgElement | null,
  ): T {
    if (!refChild) {
      this.children.push(newChild);
    } else {
      const idx = this.children.indexOf(refChild);
      if (idx !== -1) {
        this.children.splice(idx, 0, newChild);
      } else {
        this.children.push(newChild);
      }
    }
    return newChild;
  }

  get firstChild(): HeadlessSvgElement | null {
    return this.children[0] ?? null;
  }

  removeChild<T extends HeadlessSvgElement>(child: T): T {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
    }
    return child;
  }

  remove(): void {
    // no-op in headless
  }

  querySelector(selector: string): HeadlessSvgElement | null {
    const tag = selector.toLowerCase();
    for (const child of this.children) {
      if (child.tagName.toLowerCase() === tag) {
        return child;
      }
      const nested = child.querySelector(selector);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  querySelectorAll(selector: string): HeadlessSvgElement[] {
    const tag = selector.toLowerCase();
    const results: HeadlessSvgElement[] = [];
    for (const child of this.children) {
      if (child.tagName.toLowerCase() === tag) {
        results.push(child);
      }
      results.push(...child.querySelectorAll(selector));
    }
    return results;
  }
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
): SVGElementTagNameMap[K] {
  if (typeof document !== 'undefined' && document.createElementNS) {
    return document.createElementNS(SVG_NS, tag);
  }
  return new HeadlessSvgElement(tag) as unknown as SVGElementTagNameMap[K];
}

export interface ComposeSignOptions {
  customMeasureFn?: TextMeasureFn;
}

function renderTextElement(
  masterSvg: SVGSVGElement,
  el: TextElement,
  customMeasureFn?: TextMeasureFn,
): void {
  const { lines, fontSizeMm, lineStepMm } = wrapTextLines({
    text: el.text,
    boxWidthMm: el.w,
    fontSizeMm: el.size,
    fontFamily: el.fontFamily,
    ...(el.bold !== undefined ? { bold: el.bold } : {}),
    ...(el.italic !== undefined ? { italic: el.italic } : {}),
    ...(el.h !== undefined ? { boxHeightMm: el.h } : {}),
    lineHeight: el.lineHeight,
    ...(el.shrinkToFit !== undefined ? { shrinkToFit: el.shrinkToFit } : {}),
    ...(customMeasureFn ? { measureFn: customMeasureFn } : {}),
  });

  if (lines.length === 0) {
    return;
  }

  const textEl = createSvgElement('text');
  let anchorX = el.x;
  let textAnchor = 'start';

  if (el.align === 'center') {
    anchorX = el.x + el.w / 2;
    textAnchor = 'middle';
  } else if (el.align === 'right') {
    anchorX = el.x + el.w;
    textAnchor = 'end';
  }

  textEl.setAttribute('fill', el.color);
  textEl.setAttribute('font-family', getSystemFontStack(el.fontFamily));
  textEl.setAttribute('font-size', String(fontSizeMm));
  textEl.setAttribute('font-weight', el.bold ? '700' : '400');
  textEl.setAttribute('font-style', el.italic ? 'italic' : 'normal');
  textEl.setAttribute('text-decoration', el.underline ? 'underline' : 'none');
  textEl.setAttribute('text-anchor', textAnchor);
  textEl.setAttribute('dominant-baseline', 'hanging');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const tspan = createSvgElement('tspan');
    tspan.setAttribute('x', String(anchorX));
    tspan.setAttribute('y', String(el.y + i * lineStepMm));
    tspan.textContent = line;
    textEl.appendChild(tspan);
  }

  masterSvg.appendChild(textEl);
}

function renderShapeElement(
  masterSvg: SVGSVGElement,
  el: ShapeElement,
): void {
  const strokeWidth = el.strokeWidth ?? 1;

  if (el.kind === 'line') {
    const line = createSvgElement('line');
    line.setAttribute('x1', String(el.x));
    line.setAttribute('y1', String(el.y));
    line.setAttribute('x2', String(el.x + el.w));
    line.setAttribute('y2', String(el.y + el.h));
    line.setAttribute('stroke', el.stroke ?? el.fill ?? '#000000');
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('stroke-linecap', 'round');
    masterSvg.appendChild(line);
    return;
  }

  const rect = createSvgElement('rect');
  rect.setAttribute('x', String(el.x));
  rect.setAttribute('y', String(el.y));
  rect.setAttribute('width', String(el.w));
  rect.setAttribute('height', String(el.h));
  rect.setAttribute('fill', el.fill ?? 'none');

  if (el.stroke) {
    rect.setAttribute('stroke', el.stroke);
    rect.setAttribute('stroke-width', String(strokeWidth));
  }

  if (el.kind === 'rounded-rect') {
    const radius = el.cornerRadius ?? 4;
    rect.setAttribute('rx', String(radius));
    rect.setAttribute('ry', String(radius));
  }

  masterSvg.appendChild(rect);
}

function renderImageElement(
  masterSvg: SVGSVGElement,
  el: ImageElement,
  index: number,
): void {
  if (el.fit === 'cover') {
    const defs =
      masterSvg.querySelector('defs') ??
      masterSvg.appendChild(createSvgElement('defs'));
    const clipId = `clip-img-${index}-${Math.round(el.x)}-${Math.round(el.y)}`;
    const clipPath = createSvgElement('clipPath');
    clipPath.setAttribute('id', clipId);

    const clipRect = createSvgElement('rect');
    clipRect.setAttribute('x', String(el.x));
    clipRect.setAttribute('y', String(el.y));
    clipRect.setAttribute('width', String(el.w));
    clipRect.setAttribute('height', String(el.h));
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);

    const img = createSvgElement('image');
    img.setAttribute('href', el.dataUrl);
    img.setAttributeNS(XLINK_NS, 'xlink:href', el.dataUrl);
    img.setAttribute('x', String(el.x));
    img.setAttribute('y', String(el.y));
    img.setAttribute('width', String(el.w));
    img.setAttribute('height', String(el.h));
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    img.setAttribute('clip-path', `url(#${clipId})`);
    masterSvg.appendChild(img);
    return;
  }

  const img = createSvgElement('image');
  img.setAttribute('href', el.dataUrl);
  img.setAttributeNS(XLINK_NS, 'xlink:href', el.dataUrl);
  img.setAttribute('x', String(el.x));
  img.setAttribute('y', String(el.y));
  img.setAttribute('width', String(el.w));
  img.setAttribute('height', String(el.h));
  img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  masterSvg.appendChild(img);
}

async function renderQRElement(
  masterSvg: SVGSVGElement,
  el: QRElement,
): Promise<void> {
  const serialized = serializePayload(el.payload);

  if (serialized === '') {
    // Placeholder rendering matching existing behavior
    const g = createSvgElement('g');
    g.setAttribute('class', 'qr-placeholder');

    const rect = createSvgElement('rect');
    rect.setAttribute('x', String(el.x));
    rect.setAttribute('y', String(el.y));
    rect.setAttribute('width', String(el.size));
    rect.setAttribute('height', String(el.size));
    rect.setAttribute('rx', String(el.size * 0.04));
    rect.setAttribute('fill', '#111827');
    rect.setAttribute('stroke', '#334155');
    rect.setAttribute('stroke-width', String(Math.max(0.5, el.size * 0.01)));
    rect.setAttribute('stroke-dasharray', `${el.size * 0.05} ${el.size * 0.03}`);
    g.appendChild(rect);

    const text = createSvgElement('text');
    text.setAttribute('x', String(el.x + el.size / 2));
    text.setAttribute('y', String(el.y + el.size / 2));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', '#94A3B8');
    text.setAttribute('font-family', 'ui-sans-serif, system-ui, sans-serif');
    text.setAttribute('font-size', String(Math.max(2, el.size * 0.065)));
    text.textContent = 'Enter content to generate QR';
    g.appendChild(text);

    masterSvg.appendChild(g);
    return;
  }

  // Active QR rendering
  if (typeof document !== 'undefined') {
    const internalPx = 512;
    const options: Partial<Options> = {
      type: 'svg',
      width: internalPx,
      height: internalPx,
      data: serialized,
      margin: 4,
      ...(el.style.logoDataUrl !== null ? { image: el.style.logoDataUrl } : {}),
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.35,
        margin: 6,
        crossOrigin: 'anonymous',
      },
      qrOptions: {
        errorCorrectionLevel: el.style.errorCorrection,
      },
      dotsOptions: {
        color: el.style.fgColor,
        type: el.style.dotStyle,
      },
      backgroundOptions: {
        color: el.style.bgColor,
      },
      cornersSquareOptions: {
        color: el.style.fgColor,
        type: squareForCornerStyle(el.style.cornerStyle),
      },
      cornersDotOptions: {
        color: el.style.fgColor,
        type: dotForCornerStyle(el.style.cornerStyle),
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
    } finally {
      hiddenDiv.remove();
    }

    if (qrSvg) {
      qrSvg.setAttribute('x', String(el.x));
      qrSvg.setAttribute('y', String(el.y));
      qrSvg.setAttribute('width', String(el.size));
      qrSvg.setAttribute('height', String(el.size));
      qrSvg.setAttribute('viewBox', `0 0 ${internalPx} ${internalPx}`);
      masterSvg.appendChild(qrSvg);
      return;
    }
  }

  // Headless / Node fallback for QR
  const headlessQr = createSvgElement('svg');
  headlessQr.setAttribute('x', String(el.x));
  headlessQr.setAttribute('y', String(el.y));
  headlessQr.setAttribute('width', String(el.size));
  headlessQr.setAttribute('height', String(el.size));
  headlessQr.setAttribute('viewBox', '0 0 100 100');

  const bg = createSvgElement('rect');
  bg.setAttribute('width', '100');
  bg.setAttribute('height', '100');
  bg.setAttribute('fill', el.style.bgColor);
  headlessQr.appendChild(bg);

  const qrBox = createSvgElement('rect');
  qrBox.setAttribute('x', '10');
  qrBox.setAttribute('y', '10');
  qrBox.setAttribute('width', '80');
  qrBox.setAttribute('height', '80');
  qrBox.setAttribute('fill', el.style.fgColor);
  headlessQr.appendChild(qrBox);

  masterSvg.appendChild(headlessQr);
}

function renderElement(
  masterSvg: SVGSVGElement,
  el: SignElement,
  index: number,
  customMeasureFn?: TextMeasureFn,
): Promise<void> | void {
  switch (el.type) {
    case 'text':
      renderTextElement(masterSvg, el, customMeasureFn);
      break;
    case 'shape':
      renderShapeElement(masterSvg, el);
      break;
    case 'image':
      renderImageElement(masterSvg, el, index);
      break;
    case 'qr':
      return renderQRElement(masterSvg, el);
    case 'icon': {
      const g = createSvgElement('g');
      g.setAttribute('data-icon', el.name);
      g.setAttribute('transform', `translate(${el.x}, ${el.y})`);
      const iconText = createSvgElement('text');
      iconText.setAttribute('x', String(el.size / 2));
      iconText.setAttribute('y', String(el.size / 2));
      iconText.setAttribute('text-anchor', 'middle');
      iconText.setAttribute('dominant-baseline', 'central');
      iconText.setAttribute('font-size', String(el.size * 0.4));
      iconText.setAttribute('fill', el.color ?? '#000000');
      iconText.textContent = `[${el.name}]`;
      g.appendChild(iconText);
      masterSvg.appendChild(g);
      break;
    }
  }
}

/**
 * Composes a full SignDocument into an SVGSVGElement with millimeter dimensions and viewBox.
 * Elements are rendered in array order so later elements draw on top.
 */
export async function composeSignSvg(
  doc: SignDocument,
  options?: ComposeSignOptions,
): Promise<SVGSVGElement> {
  const dims: PageDimensions = getPageDimensions(doc.pageSize, doc.orientation);
  const masterSvg = createSvgElement('svg');

  masterSvg.setAttribute('xmlns', SVG_NS);
  masterSvg.setAttribute('xmlns:xlink', XLINK_NS);
  masterSvg.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);
  masterSvg.setAttribute('width', `${dims.width}mm`);
  masterSvg.setAttribute('height', `${dims.height}mm`);

  // Background rect
  const bgRect = createSvgElement('rect');
  bgRect.setAttribute('x', '0');
  bgRect.setAttribute('y', '0');
  bgRect.setAttribute('width', String(dims.width));
  bgRect.setAttribute('height', String(dims.height));
  bgRect.setAttribute('fill', doc.background);
  masterSvg.appendChild(bgRect);

  // Render elements sequentially to preserve z-index layer ordering
  for (let i = 0; i < doc.elements.length; i++) {
    const el = doc.elements[i];
    if (el) {
      await renderElement(masterSvg, el, i, options?.customMeasureFn);
    }
  }

  return masterSvg;
}

/**
 * Alias for composeSignSvg.
 */
export const composeDocumentSvg = composeSignSvg;
