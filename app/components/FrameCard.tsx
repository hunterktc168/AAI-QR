'use client';

import { useState } from 'react';
import { store } from '@/src/state/store';
import type { FrameTemplate, QRFrameConfig, TextSize } from '@/src/types/qr';
import { useStore } from './hooks/useStore';

const HEX_6_RE = /^#?[0-9a-fA-F]{6}$/;

const TEMPLATE_OPTIONS: ReadonlyArray<{
  value: FrameTemplate;
  label: string;
}> = [
  { value: 'none', label: 'None' },
  { value: 'bottom-banner', label: 'Bottom Banner' },
  { value: 'top-badge', label: 'Top Badge' },
  { value: 'card-border', label: 'Card Border' },
];

const FONT_OPTIONS: ReadonlyArray<{
  value: QRFrameConfig['fontFamily'];
  label: string;
}> = [
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
];

const TEXT_SIZE_OPTIONS: ReadonlyArray<{
  value: TextSize;
  label: string;
}> = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Med' },
  { value: 'lg', label: 'Large' },
];

function normalizeHex(raw: string): string | null {
  const trimmed = raw.trim();
  if (!HEX_6_RE.test(trimmed)) {
    return null;
  }
  const body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  return `#${body.toLowerCase()}`;
}

function FrameMiniPreview({ template }: { template: FrameTemplate }) {
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex h-12 w-12 flex-col items-center justify-center rounded border border-slate-700 bg-slate-900 p-1"
    >
      {template === 'none' && (
        <div className="h-8 w-8 rounded-xs bg-slate-200/80" />
      )}
      {template === 'bottom-banner' && (
        <div className="flex h-full w-full flex-col justify-between">
          <div className="mx-auto h-6 w-6 rounded-xs bg-slate-200/80" />
          <div className="h-2.5 w-full rounded-xs bg-sky-400/70" />
        </div>
      )}
      {template === 'top-badge' && (
        <div className="flex h-full w-full flex-col justify-between">
          <div className="h-2 w-full rounded-xs bg-sky-400/70" />
          <div className="mx-auto h-6 w-6 rounded-xs bg-slate-200/80" />
        </div>
      )}
      {template === 'card-border' && (
        <div className="flex h-full w-full flex-col items-center justify-between rounded-xs border-2 border-sky-400/70 p-0.5">
          <div className="h-1 w-6 rounded-full bg-slate-300/70" />
          <div className="h-5 w-5 rounded-xs bg-slate-200/80" />
          <div className="h-1 w-5 rounded-full bg-slate-400/60" />
        </div>
      )}
    </div>
  );
}

interface FrameHexInputProps {
  id: string;
  label: string;
  value: string;
  onCommit: (hex: string) => void;
}

function FrameHexInput({ id, label, value, onCommit }: FrameHexInputProps) {
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
          placeholder="#1e293b"
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
          Enter a 6-digit hex color (e.g. #1e293b).
        </p>
      )}
    </div>
  );
}

export default function FrameCard() {
  const { frame } = useStore();
  const isFrameless = frame.template === 'none';

  const inputClass =
    'w-full rounded-lg border border-slate-800 bg-[#0B0F17] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 disabled:opacity-45 disabled:cursor-not-allowed transition-colors';

  return (
    <section
      aria-labelledby="frame-card-heading"
      className="rounded-xl border border-slate-800 bg-[#111827] p-5 sm:p-6 space-y-5"
    >
      <div>
        <h2 id="frame-card-heading" className="text-base font-semibold text-slate-100">
          Frame &amp; Text
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Card template, call-to-action copy, system font stack, and frame palette
        </p>
      </div>

      {/* Template selector */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-slate-300">
          Frame Template
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TEMPLATE_OPTIONS.map((opt) => {
            const active = frame.template === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => store.updateFrame({ template: opt.value })}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  active
                    ? 'border-sky-400/60 bg-sky-500/10 text-sky-200'
                    : 'border-slate-800 bg-[#0B0F17] text-slate-300 hover:border-slate-700'
                }`}
              >
                <FrameMiniPreview template={opt.value} />
                <span className="whitespace-nowrap">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Headline & Sublabel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="frame-label" className="block text-xs font-medium text-slate-300 mb-1.5">
            Headline
          </label>
          <input
            id="frame-label"
            type="text"
            disabled={isFrameless}
            value={frame.label}
            onChange={(e) => store.updateFrame({ label: e.target.value })}
            placeholder="SCAN ME"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="frame-sublabel" className="block text-xs font-medium text-slate-300 mb-1.5">
            Sublabel
          </label>
          <input
            id="frame-sublabel"
            type="text"
            disabled={isFrameless}
            value={frame.sublabel}
            onChange={(e) => store.updateFrame({ sublabel: e.target.value })}
            placeholder="Point your camera to open"
            className={inputClass}
          />
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-slate-300">
          Frame Font Stack
        </span>
        <div className="grid grid-cols-3 gap-2">
          {FONT_OPTIONS.map((opt) => {
            const active = frame.fontFamily === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => store.updateFrame({ fontFamily: opt.value })}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
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

      {/* Text Size */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-slate-300">
          Text Size
        </span>
        <div className="grid grid-cols-3 gap-2">
          {TEXT_SIZE_OPTIONS.map((opt) => {
            const active = frame.textSize === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => store.updateFrame({ textSize: opt.value })}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
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

      {/* Frame Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FrameHexInput
          id="frame-bg-hex"
          label="Frame Background"
          value={frame.frameBgColor}
          onCommit={(frameBgColor) => store.updateFrame({ frameBgColor })}
        />
        <FrameHexInput
          id="frame-text-hex"
          label="Frame Text Color"
          value={frame.textColor}
          onCommit={(textColor) => store.updateFrame({ textColor })}
        />
      </div>
    </section>
  );
}
