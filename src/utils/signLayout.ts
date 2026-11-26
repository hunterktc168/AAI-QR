import type { ShapeElement, SignElement } from '../types/sign';
import { measureElementHeightMm } from './signComposer';
import type { TextMeasureFn } from './textWrap';

/**
 * NOTE: `stackElements` is for templates only.
 * The interactive editor keeps explicit element `(x, y)` positions and must NOT
 * automatically reflow user-placed layers when editing.
 */

export interface StackSingleItem {
  readonly kind: 'element';
  readonly element: SignElement;
  readonly gapAfter?: number;
}

export interface StackRowEntry {
  readonly element: SignElement;
  readonly offsetY?: number;
}

export interface StackRowItem {
  readonly kind: 'row';
  /** Elements laid out relative to the row's starting `y` coordinate. */
  readonly items: readonly StackRowEntry[];
  /** Optional explicit row height override (in mm); defaults to max measured bottom edge. */
  readonly heightMm?: number;
  readonly gapAfter?: number;
}

export interface StackCardItem {
  readonly kind: 'card';
  /** Card background shape whose `y` and `h` are computed from its stacked children. */
  readonly card: Omit<ShapeElement, 'y' | 'h'>;
  readonly paddingTopMm: number;
  readonly paddingBottomMm: number;
  readonly children: readonly StackItem[];
  readonly gapAfter?: number;
}

export type StackItem = StackSingleItem | StackRowItem | StackCardItem;

export interface StackLayoutResult {
  readonly elements: SignElement[];
  readonly startY: number;
  readonly endY: number;
  readonly totalHeightMm: number;
}

function withY<T extends SignElement>(el: T, y: number): T {
  return { ...el, y };
}

/**
 * Vertically stacks template blocks starting at `startY` (in mm), measuring each
 * element's actual height (including multi-line wrapped text) so subsequent blocks
 * never overlap content above them.
 *
 * NOTE: `stackElements` is for templates only. The editor keeps explicit element positions.
 */
export function stackElements(
  startY: number,
  items: readonly StackItem[],
  customMeasureFn?: TextMeasureFn,
): StackLayoutResult {
  const elements: SignElement[] = [];
  let cursorY = startY;

  for (const item of items) {
    if (item.kind === 'element') {
      const placed = withY(item.element, cursorY);
      const heightMm = measureElementHeightMm(placed, customMeasureFn);
      elements.push(placed);
      cursorY += heightMm + (item.gapAfter ?? 0);
      continue;
    }

    if (item.kind === 'row') {
      let maxBottomOffset = 0;
      for (const entry of item.items) {
        const offsetY = entry.offsetY ?? 0;
        const placed = withY(entry.element, cursorY + offsetY);
        const h = measureElementHeightMm(placed, customMeasureFn);
        elements.push(placed);
        const bottom = offsetY + h;
        if (bottom > maxBottomOffset) {
          maxBottomOffset = bottom;
        }
      }
      const rowHeight = item.heightMm ?? maxBottomOffset;
      cursorY += rowHeight + (item.gapAfter ?? 0);
      continue;
    }

    // Card block: measure inner stack at `cursorY + paddingTopMm`, emit background shape first
    const innerStartY = cursorY + item.paddingTopMm;
    const innerResult = stackElements(innerStartY, item.children, customMeasureFn);
    const cardHeight =
      item.paddingTopMm + innerResult.totalHeightMm + item.paddingBottomMm;

    const cardShape: ShapeElement = {
      ...item.card,
      y: cursorY,
      h: cardHeight,
    };
    elements.push(cardShape, ...innerResult.elements);
    cursorY += cardHeight + (item.gapAfter ?? 0);
  }

  return {
    elements,
    startY,
    endY: cursorY,
    totalHeightMm: cursorY - startY,
  };
}
