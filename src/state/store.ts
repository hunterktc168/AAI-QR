import type {
  QRFrameConfig,
  QRPayloadData,
  QRProjectState,
  QRStyleConfig,
} from '../types/qr';

type StoreListener = (state: QRProjectState) => void;

function assertNever(value: never): never {
  throw new Error(`Unhandled QR payload category: ${JSON.stringify(value)}`);
}

function createBootState(): QRProjectState {
  return {
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
      frameBgColor: '#FFFFFF',
      textColor: '#0F172A',
    },
    exportSize: 1024,
  };
}

function cloneState(state: QRProjectState): QRProjectState {
  return {
    payload: { ...state.payload },
    style: { ...state.style },
    frame: { ...state.frame },
    exportSize: state.exportSize,
  };
}

function pickString(
  raw: Readonly<Record<string, unknown>>,
  key: string,
  fallback: string,
): string {
  const value = raw[key];
  return typeof value === 'string' ? value : fallback;
}

function pickBoolean(
  raw: Readonly<Record<string, unknown>>,
  key: string,
  fallback: boolean,
): boolean {
  const value = raw[key];
  return typeof value === 'boolean' ? value : fallback;
}

function pickWifiEncryption(
  raw: Readonly<Record<string, unknown>>,
  fallback: 'WPA' | 'WEP' | 'nopass',
): 'WPA' | 'WEP' | 'nopass' {
  const value = raw['encryption'];
  if (value === 'WPA' || value === 'WEP' || value === 'nopass') {
    return value;
  }
  return fallback;
}

function mergePayloadForCurrentCategory(
  current: QRPayloadData,
  patch: Partial<QRPayloadData>,
): QRPayloadData {
  const raw: Readonly<Record<string, unknown>> = patch;

  switch (current.category) {
    case 'url':
      return {
        category: 'url',
        url: pickString(raw, 'url', current.url),
      };
    case 'text':
      return {
        category: 'text',
        text: pickString(raw, 'text', current.text),
      };
    case 'wifi':
      return {
        category: 'wifi',
        ssid: pickString(raw, 'ssid', current.ssid),
        password: pickString(raw, 'password', current.password),
        encryption: pickWifiEncryption(raw, current.encryption),
        hidden: pickBoolean(raw, 'hidden', current.hidden),
      };
    case 'vcard':
      return {
        category: 'vcard',
        firstName: pickString(raw, 'firstName', current.firstName),
        lastName: pickString(raw, 'lastName', current.lastName),
        organization: pickString(raw, 'organization', current.organization),
        title: pickString(raw, 'title', current.title),
        phone: pickString(raw, 'phone', current.phone),
        email: pickString(raw, 'email', current.email),
        url: pickString(raw, 'url', current.url),
        note: pickString(raw, 'note', current.note),
      };
    case 'email':
      return {
        category: 'email',
        to: pickString(raw, 'to', current.to),
        subject: pickString(raw, 'subject', current.subject),
        body: pickString(raw, 'body', current.body),
      };
    case 'sms':
      return {
        category: 'sms',
        phone: pickString(raw, 'phone', current.phone),
        body: pickString(raw, 'body', current.body),
      };
    default:
      return assertNever(current);
  }
}

export class QRStore {
  private state: QRProjectState;
  private readonly listeners = new Set<StoreListener>();
  private pendingNotify = false;

  constructor(initialState: QRProjectState = createBootState()) {
    this.state = cloneState(initialState);
  }

  public getState(): QRProjectState {
    return cloneState(this.state);
  }

  public updatePayload(patch: Partial<QRPayloadData>): void {
    this.state = {
      ...this.state,
      payload: mergePayloadForCurrentCategory(this.state.payload, patch),
    };
    this.scheduleNotify();
  }

  public updateStyle(patch: Partial<QRStyleConfig>): void {
    this.state = {
      ...this.state,
      style: {
        ...this.state.style,
        ...patch,
      },
    };
    this.scheduleNotify();
  }

  public updateFrame(patch: Partial<QRFrameConfig>): void {
    this.state = {
      ...this.state,
      frame: {
        ...this.state.frame,
        ...patch,
      },
    };
    this.scheduleNotify();
  }

  public setExportSize(size: 512 | 1024 | 2048): void {
    this.state = {
      ...this.state,
      exportSize: size,
    };
    this.scheduleNotify();
  }

  public loadPreset(state: QRProjectState): void {
    this.state = cloneState(state);
    this.scheduleNotify();
  }

  public reset(): void {
    this.state = createBootState();
    this.scheduleNotify();
  }

  public subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private scheduleNotify(): void {
    if (this.pendingNotify) {
      return;
    }
    this.pendingNotify = true;

    const flush = (): void => {
      this.pendingNotify = false;
      for (const listener of this.listeners) {
        listener(this.getState());
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        flush();
      });
    } else {
      setTimeout(flush, 0);
    }
  }
}

export const store = new QRStore();
