'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronUp, Code2, Download, FileCode2, Image as ImageIcon, SlidersHorizontal, X } from 'lucide-react';
import { store } from '@/src/state/store';
import { downloadJPG, downloadPNG, downloadSVG } from '@/src/utils/qrExporter';
import { serializePayload } from '@/src/utils/qrSerializer';
import { useStore } from './hooks/useStore';

const RESOLUTIONS: ReadonlyArray<512 | 1024 | 2048> = [512, 1024, 2048];

interface MobileBarProps {
  onOpenHtmlModal: () => void;
}

export default function MobileBar({ onOpenHtmlModal }: MobileBarProps) {
  const state = useStore();
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const isEmpty = serializePayload(state.payload) === '';

  const runExport = async (exporter: typeof downloadPNG): Promise<void> => {
    setExportError(null);
    try {
      await exporter(store.getState());
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Export failed.');
    }
  };

  return (
    <div
      role="region"
      aria-label="Mobile quick export bar"
      className="lg:hidden fixed inset-x-0 bottom-0 z-30"
    >
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              aria-hidden="true"
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            />

            <motion.div
              id="mobile-export-sheet"
              role="dialog"
              aria-label="Export options and resolution"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 border-t border-zinc-800 bg-[#121215] px-4 py-4 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold tracking-tight text-zinc-100">
                  Export Options
                </span>
                <button
                  type="button"
                  aria-label="Close export options"
                  onClick={() => setSheetOpen(false)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-zinc-800 bg-[#09090B] text-zinc-400 hover:bg-[#18181B] hover:text-zinc-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition-colors duration-150 cursor-pointer"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-medium text-zinc-400">
                  Export Resolution
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {RESOLUTIONS.map((size) => {
                    const active = state.exportSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isEmpty}
                        aria-disabled={isEmpty ? 'true' : 'false'}
                        aria-pressed={active}
                        onClick={() => store.setExportSize(size)}
                        className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-mono tabular-nums font-medium transition-colors duration-150 active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                          active
                            ? 'border-[#3B82F6]/60 bg-[#3B82F6]/15 text-blue-200'
                            : 'border-zinc-800 bg-[#09090B] text-zinc-300 hover:border-zinc-700 hover:bg-[#18181B]'
                        }`}
                      >
                        {size}px
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isEmpty}
                  aria-disabled={isEmpty ? 'true' : 'false'}
                  onClick={() => {
                    setSheetOpen(false);
                    void runExport(downloadJPG);
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-[#18181B] px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition-colors duration-150 whitespace-nowrap cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>JPG</span>
                </button>
                <button
                  type="button"
                  disabled={isEmpty}
                  aria-disabled={isEmpty ? 'true' : 'false'}
                  onClick={() => {
                    setSheetOpen(false);
                    void runExport(downloadSVG);
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-[#18181B] px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition-colors duration-150 whitespace-nowrap cursor-pointer"
                >
                  <FileCode2 className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>SVG</span>
                </button>
                <button
                  type="button"
                  disabled={isEmpty}
                  aria-disabled={isEmpty ? 'true' : 'false'}
                  onClick={() => {
                    setSheetOpen(false);
                    onOpenHtmlModal();
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-[#18181B] px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition-colors duration-150 whitespace-nowrap cursor-pointer"
                >
                  <Code2 className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>HTML</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-20 border-t border-zinc-800 bg-[#09090B]/95 backdrop-blur-md px-4 py-2">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <button
            type="button"
            aria-expanded={sheetOpen}
            aria-controls="mobile-export-sheet"
            onClick={() => setSheetOpen((prev) => !prev)}
            className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-lg border border-zinc-800 bg-[#121215] px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-[#18181B] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition-colors duration-150 whitespace-nowrap cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span className="font-mono tabular-nums">{state.exportSize}px</span>
            <ChevronUp
              className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-150 ${
                sheetOpen ? 'rotate-180' : ''
              }`}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isEmpty}
              aria-disabled={isEmpty ? 'true' : 'false'}
              onClick={() => void runExport(downloadSVG)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-zinc-800 bg-[#18181B] px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition-colors duration-150 whitespace-nowrap cursor-pointer"
            >
              SVG
            </button>
            <button
              type="button"
              disabled={isEmpty}
              aria-disabled={isEmpty ? 'true' : 'false'}
              onClick={() => void runExport(downloadPNG)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-blue-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 whitespace-nowrap cursor-pointer transition-colors duration-150"
            >
              <Download className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>PNG</span>
            </button>
          </div>
        </div>
        {exportError !== null && (
          <p role="alert" className="mx-auto max-w-2xl pt-2 text-xs text-amber-400">
            {exportError}
          </p>
        )}
      </div>
    </div>
  );
}
