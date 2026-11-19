import { describe, expect, it } from 'vitest';
import { serializePayload } from '../qrSerializer';

describe('serializePayload', () => {
  it('1. escapes ;, ,, :, and \\ in Wi-Fi SSID and password', () => {
    const out = serializePayload({
      category: 'wifi',
      ssid: 'My;Net,Work:1\\2',
      password: 'p;a,s:s\\w',
      encryption: 'WPA',
      hidden: false,
    });

    expect(out).toBe('WIFI:T:WPA;S:My\\;Net\\,Work\\:1\\\\2;P:p\\;a\\,s\\:s\\\\w;;');
  });

  it('2. omits H: token when Wi-Fi hidden is false', () => {
    const out = serializePayload({
      category: 'wifi',
      ssid: 'Cafe',
      password: 'secret',
      encryption: 'WPA',
      hidden: false,
    });

    expect(out).toBe('WIFI:T:WPA;S:Cafe;P:secret;;');
    expect(out).not.toContain('H:');
  });

  it('3. emits H:true; when Wi-Fi hidden is true', () => {
    const out = serializePayload({
      category: 'wifi',
      ssid: 'Cafe',
      password: 'secret',
      encryption: 'WPA',
      hidden: true,
    });

    expect(out).toBe('WIFI:T:WPA;S:Cafe;P:secret;H:true;;');
  });

  it('emits empty password P:; when Wi-Fi encryption is nopass', () => {
    const out = serializePayload({
      category: 'wifi',
      ssid: 'Guest',
      password: 'ignored',
      encryption: 'nopass',
      hidden: false,
    });

    expect(out).toBe('WIFI:T:nopass;S:Guest;P:;;');
  });

  it('4. uses \\r\\n line endings in vCard output, not bare \\n', () => {
    const out = serializePayload({
      category: 'vcard',
      firstName: 'Ada',
      lastName: 'Lovelace',
      organization: 'Analytical Engine',
      title: 'Mathematician',
      phone: '+123456789',
      email: 'ada@example.com',
      url: 'https://example.com',
      note: 'Line 1\nLine 2',
    });

    expect(out).toContain('\r\n');
    expect(out.replace(/\r\n/g, '')).not.toContain('\n');
    expect(out).toContain('NOTE:Line 1\\nLine 2\r\n');
  });

  it('5. escapes ;, ,, \\, and newlines inside vCard fields', () => {
    const out = serializePayload({
      category: 'vcard',
      firstName: 'Ada',
      lastName: 'Lovelace',
      organization: 'R&D; Lab, Inc\\HQ',
      title: '',
      phone: '',
      email: '',
      url: '',
      note: '',
    });

    expect(out).toContain('ORG:R&D\\; Lab\\, Inc\\\\HQ\r\n');
  });

  it('6. URI-encodes mailto: subject and body including & and =', () => {
    const out = serializePayload({
      category: 'email',
      to: 'a@b.com',
      subject: 'Q&A = Fun',
      body: 'x=1&y=2',
    });

    expect(out).toBe('mailto:a@b.com?subject=Q%26A%20%3D%20Fun&body=x%3D1%26y%3D2');
  });

  it('7. URI-encodes smsto: body', () => {
    const out = serializePayload({
      category: 'sms',
      phone: '+855123456',
      body: 'Hello & welcome = 100%',
    });

    expect(out).toBe('smsto:+855123456:Hello%20%26%20welcome%20%3D%20100%25');
  });

  it('8. falls back to https://example.com for empty URL', () => {
    expect(serializePayload({ category: 'url', url: '' })).toBe('https://example.com');
    expect(serializePayload({ category: 'url', url: '   ' })).toBe('https://example.com');
  });

  it('9. returns empty string for empty text', () => {
    expect(serializePayload({ category: 'text', text: '' })).toBe('');
  });

  it('13. omits &body= when email has subject only', () => {
    const out = serializePayload({
      category: 'email',
      to: 'a@b.com',
      subject: 'Hi',
      body: '',
    });

    expect(out).toBe('mailto:a@b.com?subject=Hi');
    expect(out).not.toContain('body=');
  });

  it('14. omits ?subject= when email has body only', () => {
    const out = serializePayload({
      category: 'email',
      to: 'a@b.com',
      subject: '',
      body: 'Hi',
    });

    expect(out).toBe('mailto:a@b.com?body=Hi');
    expect(out).not.toContain('subject=');
  });

  it('15. returns empty string when email to is empty', () => {
    const out = serializePayload({
      category: 'email',
      to: '   ',
      subject: 'Hi',
      body: 'Hello',
    });

    expect(out).toBe('');
  });

  it('16. trims FN when one vCard name part is empty', () => {
    const out = serializePayload({
      category: 'vcard',
      firstName: 'Jane',
      lastName: '',
      organization: '',
      title: '',
      phone: '',
      email: '',
      url: '',
      note: '',
    });

    expect(out).toContain('N:;Jane;;;\r\nFN:Jane\r\n');
    expect(out).not.toContain('FN:Jane ');
  });

  it('17. returns empty string when all vCard fields are empty', () => {
    const out = serializePayload({
      category: 'vcard',
      firstName: '',
      lastName: '',
      organization: '',
      title: '',
      phone: '',
      email: '',
      url: '',
      note: '',
    });

    expect(out).toBe('');
  });

  it('18. emits N:;;;; and FN: for email-only vCard', () => {
    const out = serializePayload({
      category: 'vcard',
      firstName: '',
      lastName: '',
      organization: '',
      title: '',
      phone: '',
      email: 'jane@example.com',
      url: '',
      note: '',
    });

    expect(out).toContain('N:;;;;\r\n');
    expect(out).toContain('FN:\r\n');
    expect(out).toContain('EMAIL:jane@example.com\r\n');
  });

  it('19. returns empty string when Wi-Fi SSID is empty', () => {
    const out = serializePayload({
      category: 'wifi',
      ssid: '   ',
      password: 'secret',
      encryption: 'WPA',
      hidden: false,
    });

    expect(out).toBe('');
  });

  it('20. returns empty string when SMS phone is empty', () => {
    const out = serializePayload({
      category: 'sms',
      phone: '   ',
      body: 'Hello',
    });

    expect(out).toBe('');
  });

  it('21. returns empty string for whitespace-only text', () => {
    expect(serializePayload({ category: 'text', text: '   ' })).toBe('');
  });
});
