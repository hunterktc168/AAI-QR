'use client';

import { useState } from 'react';
import { MotionConfig } from 'motion/react';
import { PRESETS } from '@/src/state/presets';
import { store } from '@/src/state/store';
import type { QRProjectState } from '@/src/types/qr';
import ExportModal from './components/ExportModal';
import FrameCard from './components/FrameCard';
import Header from './components/Header';
import MobileBar from './components/MobileBar';
import PayloadCard from './components/PayloadCard';
import PreviewStage from './components/PreviewStage';
import StyleCard from './components/StyleCard';
import { useStore } from './components/hooks/useStore';

type PresetKey = keyof typeof PRESETS;

const MOBILE_PRESETS: ReadonlyArray<{ key: PresetKey; label: string }> = [
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

export default function HomePage() {
  const [htmlModalOpen, setHtmlModalOpen] = useState<boolean>(false);
  const state = useStore();
  const activeSignature = serializeComparable(state);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col pb-24 lg:pb-12">
        <Header />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 max-w-2xl space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50 text-balance">
              QR Code Studio
            </h1>
            <p className="text-base leading-relaxed text-zinc-400">
              Configure your QR payload, verify contrast, customize styling and frames, and export crisp assets at print resolution.
            </p>
          </div>

          {/* Non-sticky mobile starter presets keep sticky chrome compact */}
          <div
            role="group"
            aria-label="Mobile starter presets"
            className="sm:hidden mb-6 flex items-center gap-2 overflow-x-auto pb-1"
          >
            {MOBILE_PRESETS.map(({ key, label }) => {
              const isActive = activeSignature === serializeComparable(PRESETS[key]);
              return (
                <button
                  key={key}
                  type="button"
                  data-preset-mobile={key}
                  aria-pressed={isActive}
                  onClick={() => store.loadPreset(PRESETS[key])}
                  className={`min-h-11 min-w-11 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                    isActive
                      ? 'border-[#3B82F6]/60 bg-[#3B82F6]/12 text-blue-200'
                      : 'border-zinc-800 bg-[#121215] text-zinc-300 hover:border-zinc-700 hover:bg-[#18181B] hover:text-zinc-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <PayloadCard />
              <StyleCard />
              <FrameCard />
            </div>

            <div className="lg:col-span-5">
              <PreviewStage onOpenHtmlModal={() => setHtmlModalOpen(true)} />
            </div>
          </div>
        </main>

        <MobileBar onOpenHtmlModal={() => setHtmlModalOpen(true)} />
        <ExportModal open={htmlModalOpen} onClose={() => setHtmlModalOpen(false)} />
      </div>
    </MotionConfig>
  );
}
