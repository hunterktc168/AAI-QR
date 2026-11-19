export type QRCategory = 'url' | 'wifi' | 'vcard' | 'text' | 'email' | 'sms';

export interface WifiPayload {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardPayload {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  url: string;
  note: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface SmsPayload {
  phone: string;
  body: string;
}

export type QRPayloadData =
  | { category: 'url'; url: string }
  | { category: 'text'; text: string }
  | ({ category: 'wifi' } & WifiPayload)
  | ({ category: 'vcard' } & VCardPayload)
  | ({ category: 'email' } & EmailPayload)
  | ({ category: 'sms' } & SmsPayload);

export type DotStyle = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy';

export type CornerStyle = 'square' | 'dot' | 'extra-rounded';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type FrameTemplate = 'none' | 'bottom-banner' | 'top-badge' | 'card-border';

export interface QRStyleConfig {
  fgColor: string;
  bgColor: string;
  dotStyle: DotStyle;
  cornerStyle: CornerStyle;
  errorCorrection: ErrorCorrectionLevel;
  logoDataUrl: string | null;
}

export interface QRFrameConfig {
  template: FrameTemplate;
  label: string;
  sublabel: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  frameBgColor: string;
  textColor: string;
}

export interface QRProjectState {
  payload: QRPayloadData;
  style: QRStyleConfig;
  frame: QRFrameConfig;
  exportSize: 512 | 1024 | 2048;
}
