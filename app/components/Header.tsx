'use client';

import { QrCode, RotateCcw } from 'lucide-react';
import { PRESETS } from '@/src/state/presets';
import { store } from '@/src/state/store';
import type { QRProjectState } from '@/src/types/qr';
import { useStore } from './hooks/useStore';

type PresetKey = keyof typeof PRESETS;

const PRESET_BUTTONS: ReadonlyArray<{ key: PresetKey; label: string }> = [
  { key: 'menu', label: 'Menu' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'website', label: 'Website' },
  { key: 'vcard', label: 'vCard' },
];

function serializeComparable(state: QRProjectState): string {
  return JSON.stringify({
    payload: state.payload,
    style: state.style,
    frame: state.frame,
  });
}

export default function Header() {
  const state = useStore();
  const activeSignature = serializeComparable(state);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5 shrink-0">
          <QrCode className="h-5 w-5 text-sky-400 shrink-0" aria-hidden="true" />
          <span className="text-base font-semibold tracking-tight text-slate-50 whitespace-nowrap">
            QR Studio
          </span>
        </div>

        <div
          role="group"
          aria-label="Starter presets"
          className="hidden sm:flex items-center gap-1.5 overflow-x-auto"
        >
          {PRESET_BUTTONS.map(({ key, label }) => {
            const isActive =
              activeSignature === serializeComparable(PRESETS[key]);
            return (
              <button
                key={key}
                type="button"
                data-preset={key}
                aria-pressed={isActive}
                onClick={() => store.loadPreset(PRESETS[key])}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-400/40'
                    : 'text-slate-300 hover:text-slate-50 hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => store.reset()}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      <div
        role="group"
        aria-label="Mobile starter presets"
        className="sm:hidden flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/70 px-4 py-2"
      >
        {PRESET_BUTTONS.map(({ key, label }) => {
          const isActive =
            activeSignature === serializeComparable(PRESETS[key]);
          return (
            <button
              key={key}
              type="button"
              data-preset-mobile={key}
              aria-pressed={isActive}
              onClick={() => store.loadPreset(PRESETS[key])}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                isActive
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-400/40'
                  : 'text-slate-300 hover:text-slate-50 hover:bg-slate-800/80 border border-slate-800 bg-[#111827]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
