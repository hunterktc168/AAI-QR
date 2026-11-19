import type {
  EmailPayload,
  QRPayloadData,
  SmsPayload,
  VCardPayload,
  WifiPayload,
} from '../types/qr';

function assertNever(value: never): never {
  throw new Error(`Unhandled QR payload category: ${JSON.stringify(value)}`);
}

function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:])/g, '\\$1');
}

function serializeWifi(payload: WifiPayload): string {
  if (payload.ssid.trim() === '') {
    return '';
  }

  const ssid = escapeWifiField(payload.ssid);
  const password =
    payload.encryption === 'nopass' ? '' : escapeWifiField(payload.password);
  const hiddenToken = payload.hidden ? 'H:true;' : '';

  return `WIFI:T:${payload.encryption};S:${ssid};P:${password};${hiddenToken};`;
}

function escapeVCardField(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function serializeVCard(payload: VCardPayload): string {
  const fields: readonly string[] = [
    payload.firstName,
    payload.lastName,
    payload.organization,
    payload.title,
    payload.phone,
    payload.email,
    payload.url,
    payload.note,
  ];

  if (fields.every((field) => field.trim() === '')) {
    return '';
  }

  const displayName = [payload.firstName, payload.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardField(payload.lastName)};${escapeVCardField(payload.firstName)};;;`,
    `FN:${escapeVCardField(displayName)}`,
  ];

  const optionalLines: ReadonlyArray<readonly [string, string]> = [
    ['ORG', payload.organization],
    ['TITLE', payload.title],
    ['TEL;TYPE=CELL', payload.phone],
    ['EMAIL', payload.email],
    ['URL', payload.url],
    ['NOTE', payload.note],
  ];

  for (const [key, rawValue] of optionalLines) {
    if (rawValue.trim() !== '') {
      lines.push(`${key}:${escapeVCardField(rawValue)}`);
    }
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function serializeEmail(payload: EmailPayload): string {
  const to = payload.to.trim();
  if (to === '') {
    return '';
  }

  const params: string[] = [];
  if (payload.subject !== '') {
    params.push(`subject=${encodeURIComponent(payload.subject)}`);
  }
  if (payload.body !== '') {
    params.push(`body=${encodeURIComponent(payload.body)}`);
  }

  return params.length > 0 ? `mailto:${to}?${params.join('&')}` : `mailto:${to}`;
}

function serializeSms(payload: SmsPayload): string {
  const phone = payload.phone.trim();
  if (phone === '') {
    return '';
  }

  return `smsto:${phone}:${encodeURIComponent(payload.body)}`;
}

export function serializePayload(payload: QRPayloadData): string {
  switch (payload.category) {
    case 'url': {
      const trimmed = payload.url.trim();
      return trimmed === '' ? 'https://example.com' : trimmed;
    }
    case 'text':
      return payload.text.trim() === '' ? '' : payload.text;
    case 'wifi':
      return serializeWifi(payload);
    case 'vcard':
      return serializeVCard(payload);
    case 'email':
      return serializeEmail(payload);
    case 'sms':
      return serializeSms(payload);
    default:
      return assertNever(payload);
  }
}
