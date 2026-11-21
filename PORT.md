# QR Studio — Sandbox to Vanilla TypeScript Port Plan (§12.4)

This document maps every React sandbox component in `app/components/` to its target framework-free Vanilla TypeScript controller (`mount(root: HTMLElement): () => void`) for the Vite ship build.

## Architecture Notes

- `src/types/qr.ts`, `src/state/store.ts`, `src/state/presets.ts`, `src/utils/*`, and `src/utils/__tests__/*` are already 100% framework-free (§12.2) and require zero changes on ship.
- `app/components/hooks/useStore.ts` is replaced by direct `store.subscribe((state) => ...)` subscriptions inside each controller's `mount(root)` with the returned unsubscribe function invoked during teardown.
- `app/components/hooks/useDebouncedCompose.ts` becomes a module-scoped 80ms leading+trailing debounce helper inside `src/controllers/previewStage.ts` whose pending timer and sequence counter are cleared during teardown.

---

### Header.tsx → src/controllers/header.ts

**Vanilla signature:** `mount(root: HTMLElement): () => void`

**Port notes:**
- `useStore()` → `store.subscribe(syncActivePreset)` in `mount`, return `unsubscribe` in teardown
- Preset buttons → query `[data-preset], [data-preset-mobile]` scoped to `root`, bind `click` to `store.loadPreset(PRESETS[key])`
- Active preset sync → compare `JSON.stringify({ payload, style, frame })` (ignoring `exportSize`) and update `aria-pressed="true" | "false"` + active classes on both desktop and mobile preset buttons
- Reset button → `[data-action="reset"]` click handler calls `store.reset()`
- Icons → `createIcons` / named imports from `lucide` (`QrCode`, `RotateCcw`)
- Estimated port time: ~20 min

---

### PayloadCard.tsx → src/controllers/payloadForm.ts

**Vanilla signature:** `mount(root: HTMLElement): () => void`

**Port notes:**
- `useStore()` → `store.subscribe(renderFromState)` in `mount`, return `unsubscribe` in teardown
- Category tabs → `[role="tab"][data-category]` click handlers switch active category via `store.loadPreset({ ...store.getState(), payload: defaultPayloadFor(cat) })`; sync `aria-selected` and toggle `hidden` on matching `[role="tabpanel"]` referenced by `aria-controls`
- Field inputs → delegate or bind `input` / `change` events on `[data-field]` elements scoped to `root` to `store.updatePayload({ [field]: value })`, reading values back from `store.getState().payload`
- Wi-Fi password toggle → local boolean in `mount` closure toggling `input.type` (`password` ↔ `text`), `aria-pressed`, and `Eye` / `EyeOff` icon from `lucide`
- Estimated port time: ~40 min

---

### StyleCard.tsx → src/controllers/styleControls.ts

**Vanilla signature:** `mount(root: HTMLElement): () => void`

**Port notes:**
- `useStore()` → `store.subscribe(syncControls)` in `mount`, return `unsubscribe` in teardown
- Color pickers & hex inputs → bind `<input type="color">` directly to `store.updateStyle`; validate hex text inputs against `/^#?[0-9a-fA-F]{6}$/` and normalize to lowercase `#rrggbb` before calling `store.updateStyle`, toggling an inline `[data-error]` message when invalid
- Curated swatches → `[data-swatch]` click sets `fgColor` + `bgColor`; sync `aria-pressed` case-insensitively on state updates
- Dot shape, corner shape, EC selectors → `[data-dot]`, `[data-corner]`, `[data-ec]` click handlers call `store.updateStyle(...)`; sync `aria-pressed`
- Logo upload → `<input type="file">` change validates `file.size <= 1_048_576` (inline error on reject), resizes via `createImageBitmap` → `<canvas>` (`<= 256px` long edge) → `toDataURL('image/png')` → `store.updateStyle({ logoDataUrl })`; clear button sets `{ logoDataUrl: null }`
- Estimated port time: ~45 min

---

### FrameCard.tsx → src/controllers/frameControls.ts

**Vanilla signature:** `mount(root: HTMLElement): () => void`

**Port notes:**
- `useStore()` → `store.subscribe(syncFrameControls)` in `mount`, return `unsubscribe` in teardown
- Template cards → `[data-template]` click calls `store.updateFrame({ template })` and syncs `aria-pressed`
- Headline & sublabel inputs → `input` events call `store.updateFrame({ label })` / `store.updateFrame({ sublabel })`; disabled when `template === 'none'`
- Font family buttons → `[data-font]` click calls `store.updateFrame({ fontFamily })` and syncs `aria-pressed`
- `textSize` segmented control — three `addEventListener('click')` handlers in `mount()`, `aria-pressed` toggle, `store.updateFrame({ textSize })`. ~10 min.
- Frame bg & text color inputs → identical `/^#?[0-9a-fA-F]{6}$/` validation + lowercase `#rrggbb` normalization before calling `store.updateFrame(...)`
- Estimated port time: ~40 min

---

### PreviewStage.tsx → src/controllers/previewStage.ts

**Vanilla signature:** `mount(root: HTMLElement): () => void`

**Port notes:**
- `useStore()` → `store.subscribe(listener)` in `mount`, return `unsubscribe` in teardown
- `useDebouncedCompose` → module-scoped debounce helper (80ms leading+trailing) with sequence counter; cancel pending timer and ignore stale async resolutions in teardown
- SVG mount via `stageEl.replaceChildren(svg)` — unchanged, no `innerHTML`
- Contrast badge → `root.querySelector('[data-contrast-badge]')` scoped query, `aria-live="polite"` preserved, recomputes `getContrastRatio(fg, bg)` on every update (`>= 7.0` → `"Good"`, `< 7.0` → `"Low Contrast"`)
- Export buttons → same `qrExporter` calls (`downloadPNG`, `downloadJPG`, `downloadSVG`), attached via `addEventListener` in `mount`; HTML button invokes `exportModal.open()`
- Empty-payload guard → identical `serializePayload(state.payload) === ''` check, toggles `.disabled` + `aria-disabled="true"` on resolution and export buttons
- Estimated port time: ~45 min

---

### ExportModal.tsx → src/controllers/exportModal.ts

**Vanilla signature:** `mount(root: HTMLElement): () => void`

**Port notes:**
- Native `<dialog>` → `root.querySelector('dialog')` opened via `dialog.showModal()` and closed via `dialog.close()` (including Escape `cancel` and backdrop clicks)
- Snippet population → `await buildHTMLSnippet(store.getState())` assigned strictly via `preEl.textContent = html` (never `innerHTML`)
- Copy button → `navigator.clipboard.writeText(preEl.textContent ?? '')` and update `[data-copy-status]` (`aria-live="polite"`) to `"Copied"` with timer cleanup on teardown
- §12.3 font caveat → static text paragraph inside `<dialog>` preserved verbatim
- Estimated port time: ~20 min

---

### MobileBar.tsx → src/controllers/mobileBar.ts

**Vanilla signature:** `mount(root: HTMLElement): () => void`

**Port notes:**
- `useStore()` → `store.subscribe(syncBar)` in `mount`, return `unsubscribe` in teardown
- Resolution buttons (`512`, `1024`, `2048`) → `store.setExportSize(n)` with `aria-pressed` sync
- Export buttons (`PNG`, `JPG`, `SVG`) → bind click listeners to `downloadPNG` / `downloadJPG` / `downloadSVG(store.getState())`
- Empty-payload guard → sync `.disabled` and `aria-disabled` on all bar controls when `serializePayload(state.payload) === ''`
- Responsive visibility → `lg:hidden` Tailwind utility on `root` preserved unchanged
- Estimated port time: ~15 min
