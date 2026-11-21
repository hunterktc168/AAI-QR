'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { store } from '@/src/state/store';
import { downloadJPG, downloadPNG, downloadSVG } from '@/src/utils/qrExporter';
import { serializePayload } from '@/src/utils/qrSerializer';
import { useStore } from './hooks/useStore';

const RESOLUTIONS: ReadonlyArray<512 | 1024 | 2048> = [512, 1024, 2048];

export default function MobileBar() {
  const state = useStore();
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
      className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-[#0B0F17]/90 backdrop-blur-md px-4 py-2.5"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
        <div className="flex items-center gap-1">
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
                className={`rounded border px-2 py-1.5 text-[11px] font-mono tabular-nums font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 ${
                  active
                    ? 'border-sky-400/50 bg-sky-500/15 text-sky-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isEmpty}
            aria-disabled={isEmpty ? 'true' : 'false'}
            onClick={() => void runExport(downloadPNG)}
            className="inline-flex items-center gap-1 rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            <Download className="h-3 w-3" aria-hidden="true" />
            <span>PNG</span>
          </button>
          <button
            type="button"
            disabled={isEmpty}
            aria-disabled={isEmpty ? 'true' : 'false'}
            onClick={() => void runExport(downloadJPG)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-100 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            JPG
          </button>
          <button
            type="button"
            disabled={isEmpty}
            aria-disabled={isEmpty ? 'true' : 'false'}
            onClick={() => void runExport(downloadSVG)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-100 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            SVG
          </button>
        </div>
      </div>
      {exportError !== null && (
        <p role="alert" className="mx-auto max-w-2xl pt-1.5 text-xs text-amber-400">
          {exportError}
        </p>
      )}
    </div>
  );
}
