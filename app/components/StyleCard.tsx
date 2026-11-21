'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { store } from '@/src/state/store';
import type { CornerStyle, DotStyle, ErrorCorrectionLevel } from '@/src/types/qr';
import { useStore } from './hooks/useStore';

const HEX_6_RE = /^#?[0-9a-fA-F]{6}$/;
const MAX_LOGO_BYTES = 1024 * 1024;
const MAX_LOGO_EDGE_PX = 256;

const CURATED_SWATCHES: ReadonlyArray<{
  id: string;
  label: string;
  fg: string;
  bg: string;
}> = [
  { id: 'classic', label: 'Black / White', fg: '#000000', bg: '#ffffff' },
  { id: 'slate', label: 'Slate / White', fg: '#0f172a', bg: '#ffffff' },
  { id: 'cream', label: 'Slate / Cream', fg: '#1e293b', bg: '#fffbeb' },
  { id: 'emerald', label: 'Emerald / White', fg: '#065f46', bg: '#ffffff' },
  { id: 'crimson', label: 'Crimson / Rose', fg: '#7f1d1d', bg: '#fef2f2' },
  { id: 'cobalt', label: 'Cobalt / Ice', fg: '#1e3a8a', bg: '#eff6ff' },
];

const DOT_OPTIONS: ReadonlyArray<{ value: DotStyle; label: string }> = [
  { value: 'square', label: 'Square' },
  { value: 'dots', label: 'Dots' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
  { value: 'classy', label: 'Classy' },
];

const CORNER_OPTIONS: ReadonlyArray<{ value: CornerStyle; label: string }> = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
];

const EC_OPTIONS: ReadonlyArray<{ value: ErrorCorrectionLevel; label: string }> = [
  { value: 'L', label: 'L (7%)' },
  { value: 'M', label: 'M (15%)' },
  { value: 'Q', label: 'Q (25%)' },
  { value: 'H', label: 'H (30%)' },
];

function normalizeHex(raw: string): string | null {
  const trimmed = raw.trim();
  if (!HEX_6_RE.test(trimmed)) {
    return null;
  }
  const body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  return `#${body.toLowerCase()}`;
}

interface HexInputControlProps {
  id: string;
  label: string;
  value: string;
  onCommit: (hex: string) => void;
}

function HexInputControl({ id, label, value, onCommit }: HexInputControlProps) {
  const [draft, setDraft] = useState<{ baseProp: string; text: string }>({
    baseProp: value,
    text: value,
  });

  const normalizedProp = value.toLowerCase();
  const isLocalDraft = draft.baseProp === value;
  const displayText = isLocalDraft ? draft.text : normalizedProp;
  const isInvalid =
    isLocalDraft &&
    draft.text.toLowerCase() !== normalizedProp &&
    normalizeHex(draft.text) === null;

  const handleTextChange = (nextRaw: string): void => {
    const normalized = normalizeHex(nextRaw);
    if (normalized !== null) {
      setDraft({ baseProp: value, text: normalized });
      onCommit(normalized);
    } else {
      setDraft({ baseProp: value, text: nextRaw });
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={normalizedProp}
          onChange={(e) => {
            const next = e.target.value.toLowerCase();
            setDraft({ baseProp: value, text: next });
            onCommit(next);
          }}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-slate-700 bg-[#0B0F17] p-0.5"
        />
        <input
          id={id}
          type="text"
          value={displayText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="#0f172a"
          spellCheck={false}
          aria-invalid={isInvalid}
          className={`w-full rounded-lg border bg-[#0B0F17] px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 transition-colors ${
            isInvalid
              ? 'border-amber-500/70 focus:border-amber-400 focus:ring-amber-400/50'
              : 'border-slate-800 focus:border-sky-400 focus:ring-sky-400/50'
          }`}
        />
      </div>
      {isInvalid && (
        <p role="alert" className="mt-1 text-xs text-amber-400">
          Enter a 6-digit hex color (e.g. #0f172a).
        </p>
      )}
    </div>
  );
}

export default function StyleCard() {
  const { style } = useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadSeqRef = useRef<number>(0);
  const [logoError, setLogoError] = useState<string | null>(null);

  const handleLogoUpload = async (file: File | undefined): Promise<void> => {
    if (!file) {
      return;
    }
    const seq = ++uploadSeqRef.current;
    setLogoError(null);

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Logo image must be 1 MB or smaller.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      try {
        if (seq !== uploadSeqRef.current) {
          return;
        }
        const longEdge = Math.max(bitmap.width, bitmap.height);
        const scale = longEdge > MAX_LOGO_EDGE_PX ? MAX_LOGO_EDGE_PX / longEdge : 1;
        const targetW = Math.max(1, Math.round(bitmap.width * scale));
        const targetH = Math.max(1, Math.round(bitmap.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (seq === uploadSeqRef.current) {
            setLogoError('Unable to initialize canvas for image resize.');
          }
          return;
        }
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL('image/png');
        if (seq === uploadSeqRef.current) {
          store.updateStyle({ logoDataUrl: dataUrl });
        }
      } finally {
        bitmap.close();
      }
    } catch {
      if (seq === uploadSeqRef.current) {
        setLogoError('Unsupported or unreadable image file.');
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearLogo = (): void => {
    uploadSeqRef.current += 1;
    setLogoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    store.updateStyle({ logoDataUrl: null });
  };

  return (
    <section
      aria-labelledby="style-card-heading"
      className="rounded-xl border border-slate-800 bg-[#111827] p-5 sm:p-6 space-y-6"
    >
      <div>
        <h2 id="style-card-heading" className="text-base font-semibold text-slate-100">
          Style &amp; Colors
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Palette contrast, module geometry, error correction, and center logo
        </p>
      </div>

      {/* Curated high-contrast swatches */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-slate-300">
          High-Contrast Swatches (7:1+)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CURATED_SWATCHES.map((swatch) => {
            const active =
              style.fgColor.toLowerCase() === swatch.fg &&
              style.bgColor.toLowerCase() === swatch.bg;
            return (
              <button
                key={swatch.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  store.updateStyle({ fgColor: swatch.fg, bgColor: swatch.bg })
                }
                className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  active
                    ? 'border-sky-400/60 bg-sky-500/10 text-sky-200'
                    : 'border-slate-800 bg-[#0B0F17] text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center shrink-0">
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 rounded-l border border-slate-700"
                    style={{ backgroundColor: swatch.fg }}
                  />
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 rounded-r border border-l-0 border-slate-700"
                    style={{ backgroundColor: swatch.bg }}
                  />
                </span>
                <span className="truncate">{swatch.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Foreground & Background Color Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HexInputControl
          id="style-fg-hex"
          label="Foreground Color"
          value={style.fgColor}
          onCommit={(fgColor) => store.updateStyle({ fgColor })}
        />
        <HexInputControl
          id="style-bg-hex"
          label="Background Color"
          value={style.bgColor}
          onCommit={(bgColor) => store.updateStyle({ bgColor })}
        />
      </div>

      {/* Dot Style */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-slate-300">
          Module Shape
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {DOT_OPTIONS.map((opt) => {
            const active = style.dotStyle === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => store.updateStyle({ dotStyle: opt.value })}
                className={`rounded-md border px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  active
                    ? 'border-sky-400/50 bg-sky-500/15 text-sky-300'
                    : 'border-slate-800 bg-[#0B0F17] text-slate-300 hover:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Corner Style & Error Correction */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="block text-xs font-medium text-slate-300">
            Corner Markers
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {CORNER_OPTIONS.map((opt) => {
              const active = style.cornerStyle === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => store.updateStyle({ cornerStyle: opt.value })}
                  className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors whitespace-nowrap truncate cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    active
                      ? 'border-sky-400/50 bg-sky-500/15 text-sky-300'
                      : 'border-slate-800 bg-[#0B0F17] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-medium text-slate-300">
            Error Correction
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {EC_OPTIONS.map((opt) => {
              const active = style.errorCorrection === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => store.updateStyle({ errorCorrection: opt.value })}
                  className={`rounded-md border px-2 py-2 text-xs font-medium font-mono tabular-nums transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    active
                      ? 'border-sky-400/50 bg-sky-500/15 text-sky-300'
                      : 'border-slate-800 bg-[#0B0F17] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="space-y-2 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-300">
            Center Logo (max 1 MB · resized to 256px)
          </span>
          {style.logoDataUrl !== null && (
            <button
              type="button"
              onClick={handleClearLogo}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear logo</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-900 cursor-pointer transition-colors">
            <ImagePlus className="h-4 w-4 text-sky-400" aria-hidden="true" />
            <span>{style.logoDataUrl ? 'Replace image' : 'Upload image'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                void handleLogoUpload(file);
              }}
              className="sr-only"
            />
          </label>

          {style.logoDataUrl !== null && (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={style.logoDataUrl}
                alt="Uploaded center logo"
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-md border border-slate-700 bg-white object-contain p-0.5"
              />
              <span className="text-xs text-slate-400">Active</span>
            </div>
          )}
        </div>

        {logoError !== null && (
          <p role="alert" className="text-xs text-amber-400">
            {logoError}
          </p>
        )}
      </div>
    </section>
  );
}
