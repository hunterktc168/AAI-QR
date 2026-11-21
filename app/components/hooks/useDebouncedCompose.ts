'use client';

import { useEffect, useRef, useState } from 'react';
import type { QRProjectState } from '@/src/types/qr';
import { composeQRSvg } from '@/src/utils/qrComposer';

export interface DebouncedComposeResult {
  svg: SVGSVGElement | null;
  isComposing: boolean;
  error: string | null;
}

export function useDebouncedCompose(
  state: QRProjectState,
  targetWidth: number,
  delayMs = 80,
): DebouncedComposeResult {
  const [svg, setSvg] = useState<SVGSVGElement | null>(null);
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lastRunRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    const runCompose = (): void => {
      const seq = ++seqRef.current;
      lastRunRef.current = Date.now();
      setIsComposing(true);
      setError(null);

      void composeQRSvg(state, targetWidth)
        .then((result) => {
          if (!active || seq !== seqRef.current) {
            return;
          }
          setSvg(result);
          setIsComposing(false);
        })
        .catch((err: unknown) => {
          if (!active || seq !== seqRef.current) {
            return;
          }
          setError(err instanceof Error ? err.message : 'Failed to render QR preview.');
          setIsComposing(false);
        });
    };

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const now = Date.now();
    const elapsed = now - lastRunRef.current;

    if (lastRunRef.current === 0 || elapsed >= delayMs) {
      runCompose();
    } else {
      const remaining = Math.max(0, delayMs - elapsed);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        runCompose();
      }, remaining);
    }

    return () => {
      active = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state, targetWidth, delayMs]);

  return { svg, isComposing, error };
}
