'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { store } from '@/src/state/store';
import { buildHTMLSnippet } from '@/src/utils/qrExporter';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [hasSnippet, setHasSnippet] = useState<boolean>(false);

  const clearCopyTimer = (): void => {
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      let cancelled = false;
      if (preRef.current) {
        preRef.current.textContent = 'Generating HTML snippet...';
      }
      void buildHTMLSnippet(store.getState())
        .then((html) => {
          if (cancelled) {
            return;
          }
          if (preRef.current) {
            preRef.current.textContent = html;
          }
          setHasSnippet(true);
        })
        .catch((err: unknown) => {
          if (cancelled) {
            return;
          }
          if (preRef.current) {
            preRef.current.textContent =
              err instanceof Error ? err.message : 'Failed to generate HTML snippet.';
          }
          setHasSnippet(false);
        });
      return () => {
        cancelled = true;
      };
    }

    clearCopyTimer();
    if (dialog.open) {
      dialog.close();
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    return () => {
      clearCopyTimer();
    };
  }, []);

  const handleCopy = async (): Promise<void> => {
    const snippet = preRef.current?.textContent ?? '';
    if (!hasSnippet || snippet === '' || typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyStatus('failed');
      return;
    }
    try {
      await navigator.clipboard.writeText(snippet);
      clearCopyTimer();
      setCopyStatus('copied');
      copyTimerRef.current = window.setTimeout(() => {
        copyTimerRef.current = null;
        setCopyStatus('idle');
      }, 1800);
    } catch {
      setCopyStatus('failed');
    }
  };

  const handleClose = (): void => {
    clearCopyTimer();
    setCopyStatus('idle');
    setHasSnippet(false);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="export-modal-title"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          handleClose();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl border border-zinc-800 bg-[#121215] p-0 text-zinc-100"
    >
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 sm:px-6 py-4">
        <h2 id="export-modal-title" className="text-lg font-semibold tracking-tight text-zinc-50">
          HTML Embed Snippet
        </h2>
        <button
          type="button"
          aria-label="Close modal"
          onClick={handleClose}
          className="inline-flex min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 items-center justify-center rounded-md border border-transparent text-zinc-400 hover:bg-[#18181B] hover:text-zinc-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] cursor-pointer transition-colors duration-150"
        >
          <X className="h-5 w-5 sm:h-4 sm:w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <p className="text-sm leading-relaxed text-zinc-400">
          Fonts render with the viewer&apos;s system defaults; typography may vary across platforms. App fonts (Plus Jakarta Sans, JetBrains Mono) do not reach exported assets.
        </p>

        <pre
          ref={preRef}
          className="max-h-80 overflow-auto rounded-lg border border-zinc-800 bg-[#09090B] p-4 font-mono tabular-nums text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap break-all"
        />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <span
            aria-live="polite"
            className={`text-sm font-medium ${
              copyStatus === 'failed' ? 'text-amber-400' : 'text-[#10B981]'
            }`}
          >
            {copyStatus === 'copied'
              ? 'Copied'
              : copyStatus === 'failed'
                ? 'Clipboard unavailable — select snippet to copy'
                : ''}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-11 sm:min-h-9 rounded-lg border border-zinc-800 bg-[#18181B] px-4 py-2 text-sm sm:text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] cursor-pointer transition-colors duration-150"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!hasSnippet}
              onClick={() => void handleCopy()}
              className="inline-flex min-h-11 sm:min-h-9 items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm sm:text-xs font-semibold text-zinc-950 hover:bg-blue-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 cursor-pointer transition-colors duration-150"
            >
              {copyStatus === 'copied' ? (
                <>
                  <Check className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>Copy HTML</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
