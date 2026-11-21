import type { QRProjectState } from '../types/qr';

export interface QRPresets {
  readonly menu: QRProjectState;
  readonly wifi: QRProjectState;
  readonly website: QRProjectState;
  readonly vcard: QRProjectState;
}

function freezePreset(preset: QRProjectState): QRProjectState {
  Object.freeze(preset.payload);
  Object.freeze(preset.style);
  Object.freeze(preset.frame);
  return Object.freeze(preset);
}

export const PRESETS: QRPresets = Object.freeze<QRPresets>({
  menu: freezePreset({
    payload: {
      category: 'url',
      url: 'https://example.com/menu',
    },
    style: {
      fgColor: '#1E293B',
      bgColor: '#FFFBEB',
      dotStyle: 'rounded',
      cornerStyle: 'extra-rounded',
      errorCorrection: 'M',
      logoDataUrl: null,
    },
    frame: {
      template: 'bottom-banner',
      label: 'SCAN FOR MENU',
      sublabel: 'View full food & drink menu',
      fontFamily: 'sans',
      textSize: 'lg',
      frameBgColor: '#1E293B',
      textColor: '#FFFBEB',
    },
    exportSize: 1024,
  }),
  wifi: freezePreset({
    payload: {
      category: 'wifi',
      ssid: 'GuestWiFi',
      password: 'welcome123',
      encryption: 'WPA',
      hidden: false,
    },
    style: {
      fgColor: '#1D4ED8',
      bgColor: '#FFFFFF',
      dotStyle: 'dots',
      cornerStyle: 'dot',
      errorCorrection: 'M',
      logoDataUrl: null,
    },
    frame: {
      template: 'card-border',
      label: 'GUEST WI-FI',
      sublabel: 'Scan to join automatically',
      fontFamily: 'sans',
      textSize: 'md',
      frameBgColor: '#1D4ED8',
      textColor: '#FFFFFF',
    },
    exportSize: 1024,
  }),
  website: freezePreset({
    payload: {
      category: 'url',
      url: 'https://example.com',
    },
    style: {
      fgColor: '#0F172A',
      bgColor: '#FFFFFF',
      dotStyle: 'square',
      cornerStyle: 'square',
      errorCorrection: 'M',
      logoDataUrl: null,
    },
    frame: {
      template: 'none',
      label: '',
      sublabel: '',
      fontFamily: 'sans',
      textSize: 'md',
      frameBgColor: '#FFFFFF',
      textColor: '#0F172A',
    },
    exportSize: 1024,
  }),
  vcard: freezePreset({
    payload: {
      category: 'vcard',
      firstName: 'Jane',
      lastName: 'Doe',
      organization: 'Acme Inc',
      title: 'Designer',
      phone: '+15551234567',
      email: 'jane@example.com',
      url: 'https://example.com',
      note: 'Nice to meet you',
    },
    style: {
      fgColor: '#065F46',
      bgColor: '#FFFFFF',
      dotStyle: 'rounded',
      cornerStyle: 'extra-rounded',
      errorCorrection: 'M',
      logoDataUrl: null,
    },
    frame: {
      template: 'top-badge',
      label: 'SAVE CONTACT',
      sublabel: 'Scan to add to contacts',
      fontFamily: 'sans',
      textSize: 'md',
      frameBgColor: '#065F46',
      textColor: '#FFFFFF',
    },
    exportSize: 1024,
  }),
});
