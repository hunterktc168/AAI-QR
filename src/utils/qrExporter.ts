import type { QRCategory, QRProjectState } from '../types/qr';
import {
  composeQRSvg,
  escapeXmlText,
  getSystemFontStack,
} from './qrComposer';

export function formatExportFilename(
  category: QRCategory,
  ext: 'png' | 'jpg' | 'svg',
  date: Date = new Date(),
): string {
  const pad2 = (value: number): string => String(value).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());

  return `qr-${category}-${yyyy}${mm}${dd}-${hh}${min}${ss}.${ext}`;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function loadSvgImage(svgXml: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load serialized QR SVG image.'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`;
  });
}

async function svgToCanvasBlob(
  svg: SVGSVGElement,
  size: number,
  mimeType: 'image/png' | 'image/jpeg',
  quality: number | undefined,
  fillBackgroundColor: string | null,
): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svg);
  const img = await loadSvgImage(xml);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas context is unavailable.');
  }

  if (fillBackgroundColor !== null) {
    ctx.fillStyle = fillBackgroundColor;
    ctx.fillRect(0, 0, size, size);
  }

  ctx.drawImage(img, 0, 0, size, size);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Canvas toBlob returned null for ${mimeType}.`));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

export async function downloadPNG(state: QRProjectState): Promise<void> {
  const svg = await composeQRSvg(state, state.exportSize);
  const bgFill =
    state.frame.template === 'none'
      ? state.style.bgColor
      : state.frame.frameBgColor;
  const blob = await svgToCanvasBlob(svg, state.exportSize, 'image/png', undefined, bgFill);
  const filename = formatExportFilename(state.payload.category, 'png');
  triggerBlobDownload(blob, filename);
}

export async function downloadJPG(state: QRProjectState): Promise<void> {
  const svg = await composeQRSvg(state, state.exportSize);
  const bgFill =
    state.frame.template === 'none'
      ? state.style.bgColor
      : state.frame.frameBgColor;
  const blob = await svgToCanvasBlob(svg, state.exportSize, 'image/jpeg', 0.95, bgFill);
  const filename = formatExportFilename(state.payload.category, 'jpg');
  triggerBlobDownload(blob, filename);
}

export async function downloadSVG(state: QRProjectState): Promise<void> {
  const svg = await composeQRSvg(state, state.exportSize);
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const filename = formatExportFilename(state.payload.category, 'svg');
  triggerBlobDownload(blob, filename);
}

function safeHexColor(raw: string, fallback = '#0F172A'): string {
  const trimmed = raw.trim();
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(trimmed)
    ? escapeXmlText(trimmed)
    : fallback;
}

export async function buildHTMLSnippet(state: QRProjectState): Promise<string> {
  const svg = await composeQRSvg(state, state.exportSize);
  const serializedSvg = new XMLSerializer().serializeToString(svg);
  const fontStack = getSystemFontStack(state.frame.fontFamily);
  const safeColor = safeHexColor(state.frame.textColor);
  const showFrameCopy = state.frame.template !== 'none';
  const safeLabel = showFrameCopy ? escapeXmlText(state.frame.label.trim()) : '';
  const safeSublabel = showFrameCopy ? escapeXmlText(state.frame.sublabel.trim()) : '';

  const captionLines: string[] = [];
  if (safeLabel !== '') {
    captionLines.push(
      `      <p style="margin:8px 0 0;font-size:14px;font-weight:600;color:${safeColor};">${safeLabel}</p>`,
    );
  }
  if (safeSublabel !== '') {
    captionLines.push(
      `      <p style="margin:2px 0 0;font-size:12px;color:${safeColor};opacity:0.75;">${safeSublabel}</p>`,
    );
  }

  const figcaptionBlock =
    captionLines.length > 0
      ? `\n    <figcaption>\n${captionLines.join('\n')}\n    </figcaption>`
      : '';

  return [
    `<div style="display:inline-block;text-align:center;font-family:${fontStack};">`,
    `  <figure style="margin:0;">`,
    `    ${serializedSvg}${figcaptionBlock}`,
    `  </figure>`,
    `  <!-- Fonts render with the viewer's system defaults; typography may vary across platforms. -->`,
    `</div>`,
  ].join('\n');
}
