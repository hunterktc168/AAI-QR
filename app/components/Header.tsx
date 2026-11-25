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
    <header className="sticky top-0 z-30 h-14 border-b border-zinc-800 bg-[#09090B]/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 shrink-0">
          <QrCode
            className="h-5 w-5 text-[#3B82F6] shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="text-base font-semibold tracking-tight text-zinc-50 whitespace-nowrap">
            QR Studio
          </span>
        </div>

        <div
          role="group"
          aria-label="Starter presets"
          className="hidden sm:flex items-center gap-1 rounded-lg border border-zinc-800 bg-[#121215] p-1"
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
                className={`min-h-8 rounded-md px-3 py-1 text-xs font-medium transition-colors duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                  isActive
                    ? 'bg-[#3B82F6]/15 text-blue-200 border border-[#3B82F6]/50'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181B] border border-transparent'
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
          className="inline-flex min-h-11 sm:min-h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-[#121215] px-3.5 py-1.5 text-sm sm:text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-[#18181B] hover:text-zinc-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw
            className="h-4 w-4 text-zinc-400 shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}
