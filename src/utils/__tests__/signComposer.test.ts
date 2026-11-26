import { describe, expect, it } from 'vitest';
import type { SignDocument, TextElement } from '../../types/sign';
import { getPageDimensions } from '../../types/sign';
import { getContrastRatio } from '../colorContrast';
import {
  buildSampleSignA,
  buildSampleSignB,
  buildSampleSignC,
} from '../sampleSigns';
import {
  composeDocumentSvg,
  composeSignSvg,
  composeSignSvgWithMetrics,
} from '../signComposer';
import { stackElements } from '../signLayout';
import {
  computeTextVerticalMetrics,
  measureTextWidthMm,
  wrapTextLines,
} from '../textWrap';

describe('SignDocument Geometry', () => {
  it('computes correct millimetre page dimensions for A4 and A5 orientations', () => {
    expect(getPageDimensions('A4', 'portrait')).toEqual({ width: 210, height: 297 });
    expect(getPageDimensions('A4', 'landscape')).toEqual({ width: 297, height: 210 });
    expect(getPageDimensions('A5', 'portrait')).toEqual({ width: 148, height: 210 });
    expect(getPageDimensions('A5', 'landscape')).toEqual({ width: 210, height: 148 });
  });

  it('sets SVG width, height, and viewBox in millimetres', async () => {
    const docA4Portrait: SignDocument = {
      pageSize: 'A4',
      orientation: 'portrait',
      background: '#FFFFFF',
      elements: [],
    };
    const svgA4P = await composeSignSvg(docA4Portrait);
    expect(svgA4P.getAttribute('viewBox')).toBe('0 0 210 297');
    expect(svgA4P.getAttribute('width')).toBe('210mm');
    expect(svgA4P.getAttribute('height')).toBe('297mm');

    const docA4Landscape: SignDocument = {
      pageSize: 'A4',
      orientation: 'landscape',
      background: '#09090B',
      elements: [],
    };
    const svgA4L = await composeSignSvg(docA4Landscape);
    expect(svgA4L.getAttribute('viewBox')).toBe('0 0 297 210');
    expect(svgA4L.getAttribute('width')).toBe('297mm');
    expect(svgA4L.getAttribute('height')).toBe('210mm');

    const docA5Portrait: SignDocument = {
      pageSize: 'A5',
      orientation: 'portrait',
      background: '#FFFFFF',
      elements: [],
    };
    const svgA5P = await composeSignSvg(docA5Portrait);
    expect(svgA5P.getAttribute('viewBox')).toBe('0 0 148 210');
    expect(svgA5P.getAttribute('width')).toBe('148mm');
    expect(svgA5P.getAttribute('height')).toBe('210mm');

    const docA5Landscape: SignDocument = {
      pageSize: 'A5',
      orientation: 'landscape',
      background: '#FFFFFF',
      elements: [],
    };
    const svgA5L = await composeSignSvg(docA5Landscape);
    expect(svgA5L.getAttribute('viewBox')).toBe('0 0 210 148');
    expect(svgA5L.getAttribute('width')).toBe('210mm');
    expect(svgA5L.getAttribute('height')).toBe('148mm');
  });

  it('composeDocumentSvg alias points to composeSignSvg', () => {
    expect(composeDocumentSvg).toBe(composeSignSvg);
  });
});

describe('Word Wrapping & Text Measurement (without DOM)', () => {
  it('measures text with deterministic fallback in Node environment', () => {
    const w1 = measureTextWidthMm('Hello', 10, 'sans', false);
    const w2 = measureTextWidthMm('Hello', 10, 'sans', true);
    expect(w1).toBeGreaterThan(0);
    expect(w2).toBeGreaterThan(w1); // bold is wider

    const wMono = measureTextWidthMm('Hello', 10, 'mono', false);
    expect(wMono).toBeGreaterThan(w1); // mono is wider than sans
  });

  it('wraps text on word boundaries into multiple lines without overflowing width', () => {
    const text = 'Welcome to our Phnom Penh Guesthouse please make yourself at home';
    const boxWidth = 50; // mm
    const fontSize = 8; // mm

    const result = wrapTextLines({
      text,
      boxWidthMm: boxWidth,
      fontSizeMm: fontSize,
      fontFamily: 'sans',
      lineHeight: 1.2,
    });

    expect(result.lines.length).toBeGreaterThan(1);
    for (const line of result.lines) {
      const lineW = measureTextWidthMm(line, result.fontSizeMm, 'sans', false);
      expect(lineW).toBeLessThanOrEqual(boxWidth + 0.01);
    }
  });

  it('preserves explicit newline linebreaks', () => {
    const text = 'Line One\nLine Two\nLine Three';
    const result = wrapTextLines({
      text,
      boxWidthMm: 100,
      fontSizeMm: 6,
      fontFamily: 'sans',
      lineHeight: 1.2,
    });

    expect(result.lines).toEqual(['Line One', 'Line Two', 'Line Three']);
  });

  it('supports injectable custom text measurer for exact unit test control', () => {
    // Mock measure function: exactly 1mm per character
    const customMeasure = (t: string) => t.length * 1.0;

    const result = wrapTextLines({
      text: 'One two three four five',
      boxWidthMm: 11, // with 3% margin, safe width is 11 * 0.97 = 10.67 mm, accommodating 10 chars
      fontSizeMm: 5,
      fontFamily: 'sans',
      lineHeight: 1.2,
      measureFn: customMeasure,
    });

    expect(result.lines).toEqual(['One two', 'three four', 'five']);
  });

  it('shrinkToFit scales down font size when text exceeds bounding box height', () => {
    const text = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6';
    const boxHeight = 20; // mm (very small height)

    const unscaled = wrapTextLines({
      text,
      boxWidthMm: 100,
      fontSizeMm: 10,
      fontFamily: 'sans',
      lineHeight: 1.2,
      shrinkToFit: false,
    });

    const scaled = wrapTextLines({
      text,
      boxWidthMm: 100,
      fontSizeMm: 10,
      fontFamily: 'sans',
      boxHeightMm: boxHeight,
      lineHeight: 1.2,
      shrinkToFit: true,
    });

    expect(unscaled.fontSizeMm).toBe(10);
    expect(unscaled.totalHeightMm).toBeGreaterThan(boxHeight);

    expect(scaled.fontSizeMm).toBeLessThan(10);
    expect(scaled.totalHeightMm).toBeLessThanOrEqual(boxHeight + 0.01);
  });
});

describe('Sign SVG Element Rendering & Layer Ordering', () => {
  it('renders elements in array order so later elements draw on top (later in SVG DOM)', async () => {
    const doc: SignDocument = {
      pageSize: 'A4',
      orientation: 'portrait',
      background: '#FAFAFA',
      elements: [
        {
          type: 'shape',
          kind: 'rect',
          x: 10,
          y: 10,
          w: 100,
          h: 50,
          fill: '#FF0000',
        },
        {
          type: 'text',
          text: 'Layer 2 Text',
          x: 15,
          y: 20,
          w: 80,
          size: 6,
          color: '#000000',
          align: 'left',
          fontFamily: 'sans',
          lineHeight: 1.2,
        },
        {
          type: 'shape',
          kind: 'line',
          x: 10,
          y: 70,
          w: 80,
          h: 0,
          stroke: '#3B82F6',
          strokeWidth: 2,
        },
      ],
    };

    const svg = await composeSignSvg(doc);
    // Background rect is child 0
    const bg = svg.children[0];
    expect(bg?.tagName).toBe('rect');
    expect(bg?.getAttribute('fill')).toBe('#FAFAFA');

    // Element 0: rect (Layer 1)
    const layer1 = svg.children[1];
    expect(layer1?.tagName).toBe('rect');
    expect(layer1?.getAttribute('fill')).toBe('#FF0000');

    // Element 1: text (Layer 2)
    const layer2 = svg.children[2];
    expect(layer2?.tagName).toBe('text');

    // Element 2: line (Layer 3)
    const layer3 = svg.children[3];
    expect(layer3?.tagName).toBe('line');
  });

  it('renders text with <tspan> elements matching wrapped lines and alignment', async () => {
    const doc: SignDocument = {
      pageSize: 'A4',
      orientation: 'portrait',
      background: '#FFFFFF',
      elements: [
        {
          type: 'text',
          text: 'Center Aligned Headline',
          x: 20,
          y: 30,
          w: 100,
          size: 10,
          bold: true,
          color: '#0F172A',
          align: 'center',
          fontFamily: 'serif',
          lineHeight: 1.3,
        },
      ],
    };

    const svg = await composeSignSvg(doc);
    const textNode = svg.querySelector('text');
    expect(textNode).not.toBeNull();
    expect(textNode?.getAttribute('text-anchor')).toBe('middle');
    expect(textNode?.getAttribute('font-weight')).toBe('700');

    const tspans = textNode?.children ?? [];
    expect(tspans.length).toBeGreaterThan(0);
    expect(tspans[0]?.textContent).toContain('Center');
    // anchorX for center is x + w / 2 = 20 + 50 = 70
    expect(tspans[0]?.getAttribute('x')).toBe('70');
  });

  it('renders placeholder for QR element when payload is empty', async () => {
    const doc: SignDocument = {
      pageSize: 'A5',
      orientation: 'portrait',
      background: '#FFFFFF',
      elements: [
        {
          type: 'qr',
          x: 25,
          y: 40,
          size: 50,
          payload: { category: 'text', text: '' }, // empty payload
          style: {
            fgColor: '#000000',
            bgColor: '#FFFFFF',
            dotStyle: 'square',
            cornerStyle: 'square',
            errorCorrection: 'M',
            logoDataUrl: null,
          },
        },
      ],
    };

    const svg = await composeSignSvg(doc);
    const placeholder = svg.querySelector('g');
    expect(placeholder).not.toBeNull();
    expect(placeholder?.getAttribute('class')).toBe('qr-placeholder');

    const placeholderText = placeholder?.querySelector('text');
    expect(placeholderText?.textContent).toBe('Enter content to generate QR');
  });

  it('renders shapes with rounded corners and image fit attributes', async () => {
    const doc: SignDocument = {
      pageSize: 'A4',
      orientation: 'portrait',
      background: '#FFFFFF',
      elements: [
        {
          type: 'shape',
          kind: 'rounded-rect',
          x: 10,
          y: 10,
          w: 60,
          h: 40,
          cornerRadius: 8,
          fill: '#F1F5F9',
        },
        {
          type: 'image',
          dataUrl: 'data:image/png;base64,sample',
          x: 15,
          y: 15,
          w: 50,
          h: 30,
          fit: 'cover',
        },
      ],
    };

    const svg = await composeSignSvg(doc);
    const roundedRect = svg.children[1];
    expect(roundedRect?.getAttribute('rx')).toBe('8');

    const image = svg.querySelector('image');
    expect(image).not.toBeNull();
    expect(image?.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice');
    expect(image?.getAttribute('clip-path')).toContain('url(#clip-img-');
  });

  it('keeps totalHeightMm and rendered <tspan> spacing derived from the same lineHeight (fails if they diverge)', async () => {
    const lineHeight = 1.65;
    const fontSize = 6;
    const doc: SignDocument = {
      pageSize: 'A4',
      orientation: 'portrait',
      background: '#FFFFFF',
      elements: [
        {
          id: 'multi',
          type: 'text',
          text: 'Line one\nLine two\nLine three\nLine four',
          x: 20,
          y: 25,
          w: 120,
          size: fontSize,
          color: '#0F172A',
          align: 'left',
          fontFamily: 'sans',
          lineHeight,
        },
      ],
    };

    const { svg, elementBounds } = await composeSignSvgWithMetrics(doc);
    const bounds = elementBounds[0];
    expect(bounds).toBeDefined();

    const textEl = svg.querySelector('text');
    expect(textEl).not.toBeNull();
    const tspans = textEl?.children ?? [];
    expect(tspans.length).toBe(4);

    const expectedMetrics = computeTextVerticalMetrics(
      fontSize,
      lineHeight,
      tspans.length,
    );
    expect(bounds?.height).toBeCloseTo(expectedMetrics.totalHeightMm, 6);

    for (let i = 1; i < tspans.length; i++) {
      const prevY = Number(tspans[i - 1]?.getAttribute('y'));
      const currY = Number(tspans[i]?.getAttribute('y'));
      const actualStep = currY - prevY;
      expect(actualStep).toBeCloseTo(expectedMetrics.lineStepMm, 6);
      expect(actualStep * tspans.length).toBeCloseTo(bounds?.height ?? 0, 6);
    }
  });

  it('stackElements prevents wrapped multi-line titles from overlapping subsequent elements', async () => {
    const customMeasure = (t: string) => t.length * 4; // forces wrapping
    const { elements } = stackElements(
      20,
      [
        {
          kind: 'element',
          element: {
            id: 'title',
            type: 'text',
            text: 'Room Inventory & Replacement Price List',
            x: 20,
            y: 0,
            w: 80,
            size: 9,
            bold: true,
            color: '#0F172A',
            align: 'center',
            fontFamily: 'sans',
            lineHeight: 1.2,
          },
          gapAfter: 3,
        },
        {
          kind: 'element',
          element: {
            id: 'subtitle',
            type: 'text',
            text: 'Subtitle placed cleanly underneath',
            x: 20,
            y: 0,
            w: 80,
            size: 4,
            color: '#475569',
            align: 'center',
            fontFamily: 'sans',
            lineHeight: 1.3,
          },
        },
      ],
      customMeasure,
    );

    const doc: SignDocument = {
      pageSize: 'A4',
      orientation: 'portrait',
      background: '#FFFFFF',
      elements,
    };

    const { elementBounds } = await composeSignSvgWithMetrics(doc, {
      customMeasureFn: customMeasure,
    });
    const titleBounds = elementBounds[0];
    const subtitleBounds = elementBounds[1];
    expect(titleBounds).toBeDefined();
    expect(subtitleBounds).toBeDefined();
    expect(titleBounds!.height).toBeGreaterThan(9 * 1.2); // wrapped to multiple lines
    expect(subtitleBounds!.y).toBeGreaterThanOrEqual(
      titleBounds!.y + titleBounds!.height + 3 - 0.001,
    );
  });

  it('aligns Sign B sans item labels and mono prices onto identical alphabetic baseline y coordinates', async () => {
    const doc = buildSampleSignB();
    const { svg, elementBounds } = await composeSignSvgWithMetrics(doc);

    // Check title and subtitle do not overlap
    const titleBound = elementBounds[2];
    const subtitleBound = elementBounds[3];
    expect(titleBound).toBeDefined();
    expect(subtitleBound).toBeDefined();
    expect(subtitleBound!.y).toBeGreaterThanOrEqual(
      titleBound!.y + titleBound!.height - 0.001,
    );

    const textEls = svg.querySelectorAll('text');
    // In buildSampleSignB:
    // 0: brand, 1: title, 2: subtitle, 3: ITEM DESCRIPTION, 4: REPLACEMENT FEE, 5: items col, 6: prices col, 7: footer
    const itemsCol = textEls[5];
    const pricesCol = textEls[6];
    expect(itemsCol).toBeDefined();
    expect(pricesCol).toBeDefined();
    expect(itemsCol?.getAttribute('dominant-baseline')).toBe('alphabetic');
    expect(pricesCol?.getAttribute('dominant-baseline')).toBe('alphabetic');
    expect(itemsCol?.getAttribute('font-size')).toBe(
      pricesCol?.getAttribute('font-size'),
    );

    const itemSpans = itemsCol?.children ?? [];
    const priceSpans = pricesCol?.children ?? [];
    expect(itemSpans.length).toBe(priceSpans.length);
    for (let i = 0; i < itemSpans.length; i++) {
      expect(priceSpans[i]?.getAttribute('y')).toBe(
        itemSpans[i]?.getAttribute('y'),
      );
    }
  });

  it('wraps non-empty QR elements in a group with shape-rendering="crispEdges"', async () => {
    const doc = buildSampleSignC();
    const svg = await composeSignSvg(doc);
    const groups = Array.from(svg.querySelectorAll('g'));
    const qrGroup = groups.find((g) => g.getAttribute('class') === 'qr-group');
    expect(qrGroup).toBeDefined();
    expect(qrGroup?.getAttribute('shape-rendering')).toBe('crispEdges');
  });

  it('ensures all text colors in sample signs A, B, and C meet >= 4.5:1 contrast on their backgrounds', () => {
    const checkDocContrast = (
      doc: SignDocument,
      getBgForElement: (el: TextElement, index: number) => string,
    ) => {
      doc.elements.forEach((el, idx) => {
        if (el.type === 'text') {
          const bg = getBgForElement(el, idx);
          const ratio = getContrastRatio(el.color, bg);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
      });
    };

    // Sample A: card paragraph is inside #F1F5F9 card, all else on #FFFFFF frame
    checkDocContrast(buildSampleSignA(), (el) =>
      el.w === 70 ? '#F1F5F9' : '#FFFFFF',
    );
    // Sample B: header row text is #FFFFFF on #0F172A bar, all else on #FFFFFF
    checkDocContrast(buildSampleSignB(), (el) =>
      el.color === '#FFFFFF' ? '#0F172A' : '#FFFFFF',
    );
    // Sample C: SSID & password card texts (w === 130) sit on #F1F5F9 cards, rest on #FFFFFF
    checkDocContrast(buildSampleSignC(), (el) =>
      el.w === 130 ? '#F1F5F9' : '#FFFFFF',
    );
  });
});
