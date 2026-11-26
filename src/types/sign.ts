import type { QRPayloadData, QRStyleConfig } from './qr';

export type PageSize = 'A4' | 'A5';
export type PageOrientation = 'portrait' | 'landscape';
export type TextFontFamily = 'sans' | 'serif' | 'mono';
export type TextAlign = 'left' | 'center' | 'right';
export type ShapeKind = 'rect' | 'rounded-rect' | 'line';
export type ImageFit = 'contain' | 'cover';

export interface PageDimensions {
  readonly width: number;  // mm
  readonly height: number; // mm
}

export const PAGE_DIMENSIONS_MM: Record<PageSize, PageDimensions> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
} as const;

export function getPageDimensions(
  pageSize: PageSize,
  orientation: PageOrientation,
): PageDimensions {
  const base = PAGE_DIMENSIONS_MM[pageSize];
  if (orientation === 'landscape') {
    return { width: base.height, height: base.width };
  }
  return { width: base.width, height: base.height };
}

export interface BaseElement {
  id?: string;
  x: number; // mm
  y: number; // mm
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  w: number; // mm
  h?: number; // mm (bounding box height, used for vertical constraints & shrink-to-fit)
  size: number; // mm (font size)
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color: string;
  align: TextAlign;
  fontFamily: TextFontFamily;
  lineHeight: number; // multiplier, e.g. 1.2
  shrinkToFit?: boolean;
}

export interface QRElement extends BaseElement {
  type: 'qr';
  payload: QRPayloadData;
  style: QRStyleConfig;
  size: number; // mm (width and height)
}

export interface ImageElement extends BaseElement {
  type: 'image';
  dataUrl: string;
  w: number; // mm
  h: number; // mm
  fit: ImageFit;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  kind: ShapeKind;
  w: number; // mm
  h: number; // mm
  fill?: string;
  stroke?: string;
  strokeWidth?: number; // mm
  cornerRadius?: number; // mm
}

export interface IconElement extends BaseElement {
  type: 'icon';
  name: string;
  size: number; // mm
  color?: string;
}

export type SignElement =
  | TextElement
  | QRElement
  | ImageElement
  | ShapeElement
  | IconElement;

export interface SignDocument {
  pageSize: PageSize;
  orientation: PageOrientation;
  background: string;
  elements: SignElement[];
}
