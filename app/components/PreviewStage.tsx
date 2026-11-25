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
  const { svg, isComposing, error } = useDebouncedCompose(state, PREVIEW_WIDTH, 80);
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
      className="lg:sticky lg:top-20 rounded-xl border border-zinc-800 bg-[#121215] p-4 sm:p-6 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="preview-stage-heading" className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-50">
          Live Preview
        </h2>

        <div
          role="status"
          aria-live="polite"
          data-contrast-badge="true"
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${
            isGoodContrast ? 'text-[#10B981]' : 'text-amber-400'
          }`}
        >
          {isGoodContrast ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          )}
          <span>{isGoodContrast ? 'Good' : 'Low Contrast'}</span>
          <span aria-hidden="true" className="text-zinc-600">
            ·
          </span>
          <span className="font-mono tabular-nums text-zinc-200">
            {contrastRatio.toFixed(1)}:1
          </span>
        </div>
      </div>

      {/* SVG Mount Surface with geometry-matched skeleton */}
      <div className="flex items-center justify-center rounded-lg border border-zinc-800 bg-[#09090B] p-4 sm:p-6 min-h-[336px]">
        {svg === null ? (
          <div
            aria-label="Loading QR preview"
            className="w-full max-w-[320px] aspect-square rounded-lg border border-zinc-800 bg-[#18181B] animate-pulse"
          />
        ) : (
          <div
            ref={stageRef}
            aria-label="Generated QR code preview"
            className={`flex items-center justify-center w-full max-w-[320px] aspect-square transition-opacity duration-150 ${
              isComposing ? 'opacity-75' : 'opacity-100'
            }`}
          />
        )}
      </div>

      {displayError !== null && (
        <p role="alert" className="text-sm text-amber-400">
          {displayError}
        </p>
      )}

      {/* Resolution Selector */}
      <div className="space-y-2">
        <span className="block text-sm sm:text-xs font-medium text-zinc-300">
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
                className={`min-h-11 sm:min-h-9 rounded-lg border px-3 py-2 text-sm sm:text-xs font-mono tabular-nums font-medium transition-colors duration-150 active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                  active
                    ? 'border-[#3B82F6]/60 bg-[#3B82F6]/15 text-blue-200'
                    : 'border-zinc-800 bg-[#09090B] text-zinc-300 hover:border-zinc-700 hover:bg-[#18181B] hover:text-zinc-100'
                }`}
              >
                {size}px
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          disabled={isEmpty}
          aria-disabled={isEmpty ? 'true' : 'false'}
          onClick={() => void runExport(downloadPNG)}
          className="inline-flex min-h-11 sm:min-h-10 items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm sm:text-xs font-semibold text-zinc-950 hover:bg-blue-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 transition-colors duration-150 whitespace-nowrap cursor-pointer"
        >
          <Download className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>PNG</span>
        </button>

        <button
          type="button"
          disabled={isEmpty}
          aria-disabled={isEmpty ? 'true' : 'false'}
          onClick={() => void runExport(downloadJPG)}
          className="inline-flex min-h-11 sm:min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-[#18181B] px-4 py-2 text-sm sm:text-xs font-semibold text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition-colors duration-150 whitespace-nowrap cursor-pointer"
        >
          <ImageIcon className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>JPG</span>
        </button>

        <button
          type="button"
          disabled={isEmpty}
          aria-disabled={isEmpty ? 'true' : 'false'}
          onClick={() => void runExport(downloadSVG)}
          className="inline-flex min-h-11 sm:min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-[#18181B] px-4 py-2 text-sm sm:text-xs font-semibold text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition-colors duration-150 whitespace-nowrap cursor-pointer"
        >
          <FileCode2 className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>SVG</span>
        </button>

        <button
          type="button"
          disabled={isEmpty}
          aria-disabled={isEmpty ? 'true' : 'false'}
          onClick={onOpenHtmlModal}
          className="inline-flex min-h-11 sm:min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-[#18181B] px-4 py-2 text-sm sm:text-xs font-semibold text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition-colors duration-150 whitespace-nowrap cursor-pointer"
        >
          <Code2 className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>HTML</span>
        </button>
      </div>
    </aside>
  );
}
