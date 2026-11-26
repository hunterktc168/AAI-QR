'use client';

import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { SignDocument } from '@/src/types/sign';
import {
  buildSampleSignA,
  buildSampleSignB,
  buildSampleSignC,
} from '@/src/utils/sampleSigns';
import { composeSignSvg } from '@/src/utils/signComposer';

async function svgToPngBlob(
  svg: SVGSVGElement,
  targetWidth = 2480,
  targetHeight = 3508,
): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svg);
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;

  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load SVG into Image for canvas conversion.'));
    img.src = dataUri;
  });

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas context unavailable.');
  }

  // Draw high-resolution image to canvas
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('canvas.toBlob returned null.'));
      }
    }, 'image/png');
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface SignCardProps {
  id: string;
  title: string;
  filename: string;
  buildDoc: () => SignDocument;
}

function SignCard({ id, title, filename, buildDoc }: SignCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const doc = buildDoc();
    void composeSignSvg(doc).then((svg) => {
      if (!active) return;
      svgRef.current = svg;
      svg.setAttribute('class', 'w-full h-auto shadow-sm block');
      if (containerRef.current) {
        containerRef.current.replaceChildren(svg);
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [buildDoc]);

  const handleDownload = async () => {
    if (!svgRef.current) return;
    setDownloading(true);
    try {
      const blob = await svgToPngBlob(svgRef.current, 2480, 3508);
      triggerDownload(blob, filename);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      id={id}
      data-sign-card={id}
      className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-[#121215] p-5"
    >
      <div className="w-full text-center">
        <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
        <span className="text-xs font-mono text-zinc-400">A4 Portrait · 210 × 297 mm</span>
      </div>

      <div
        ref={containerRef}
        data-svg-mount={id}
        className="w-full max-w-[420px] aspect-[210/297] rounded-lg border border-zinc-800 bg-[#09090B] overflow-hidden flex items-center justify-center p-2"
      >
        <div className="text-xs text-zinc-500 animate-pulse">Rendering in browser...</div>
      </div>

      <button
        type="button"
        disabled={!ready || downloading}
        onClick={() => void handleDownload()}
        data-download-btn={id}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-blue-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 transition-colors cursor-pointer"
      >
        <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        <span>{downloading ? 'Rendering PNG...' : 'Download PNG (300 DPI)'}</span>
      </button>
    </div>
  );
}

export default function SignTestPage() {
  useEffect(() => {
    // Expose browser renderer for headless capture
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__renderSignToPngBase64 = async (
        signKey: 'a' | 'b' | 'c',
      ): Promise<string> => {
        const builderMap: Record<'a' | 'b' | 'c', () => SignDocument> = {
          a: buildSampleSignA,
          b: buildSampleSignB,
          c: buildSampleSignC,
        };
        const doc = builderMap[signKey]();
        const svg = await composeSignSvg(doc);
        const blob = await svgToPngBlob(svg, 2480, 3508);
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] ?? '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#09090B] px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Sign SVG Rendering &amp; Browser Measurement Test
          </h1>
          <p className="text-sm text-zinc-400">
            Real browser Canvas 2D measurement, 3% wrap safety margin, and 300 DPI A4 (2480×3508 px) rasterization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          <SignCard
            id="sign-a"
            title="Sample A: Narrow Paragraph"
            filename="sign-a-narrow-paragraph.png"
            buildDoc={buildSampleSignA}
          />
          <SignCard
            id="sign-b"
            title="Sample B: 2-Column Damage Price List"
            filename="sign-b-damage-price-list.png"
            buildDoc={buildSampleSignB}
          />
          <SignCard
            id="sign-c"
            title="Sample C: Wi-Fi with Large Headline"
            filename="sign-c-wifi-headline.png"
            buildDoc={buildSampleSignC}
          />
        </div>
      </div>
    </main>
  );
}
