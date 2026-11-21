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
      className="m-auto w-full max-w-2xl rounded-xl border border-slate-800 bg-[#111827] p-0 text-slate-100 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
        <h2 id="export-modal-title" className="text-base font-semibold text-slate-100">
          HTML Embed Snippet
        </h2>
        <button
          type="button"
          aria-label="Close modal"
          onClick={handleClose}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-xs leading-relaxed text-slate-300 rounded-lg border border-slate-800 bg-[#0B0F17] px-3.5 py-2.5">
          Fonts render with the viewer&apos;s system defaults; typography may vary across platforms. App fonts (Plus Jakarta Sans, JetBrains Mono) do not reach exported assets.
        </p>

        <pre
          ref={preRef}
          className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-[#0B0F17] p-4 font-mono text-xs leading-relaxed text-sky-200 whitespace-pre-wrap break-all"
        />

        <div className="flex items-center justify-between gap-4 pt-1">
          <span
            aria-live="polite"
            className={`text-xs font-medium ${
              copyStatus === 'failed' ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {copyStatus === 'copied'
              ? 'Copied'
              : copyStatus === 'failed'
                ? 'Clipboard unavailable — select snippet to copy'
                : ''}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!hasSnippet}
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 cursor-pointer"
            >
              {copyStatus === 'copied' ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
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
