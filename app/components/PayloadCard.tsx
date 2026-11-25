'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  UserSquare2,
  Wifi,
} from 'lucide-react';
import { store } from '@/src/state/store';
import type { QRCategory, QRPayloadData } from '@/src/types/qr';
import { useStore } from './hooks/useStore';

const CATEGORY_TABS: ReadonlyArray<{
  category: QRCategory;
  label: string;
  panelId: string;
  tabId: string;
  Icon: typeof Globe;
}> = [
  { category: 'url', label: 'Website', panelId: 'panel-url', tabId: 'tab-url', Icon: Globe },
  { category: 'wifi', label: 'Wi-Fi', panelId: 'panel-wifi', tabId: 'tab-wifi', Icon: Wifi },
  { category: 'vcard', label: 'vCard', panelId: 'panel-vcard', tabId: 'tab-vcard', Icon: UserSquare2 },
  { category: 'text', label: 'Text', panelId: 'panel-text', tabId: 'tab-text', Icon: FileText },
  { category: 'email', label: 'Email', panelId: 'panel-email', tabId: 'tab-email', Icon: Mail },
  { category: 'sms', label: 'SMS', panelId: 'panel-sms', tabId: 'tab-sms', Icon: MessageSquare },
];

function createDefaultPayload(category: QRCategory): QRPayloadData {
  switch (category) {
    case 'url':
      return { category: 'url', url: 'https://example.com' };
    case 'wifi':
      return {
        category: 'wifi',
        ssid: '',
        password: '',
        encryption: 'WPA',
        hidden: false,
      };
    case 'vcard':
      return {
        category: 'vcard',
        firstName: '',
        lastName: '',
        organization: '',
        title: '',
        phone: '',
        email: '',
        url: '',
        note: '',
      };
    case 'text':
      return { category: 'text', text: '' };
    case 'email':
      return { category: 'email', to: '', subject: '', body: '' };
    case 'sms':
      return { category: 'sms', phone: '', body: '' };
  }
}

export default function PayloadCard() {
  const state = useStore();
  const [showWifiPassword, setShowWifiPassword] = useState<boolean>(false);
  const { payload } = state;

  const handleCategorySwitch = (nextCategory: QRCategory): void => {
    if (payload.category === nextCategory) {
      return;
    }
    const current = store.getState();
    store.loadPreset({
      ...current,
      payload: createDefaultPayload(nextCategory),
    });
  };

  const inputClass =
    'w-full min-h-11 sm:min-h-10 rounded-lg border border-zinc-800 bg-[#09090B] px-3 py-2 text-base sm:text-sm leading-normal text-zinc-100 placeholder:text-zinc-500 hover:border-zinc-700 focus-visible:border-[#3B82F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 transition-colors duration-150';
  const labelClass = 'block text-sm sm:text-xs font-medium text-zinc-300 mb-2';

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="payload-card-heading"
      className="rounded-xl border border-zinc-800 bg-[#121215] p-4 sm:p-6 space-y-6"
    >
      <div className="space-y-1">
        <h2 id="payload-card-heading" className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-50">
          Content &amp; Type
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          Select a QR format and enter payload fields
        </p>
      </div>

      <div
        role="tablist"
        aria-label="QR payload categories"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 rounded-lg border border-zinc-800 bg-[#09090B] p-1"
      >
        {CATEGORY_TABS.map(({ category, label, panelId, tabId, Icon }) => {
          const selected = payload.category === category;
          return (
            <button
              key={category}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              onClick={() => handleCategorySwitch(category)}
              className={`flex min-h-11 sm:min-h-9 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm sm:text-xs font-medium transition-colors duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                selected
                  ? 'bg-[#3B82F6]/15 text-blue-200 border border-[#3B82F6]/50'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181B] border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={payload.category}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      >
        {payload.category === 'url' && (
          <fieldset
            id="panel-url"
            role="tabpanel"
            aria-labelledby="tab-url"
            className="space-y-4"
          >
            <div>
              <label htmlFor="payload-url" className={labelClass}>
                Website URL
              </label>
              <input
                id="payload-url"
                type="url"
                value={payload.url}
                onChange={(e) => store.updatePayload({ url: e.target.value })}
                placeholder="https://example.com"
                className={inputClass}
              />
            </div>
          </fieldset>
        )}

        {payload.category === 'wifi' && (
          <fieldset
            id="panel-wifi"
            role="tabpanel"
            aria-labelledby="tab-wifi"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="wifi-ssid" className={labelClass}>
                  Network Name (SSID)
                </label>
                <input
                  id="wifi-ssid"
                  type="text"
                  value={payload.ssid}
                  onChange={(e) => store.updatePayload({ ssid: e.target.value })}
                  placeholder="GuestWiFi"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="wifi-encryption" className={labelClass}>
                  Encryption
                </label>
                <select
                  id="wifi-encryption"
                  value={payload.encryption}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'WPA' || val === 'WEP' || val === 'nopass') {
                      store.updatePayload({ encryption: val });
                    }
                  }}
                  className={inputClass}
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">None (Open)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label htmlFor="wifi-password" className={labelClass}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="wifi-password"
                    type={showWifiPassword ? 'text' : 'password'}
                    disabled={payload.encryption === 'nopass'}
                    value={payload.encryption === 'nopass' ? '' : payload.password}
                    onChange={(e) => store.updatePayload({ password: e.target.value })}
                    placeholder={
                      payload.encryption === 'nopass'
                        ? 'Not required'
                        : 'Enter Wi-Fi password'
                    }
                    className={`${inputClass} pr-12 disabled:opacity-40 disabled:cursor-not-allowed`}
                  />
                  <button
                    type="button"
                    aria-label={showWifiPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showWifiPassword}
                    disabled={payload.encryption === 'nopass'}
                    onClick={() => setShowWifiPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center rounded-r-lg px-3 text-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
                  >
                    {showWifiPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <label className="flex min-h-11 sm:min-h-10 items-center gap-3 rounded-lg border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-200 hover:border-zinc-700 hover:bg-[#18181B]/60 focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/30 cursor-pointer select-none transition-colors duration-150">
                <input
                  type="checkbox"
                  checked={payload.hidden}
                  onChange={(e) => store.updatePayload({ hidden: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-[#121215] accent-[#3B82F6] focus:outline-none"
                />
                <span>Hidden network</span>
              </label>
            </div>
          </fieldset>
        )}

        {payload.category === 'vcard' && (
          <fieldset
            id="panel-vcard"
            role="tabpanel"
            aria-labelledby="tab-vcard"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label htmlFor="vc-first" className={labelClass}>
                First Name
              </label>
              <input
                id="vc-first"
                type="text"
                value={payload.firstName}
                onChange={(e) => store.updatePayload({ firstName: e.target.value })}
                placeholder="Jane"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vc-last" className={labelClass}>
                Last Name
              </label>
              <input
                id="vc-last"
                type="text"
                value={payload.lastName}
                onChange={(e) => store.updatePayload({ lastName: e.target.value })}
                placeholder="Doe"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vc-org" className={labelClass}>
                Organization
              </label>
              <input
                id="vc-org"
                type="text"
                value={payload.organization}
                onChange={(e) => store.updatePayload({ organization: e.target.value })}
                placeholder="Acme Inc"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vc-title" className={labelClass}>
                Job Title
              </label>
              <input
                id="vc-title"
                type="text"
                value={payload.title}
                onChange={(e) => store.updatePayload({ title: e.target.value })}
                placeholder="Designer"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vc-phone" className={labelClass}>
                Phone
              </label>
              <input
                id="vc-phone"
                type="tel"
                value={payload.phone}
                onChange={(e) => store.updatePayload({ phone: e.target.value })}
                placeholder="+15551234567"
                className={`${inputClass} font-mono tabular-nums`}
              />
            </div>
            <div>
              <label htmlFor="vc-email" className={labelClass}>
                Email
              </label>
              <input
                id="vc-email"
                type="email"
                value={payload.email}
                onChange={(e) => store.updatePayload({ email: e.target.value })}
                placeholder="jane@example.com"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="vc-url" className={labelClass}>
                Website
              </label>
              <input
                id="vc-url"
                type="url"
                value={payload.url}
                onChange={(e) => store.updatePayload({ url: e.target.value })}
                placeholder="https://example.com"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="vc-note" className={labelClass}>
                Note
              </label>
              <textarea
                id="vc-note"
                rows={2}
                value={payload.note}
                onChange={(e) => store.updatePayload({ note: e.target.value })}
                placeholder="Additional contact note"
                className={inputClass}
              />
            </div>
          </fieldset>
        )}

        {payload.category === 'text' && (
          <fieldset
            id="panel-text"
            role="tabpanel"
            aria-labelledby="tab-text"
            className="space-y-4"
          >
            <div>
              <label htmlFor="payload-text" className={labelClass}>
                Plain Text
              </label>
              <textarea
                id="payload-text"
                rows={4}
                value={payload.text}
                onChange={(e) => store.updatePayload({ text: e.target.value })}
                placeholder="Enter text content..."
                className={inputClass}
              />
            </div>
          </fieldset>
        )}

        {payload.category === 'email' && (
          <fieldset
            id="panel-email"
            role="tabpanel"
            aria-labelledby="tab-email"
            className="space-y-4"
          >
            <div>
              <label htmlFor="email-to" className={labelClass}>
                Recipient Email
              </label>
              <input
                id="email-to"
                type="email"
                value={payload.to}
                onChange={(e) => store.updatePayload({ to: e.target.value })}
                placeholder="hello@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email-subject" className={labelClass}>
                Subject
              </label>
              <input
                id="email-subject"
                type="text"
                value={payload.subject}
                onChange={(e) => store.updatePayload({ subject: e.target.value })}
                placeholder="Subject line"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email-body" className={labelClass}>
                Message
              </label>
              <textarea
                id="email-body"
                rows={3}
                value={payload.body}
                onChange={(e) => store.updatePayload({ body: e.target.value })}
                placeholder="Email body text..."
                className={inputClass}
              />
            </div>
          </fieldset>
        )}

        {payload.category === 'sms' && (
          <fieldset
            id="panel-sms"
            role="tabpanel"
            aria-labelledby="tab-sms"
            className="space-y-4"
          >
            <div>
              <label htmlFor="sms-phone" className={labelClass}>
                Phone Number
              </label>
              <input
                id="sms-phone"
                type="tel"
                value={payload.phone}
                onChange={(e) => store.updatePayload({ phone: e.target.value })}
                placeholder="+15551234567"
                className={`${inputClass} font-mono tabular-nums`}
              />
            </div>
            <div>
              <label htmlFor="sms-body" className={labelClass}>
                Message Body
              </label>
              <textarea
                id="sms-body"
                rows={3}
                value={payload.body}
                onChange={(e) => store.updatePayload({ body: e.target.value })}
                placeholder="SMS text..."
                className={inputClass}
              />
            </div>
          </fieldset>
        )}
      </motion.div>
    </motion.section>
  );
}
