import { afterEach, describe, expect, it, vi } from 'vitest';
import { PRESETS } from '../presets';
import { QRStore, store } from '../store';
import type { QRProjectState } from '../../types/qr';

describe('QRStore & PRESETS', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    store.reset();
  });

  it('initializes with the boot state matching reset()', () => {
    const instance = new QRStore();
    expect(instance.getState()).toEqual({
      payload: { category: 'url', url: 'https://example.com' },
      style: {
        fgColor: '#0F172A',
        bgColor: '#FFFFFF',
        dotStyle: 'square',
        cornerStyle: 'square',
        errorCorrection: 'M',
        logoDataUrl: null,
      },
      frame: {
        template: 'none',
        label: '',
        sublabel: '',
        fontFamily: 'sans',
        textSize: 'md',
        frameBgColor: '#FFFFFF',
        textColor: '#0F172A',
      },
      exportSize: 1024,
    });
  });

  it('getState() returns a deep clone that cannot mutate store internals', () => {
    const instance = new QRStore();
    const snapshot = instance.getState();

    if (snapshot.payload.category === 'url') {
      snapshot.payload.url = 'https://mutated.invalid';
    }
    snapshot.style.fgColor = '#FF0000';
    snapshot.frame.label = 'MUTATED';
    snapshot.exportSize = 2048;

    const fresh = instance.getState();
    expect(fresh.payload).toEqual({ category: 'url', url: 'https://example.com' });
    expect(fresh.style.fgColor).toBe('#0F172A');
    expect(fresh.frame.label).toBe('');
    expect(fresh.exportSize).toBe(1024);
  });

  it('updatePayload merges only keys valid for the active category', () => {
    const instance = new QRStore();
    instance.updatePayload({ ssid: 'ShouldBeIgnored', url: 'https://qr.studio' });

    const state = instance.getState();
    expect(state.payload).toEqual({ category: 'url', url: 'https://qr.studio' });
    expect('ssid' in state.payload).toBe(false);

    instance.loadPreset(PRESETS.wifi);
    instance.updatePayload({ ssid: 'OfficeNet', url: 'https://ignored.invalid' });
    const wifiState = instance.getState();
    expect(wifiState.payload).toEqual({
      category: 'wifi',
      ssid: 'OfficeNet',
      password: 'welcome123',
      encryption: 'WPA',
      hidden: false,
    });
    expect('url' in wifiState.payload).toBe(false);
  });

  it('loadPreset deep-clones the incoming state so caller mutations do not leak', () => {
    const instance = new QRStore();
    const customPreset: QRProjectState = {
      payload: { ...PRESETS.wifi.payload },
      style: { ...PRESETS.wifi.style },
      frame: { ...PRESETS.wifi.frame },
      exportSize: 1024,
    };

    instance.loadPreset(customPreset);
    if (customPreset.payload.category === 'wifi') {
      customPreset.payload.ssid = 'CorruptedLater';
    }
    customPreset.style.bgColor = '#000000';
    customPreset.frame.label = 'CHANGED';

    const stored = instance.getState();
    expect(stored.payload).toEqual(PRESETS.wifi.payload);
    expect(stored.style.bgColor).toBe('#FFFFFF');
    expect(stored.frame.label).toBe('GUEST WI-FI');
  });

  it('batches multiple mutations in one frame into a single rAF notify with latest state', () => {
    const frameQueue: Array<FrameRequestCallback> = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
      frameQueue.push(cb);
      return frameQueue.length;
    });

    const instance = new QRStore();
    const received: QRProjectState[] = [];
    const unsubscribe = instance.subscribe((nextState) => {
      received.push(nextState);
    });

    instance.updatePayload({ url: 'https://step1.example' });
    instance.updateStyle({ fgColor: '#111111' });
    instance.updateFrame({ label: 'SCAN ME' });
    instance.setExportSize(2048);

    expect(frameQueue).toHaveLength(1);
    expect(received).toHaveLength(0);

    const pendingCallback = frameQueue[0];
    expect(pendingCallback).toBeDefined();
    pendingCallback?.(16);

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      payload: { category: 'url', url: 'https://step1.example' },
      style: { fgColor: '#111111' },
      frame: { label: 'SCAN ME' },
      exportSize: 2048,
    });

    // Ensure a subsequent mutation after flush schedules a new frame
    instance.reset();
    expect(frameQueue).toHaveLength(2);
    frameQueue[1]?.(32);

    expect(received).toHaveLength(2);
    expect(received[1]?.payload).toEqual({
      category: 'url',
      url: 'https://example.com',
    });

    unsubscribe();
    instance.setExportSize(512);
    frameQueue[2]?.(48);
    expect(received).toHaveLength(2);
  });

  it('exports deeply frozen PRESETS with all four presets at exportSize 1024', () => {
    expect(Object.isFrozen(PRESETS)).toBe(true);
    for (const preset of [PRESETS.menu, PRESETS.wifi, PRESETS.website, PRESETS.vcard]) {
      expect(preset.exportSize).toBe(1024);
      expect(Object.isFrozen(preset)).toBe(true);
      expect(Object.isFrozen(preset.payload)).toBe(true);
      expect(Object.isFrozen(preset.style)).toBe(true);
      expect(Object.isFrozen(preset.frame)).toBe(true);
    }
  });

  it('skips listeners unsubscribed mid-flush by an earlier listener', () => {
    const frameQueue: Array<FrameRequestCallback> = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
      frameQueue.push(cb);
      return frameQueue.length;
    });

    const instance = new QRStore();
    let secondCalled = false;
    let unsubSecond: () => void = () => {};

    instance.subscribe(() => {
      unsubSecond();
    });
    unsubSecond = instance.subscribe(() => {
      secondCalled = true;
    });

    instance.setExportSize(512);
    frameQueue[0]?.(16);
    expect(secondCalled).toBe(false);
  });
});
