'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Download,
  FileCode2,
  Image as ImageIcon,
} from 'lucide-react';
import { store } from '@/src/state/store';
import { getContrastRatio } from '@/src/utils/colorContrast';
import { downloadJPG, downloadPNG, downloadSVG } from '@/src/utils/qrExporter';
import { serializePayload } from '@/src/utils/qrSerializer';
import { useDebouncedCompose } from './hooks/useDebouncedCompose';
import { useStore } from './hooks/useStore';

const RESOLUTIONS: ReadonlyArray<512 | 1024 | 2048> = [512, 1024, 2048];
const PREVIEW_WIDTH = 320;

interface PreviewStageProps {
  onOpenHtmlModal: () => void;
}

export default function PreviewStage({ onOpenHtmlModal }: PreviewStageProps) {
  const state = useStore();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const { svg, error } = useDebouncedCompose(state, PREVIEW_WIDTH, 80);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const container = stageRef.current;
    if (!container || !svg) {
      return;
    }
    svg.setAttribute('class', 'w-full h-auto max-w-[320px] block');
    container.replaceChildren(svg);
  }, [svg]);

  const serialized = serializePayload(state.payload);
  const isEmpty = serialized === '';

  let contrastRatio = 1;
  try {
    contrastRatio = getContrastRatio(state.style.fgColor, state.style.bgColor);
  } catch {
    contrastRatio = 1;
  }
  const isGoodContrast = contrastRatio >= 7.0;

  const runExport = async (exporter: typeof downloadPNG): Promise<void> => {
    setExportError(null);
    try {
      await exporter(store.getState());
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Export failed.');
    }
  };

  const displayError = error ?? exportError;

  return (
    <aside
      aria-labelledby="preview-stage-heading"
      className="lg:sticky lg:top-20 rounded-xl border border-slate-800 bg-[#111827] p-5 sm:p-6 space-y-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="preview-stage-heading" className="text-base font-semibold text-slate-100">
          Live Preview
        </h2>

        <div
          role="status"
          aria-live="polite"
          data-contrast-badge="true"
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
            isGoodContrast
              ? 'border-emerald-500/40 bg-emerald-600/20 text-emerald-300'
              : 'border-amber-500/40 bg-amber-600/20 text-amber-300'
          }`}
        >
          {isGoodContrast ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>{isGoodContrast ? 'Good' : 'Low Contrast'}</span>
          <span className="font-mono tabular-nums opacity-85">
            {contrastRatio.toFixed(1)}:1
          </span>
        </div>
      </div>

      {/* SVG Mount Surface */}
      <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-[#0B0F17] p-6 min-h-[344px]">
        <div
          ref={stageRef}
          aria-label="Generated QR code preview"
          className="flex items-center justify-center w-full max-w-[320px] aspect-square"
        />
      </div>

      {displayError !== null && (
        <p role="alert" className="text-xs text-amber-400">
          {displayError}
        </p>
      )}

      {/* Resolution Selector */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-slate-300">
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
                className={`rounded-md border px-3 py-2 text-xs font-mono tabular-nums font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  active
                    ? 'border-sky-400/50 bg-sky-500/15 text-sky-300'
                    : 'border-slate-800 bg-[#0B0F17] text-slate-300 hover:border-slate-700'
                }`}
              >
                {size}px
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          disabled={isEmpty}
          aria-disabled={isEmpty ? 'true' : 'false'}
          onClick={() => void runExport(downloadPNG)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-3.5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>PNG</span>
        </button>

        <button
          type="button"
          disabled={isEmpty}
          aria-disabled={isEmpty ? 'true' : 'false'}
          onClick={() => void runExport(downloadJPG)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-100 hover:border-slate-600 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-colors whitespace-nowrap cursor-pointer"
        >
          <ImageIcon className="h-3.5 w-3.5 text-sky-400 shrink-0" aria-hidden="true" />
          <span>JPG</span>
        </button>

        <button
          type="button"
          disabled={isEmpty}
          aria-disabled={isEmpty ? 'true' : 'false'}
          onClick={() => void runExport(downloadSVG)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-100 hover:border-slate-600 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-colors whitespace-nowrap cursor-pointer"
        >
          <FileCode2 className="h-3.5 w-3.5 text-sky-400 shrink-0" aria-hidden="true" />
          <span>SVG</span>
        </button>

        <button
          type="button"
          disabled={isEmpty}
          aria-disabled={isEmpty ? 'true' : 'false'}
          onClick={onOpenHtmlModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-100 hover:border-slate-600 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Code2 className="h-3.5 w-3.5 text-sky-400 shrink-0" aria-hidden="true" />
          <span>HTML</span>
        </button>
      </div>
    </aside>
  );
}
