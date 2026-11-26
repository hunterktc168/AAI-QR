import type { SignDocument } from '../types/sign';
import { stackElements } from './signLayout';
import type { TextMeasureFn } from './textWrap';

/**
 * Sample A: Long paragraph in a narrow box on A4 portrait (210 x 297 mm).
 */
export function buildSampleSignA(measureFn?: TextMeasureFn): SignDocument {
  const { elements: bodyElements } = stackElements(
    22,
    [
      {
        kind: 'element',
        element: {
          type: 'text',
          text: 'PHNOM PENH GUESTHOUSE',
          x: 20,
          y: 0,
          w: 170,
          size: 5,
          bold: true,
          color: '#475569',
          align: 'center',
          fontFamily: 'sans',
          lineHeight: 1.2,
        },
        gapAfter: 4,
      },
      {
        kind: 'element',
        element: {
          type: 'text',
          text: 'Guest Quiet Hours & House Policies',
          x: 20,
          y: 0,
          w: 170,
          size: 9.5,
          bold: true,
          color: '#0F172A',
          align: 'center',
          fontFamily: 'serif',
          lineHeight: 1.2,
        },
        gapAfter: 2.5,
      },
      {
        kind: 'element',
        element: {
          type: 'shape',
          kind: 'line',
          x: 75,
          y: 0,
          w: 60,
          h: 0,
          stroke: '#1D4ED8',
          strokeWidth: 1.2,
        },
        gapAfter: 7,
      },
      {
        kind: 'card',
        card: {
          type: 'shape',
          kind: 'rounded-rect',
          x: 65,
          w: 80,
          fill: '#F1F5F9',
          stroke: '#CBD5E1',
          strokeWidth: 0.6,
          cornerRadius: 4,
        },
        paddingTopMm: 8,
        paddingBottomMm: 8,
        gapAfter: 11,
        children: [
          {
            kind: 'element',
            element: {
              type: 'text',
              text:
                'Dear Guests,\n\nIn consideration of all travelers resting after long journeys, our designated quiet hours are strictly observed nightly between 10:00 PM and 7:00 AM. Please keep voice and media volume low in hallways, stairwells, and shared courtyard balconies.\n\nExternal visitors are not permitted in guest rooms after 9:00 PM without prior registration at the front desk.\n\nKindly switch off the air conditioning unit and ensure your balcony doors are latched whenever you step out to conserve energy and keep tropical insects out.\n\nIf you require early checkout, extra towels, laundry service, or taxi booking to the airport, please notify the desk before 10:00 AM.\n\nThank you for helping us maintain a clean, peaceful sanctuary in the vibrant heart of Phnom Penh.',
              x: 70,
              y: 0,
              w: 70,
              size: 3.8,
              color: '#1E293B',
              align: 'left',
              fontFamily: 'sans',
              lineHeight: 1.45,
            },
          },
        ],
      },
      {
        kind: 'element',
        element: {
          type: 'text',
          text: 'Front Desk: Dial 0 or WhatsApp +855 23 999 888',
          x: 20,
          y: 0,
          w: 170,
          size: 3.5,
          color: '#475569',
          align: 'center',
          fontFamily: 'sans',
          lineHeight: 1.2,
        },
      },
    ],
    measureFn,
  );

  return {
    pageSize: 'A4',
    orientation: 'portrait',
    background: '#F8FAFC',
    elements: [
      {
        type: 'shape',
        kind: 'rect',
        x: 10,
        y: 10,
        w: 190,
        h: 277,
        stroke: '#E2E8F0',
        strokeWidth: 0.8,
        fill: '#FFFFFF',
      },
      ...bodyElements,
    ],
  };
}

/**
 * Sample B: Room inventory & damage price list with two columns on A4 portrait (210 x 297 mm).
 */
export function buildSampleSignB(measureFn?: TextMeasureFn): SignDocument {
  const { elements: bodyElements } = stackElements(
    22,
    [
      {
        kind: 'element',
        element: {
          type: 'text',
          text: 'PHNOM PENH GUESTHOUSE',
          x: 20,
          y: 0,
          w: 170,
          size: 5,
          bold: true,
          color: '#475569',
          align: 'center',
          fontFamily: 'sans',
          lineHeight: 1.2,
        },
        gapAfter: 3,
      },
      {
        kind: 'element',
        element: {
          type: 'text',
          text: 'Room Inventory & Replacement Price List',
          x: 20,
          y: 0,
          w: 170,
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
          type: 'text',
          text:
            'Please enjoy our room amenities. Items damaged, stained beyond cleaning, or missing upon checkout will be charged as follows:',
          x: 25,
          y: 0,
          w: 160,
          size: 3.8,
          color: '#475569',
          align: 'center',
          fontFamily: 'sans',
          lineHeight: 1.35,
        },
        gapAfter: 7,
      },
      // Table header row (rect + left/right aligned column labels)
      {
        kind: 'row',
        heightMm: 10,
        gapAfter: 7,
        items: [
          {
            element: {
              type: 'shape',
              kind: 'rect',
              x: 22,
              y: 0,
              w: 166,
              h: 10,
              fill: '#0F172A',
            },
          },
          {
            offsetY: 3.1,
            element: {
              type: 'text',
              text: 'ITEM DESCRIPTION',
              x: 26,
              y: 0,
              w: 110,
              size: 4,
              bold: true,
              color: '#FFFFFF',
              align: 'left',
              fontFamily: 'sans',
              lineHeight: 1.2,
            },
          },
          {
            offsetY: 3.1,
            element: {
              type: 'text',
              text: 'REPLACEMENT FEE',
              x: 140,
              y: 0,
              w: 44,
              size: 4,
              bold: true,
              color: '#FFFFFF',
              align: 'right',
              fontFamily: 'sans',
              lineHeight: 1.2,
            },
          },
        ],
      },
      // Two aligned columns sharing identical y, font-size, and dominant-baseline basis
      {
        kind: 'row',
        gapAfter: 12,
        items: [
          {
            element: {
              type: 'text',
              text:
                'Electronic Key Card & Wooden Room Tag\n\nLarge White Bath Towel\n\nStained / Damaged Bed Linen Set\n\nAir Conditioning Remote Control\n\nFast Electric Boiling Kettle (1.5L)\n\nIonic Hairdryer (1800W)\n\nTempered Glass Tumbler\n\nSmart TV Remote Control\n\nDown Pillow & Protector Case\n\nCeramic Coffee / Tea Mug\n\nDamaged Wall Decor / Mirror',
              x: 26,
              y: 0,
              w: 115,
              size: 4.2,
              color: '#1E293B',
              align: 'left',
              fontFamily: 'sans',
              lineHeight: 1.5,
            },
          },
          {
            element: {
              type: 'text',
              text:
                '$10.00\n\n$12.00\n\n$35.00\n\n$25.00\n\n$22.00\n\n$28.00\n\n$3.50\n\n$18.00\n\n$15.00\n\n$4.50\n\nAt Cost',
              x: 140,
              y: 0,
              w: 44,
              size: 4.2,
              bold: true,
              color: '#0F172A',
              align: 'right',
              fontFamily: 'mono',
              lineHeight: 1.5,
            },
          },
        ],
      },
      {
        kind: 'element',
        element: {
          type: 'shape',
          kind: 'line',
          x: 22,
          y: 0,
          w: 166,
          h: 0,
          stroke: '#CBD5E1',
          strokeWidth: 0.6,
        },
        gapAfter: 6,
      },
      {
        kind: 'element',
        element: {
          type: 'text',
          text:
            'Fees cover replacement acquisition in Phnom Penh. Invoiced to room folio upon departure.',
          x: 22,
          y: 0,
          w: 166,
          size: 3.4,
          italic: true,
          color: '#475569',
          align: 'center',
          fontFamily: 'sans',
          lineHeight: 1.2,
        },
      },
    ],
    measureFn,
  );

  return {
    pageSize: 'A4',
    orientation: 'portrait',
    background: '#FFFFFF',
    elements: [
      {
        type: 'shape',
        kind: 'rounded-rect',
        x: 12,
        y: 12,
        w: 186,
        h: 273,
        stroke: '#0F172A',
        strokeWidth: 1.5,
        cornerRadius: 3,
        fill: 'none',
      },
      ...bodyElements,
    ],
  };
}

/**
 * Sample C: Wi-Fi sign with large headline on A4 portrait (210 x 297 mm).
 */
export function buildSampleSignC(measureFn?: TextMeasureFn): SignDocument {
  const { elements: bodyElements } = stackElements(
    24,
    [
      {
        kind: 'element',
        element: {
          type: 'text',
          text: 'PHNOM PENH GUESTHOUSE',
          x: 20,
          y: 0,
          w: 170,
          size: 6,
          bold: true,
          color: '#475569',
          align: 'center',
          fontFamily: 'sans',
          lineHeight: 1.2,
        },
        gapAfter: 4,
      },
      {
        kind: 'element',
        element: {
          type: 'text',
          text: 'HIGH-SPEED GUEST WI-FI',
          x: 15,
          y: 0,
          w: 180,
          size: 13.5,
          bold: true,
          color: '#0F172A',
          align: 'center',
          fontFamily: 'sans',
          lineHeight: 1.15,
        },
        gapAfter: 4,
      },
      {
        kind: 'element',
        element: {
          type: 'text',
          text: 'Connect to fiber internet throughout the guesthouse',
          x: 20,
          y: 0,
          w: 170,
          size: 5,
          color: '#1D4ED8',
          align: 'center',
          fontFamily: 'sans',
          lineHeight: 1.2,
        },
        gapAfter: 8,
      },
      {
        kind: 'card',
        card: {
          type: 'shape',
          kind: 'rounded-rect',
          x: 55,
          w: 100,
          fill: '#F8FAFC',
          stroke: '#E2E8F0',
          strokeWidth: 1,
          cornerRadius: 6,
        },
        paddingTopMm: 10,
        paddingBottomMm: 10,
        gapAfter: 8,
        children: [
          {
            kind: 'element',
            element: {
              type: 'qr',
              x: 65,
              y: 0,
              size: 80,
              payload: {
                category: 'wifi',
                ssid: 'PP_Guesthouse_HighSpeed',
                password: 'mekongwelcome2026',
                encryption: 'WPA',
                hidden: false,
              },
              style: {
                fgColor: '#0F172A',
                bgColor: '#FFFFFF',
                dotStyle: 'rounded',
                cornerStyle: 'extra-rounded',
                errorCorrection: 'M',
                logoDataUrl: null,
              },
            },
          },
        ],
      },
      {
        kind: 'element',
        element: {
          type: 'text',
          text: 'Point your camera at the QR code to join automatically',
          x: 20,
          y: 0,
          w: 170,
          size: 4.5,
          bold: true,
          color: '#1E293B',
          align: 'center',
          fontFamily: 'sans',
          lineHeight: 1.2,
        },
        gapAfter: 8,
      },
      // Network name card
      {
        kind: 'card',
        card: {
          type: 'shape',
          kind: 'rounded-rect',
          x: 35,
          w: 140,
          fill: '#F1F5F9',
          stroke: '#CBD5E1',
          strokeWidth: 0.8,
          cornerRadius: 4,
        },
        paddingTopMm: 5,
        paddingBottomMm: 6,
        gapAfter: 7,
        children: [
          {
            kind: 'element',
            element: {
              type: 'text',
              text: 'NETWORK NAME (SSID)',
              x: 40,
              y: 0,
              w: 130,
              size: 3.5,
              bold: true,
              color: '#475569',
              align: 'center',
              fontFamily: 'sans',
              lineHeight: 1.2,
            },
            gapAfter: 3,
          },
          {
            kind: 'element',
            element: {
              type: 'text',
              text: 'PP_Guesthouse_HighSpeed',
              x: 40,
              y: 0,
              w: 130,
              size: 7.5,
              bold: true,
              color: '#0F172A',
              align: 'center',
              fontFamily: 'mono',
              lineHeight: 1.2,
            },
          },
        ],
      },
      // Password card
      {
        kind: 'card',
        card: {
          type: 'shape',
          kind: 'rounded-rect',
          x: 35,
          w: 140,
          fill: '#F1F5F9',
          stroke: '#CBD5E1',
          strokeWidth: 0.8,
          cornerRadius: 4,
        },
        paddingTopMm: 5,
        paddingBottomMm: 6,
        gapAfter: 12,
        children: [
          {
            kind: 'element',
            element: {
              type: 'text',
              text: 'NETWORK PASSWORD',
              x: 40,
              y: 0,
              w: 130,
              size: 3.5,
              bold: true,
              color: '#475569',
              align: 'center',
              fontFamily: 'sans',
              lineHeight: 1.2,
            },
            gapAfter: 3,
          },
          {
            kind: 'element',
            element: {
              type: 'text',
              text: 'mekongwelcome2026',
              x: 40,
              y: 0,
              w: 130,
              size: 7.5,
              bold: true,
              color: '#0F172A',
              align: 'center',
              fontFamily: 'mono',
              lineHeight: 1.2,
            },
          },
        ],
      },
      {
        kind: 'element',
        element: {
          type: 'text',
          text: 'Need assistance? Reception WhatsApp: +855 23 999 888',
          x: 20,
          y: 0,
          w: 170,
          size: 3.8,
          color: '#475569',
          align: 'center',
          fontFamily: 'sans',
          lineHeight: 1.2,
        },
      },
    ],
    measureFn,
  );

  return {
    pageSize: 'A4',
    orientation: 'portrait',
    background: '#FFFFFF',
    elements: [
      {
        type: 'shape',
        kind: 'rounded-rect',
        x: 10,
        y: 10,
        w: 190,
        h: 277,
        stroke: '#1D4ED8',
        strokeWidth: 2,
        cornerRadius: 6,
        fill: '#FFFFFF',
      },
      ...bodyElements,
    ],
  };
}

export const SAMPLE_SIGN_A_NARROW_PARAGRAPH: SignDocument = buildSampleSignA();
export const SAMPLE_SIGN_B_DAMAGE_PRICE_LIST: SignDocument = buildSampleSignB();
export const SAMPLE_SIGN_C_WIFI_HEADLINE: SignDocument = buildSampleSignC();
