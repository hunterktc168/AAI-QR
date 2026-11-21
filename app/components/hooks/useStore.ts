'use client';

import { useSyncExternalStore } from 'react';
import { store } from '@/src/state/store';
import type { QRProjectState } from '@/src/types/qr';

let cachedSnapshot: QRProjectState = store.getState();

function subscribe(onStoreChange: () => void): () => void {
  cachedSnapshot = store.getState();
  return store.subscribe((nextState) => {
    cachedSnapshot = nextState;
    onStoreChange();
  });
}

function getSnapshot(): QRProjectState {
  return cachedSnapshot;
}

export function useStore(): QRProjectState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
