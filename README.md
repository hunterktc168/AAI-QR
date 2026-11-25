# QR Studio

A precision QR code generator and styling studio built with a framework-free TypeScript core (`src/`) and an interactive Next.js sandbox interface (`app/`).

---

## Capabilities

### 1. Six Structured QR Payload Formats
Each category validates and encodes inputs before generating the QR matrix:
- **Website (`url`)**: Standard web URLs (defaults empty input to `https://example.com`).
- **Wi-Fi (`wifi`)**: Encodes `WIFI:T:{encryption};S:{ssid};P:{password};` with escaping for `\`, `;`, `,`, and `:`, support for `WPA`, `WEP`, and open (`nopass`) networks, password visibility toggle, and optional hidden network flag (`H:true;`).
- **vCard (`vcard`)**: Generates RFC 2426 vCard 3.0 contacts with `\r\n` line endings, escaped field values, and fields for first/last name, organization, job title, phone, email, website, and note.
- **Plain Text (`text`)**: Encodes arbitrary text while guarding against whitespace-only payloads.
- **Email (`email`)**: Builds `mailto:` URIs with URL-encoded `subject` and `body`, omitting blank query parameters.
- **SMS (`sms`)**: Builds `smsto:{phone}:{encodedBody}` URIs.

When a required payload field is empty (for Wi-Fi, vCard, Text, Email, or SMS), QR Studio renders a placeholder frame and disables export actions until valid content is entered.

### 2. Styling, Contrast Verification & Center Logo
- **Live Contrast Ratio Badge**: Calculates real-time WCAG luminance contrast between foreground and background colors and flags ratios `< 7.0:1` (`Low Contrast`) vs `>= 7.0:1` (`Good`).
- **High-Contrast Swatches & Color Controls**: Six curated `7:1+` color pairs plus synced native color pickers and validated 6-digit `#rrggbb` hex inputs.
- **Module & Corner Geometry**: Five dot styles (`Square`, `Dots`, `Rounded`, `Extra Rounded`, `Classy`) and three corner marker styles (`Square`, `Dot`, `Extra Rounded`).
- **Error Correction**: Selectable `L (7%)`, `M (15%)`, `Q (25%)`, and `H (30%)`.
- **Center Logo Upload**: Accepts local image files up to `1 MB`, resizes them client-side via `createImageBitmap` and `<canvas>` to at most `256px` on the long edge, embeds them as PNG data URLs, and clears QR dots behind the logo (`hideBackgroundDots`).

### 3. Frames & Call-to-Action Typography
- **Frame Templates**: `None`, `Bottom Banner`, `Top Badge`, and `Card Border` (preserving at least a 4-module QR quiet zone inside every frame).
- **Custom Copy & Colors**: Configurable headline (up to 28 chars), sublabel (up to 44 chars), frame background color, and frame text color.
- **System Font Stacks & Text Size**: `Sans`, `Serif`, and `Mono` OS-native stacks with proportional `Small`, `Med`, and `Large` sizing (`4.0% / 5.5% / 7.5%` for labels and `2.5% / 3.5% / 4.5%` for sublabels relative to output width).

### 4. Presets & Multi-Format Export
- **Starter Presets**: One-click **Menu**, **Wi-Fi**, **Website**, and **vCard** configurations (available in the desktop header and mobile preset bar), plus **Reset** to restore the default boot state.
- **Export Resolutions**: `512px`, `1024px`, and `2048px`.
- **Export Formats**:
  - **PNG** and **JPG** (canvas-rasterized with opaque frame/QR backgrounds so rounded frames have clean corners).
  - **SVG** (self-contained vector SVG).
  - **HTML Embed Snippet** (modal preview with one-click clipboard copy and OS font note; omits `<figcaption>` when the frame template is `None`).
- **Responsive Mobile Bar**: Sticky bottom quick-export bar with an expandable export/resolution bottom sheet on screens `< 1024px`.

---

## Tech Stack

- **Core Architecture (Framework-Free)**:
  - **TypeScript (strict mode)** with `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, and `exactOptionalPropertyTypes`.
  - **State Management (`src/state/store.ts`, `src/state/presets.ts`)**: Typed `QRStore` singleton with `requestAnimationFrame`-batched subscriber notifications, deep-cloned state snapshots, and deeply frozen presets.
  - **QR Engine & Composition (`src/utils/`)**: `qr-code-styling` for matrix/SVG generation, pure payload serializer (`qrSerializer.ts`), pure contrast calculator (`colorContrast.ts`), async composite SVG builder (`qrComposer.ts`), and multi-format browser exporter (`qrExporter.ts`).
- **Sandbox UI Layer**:
  - **Next.js 15** (App Router) & **React 19** (`app/`, `app/components/`), designed with a documented port path to framework-free Vanilla TypeScript controllers in [`PORT.md`](./PORT.md).
  - **Tailwind CSS v4** with `@tailwindcss/postcss` and a 3-tier dark neutral theme (`#09090B` / `#121215` / `#18181B`).
  - **Icons**: `lucide-react` (and `lucide` for the vanilla controller target).
- **Testing & Quality**:
  - **Vitest** (`node` environment) for pure utility and store unit tests.
  - **ESLint** (`eslint-config-next`) and `tsc --noEmit`.

---

## Project Structure

```text
├── app/
│   ├── components/          # Sandbox React UI cards, preview stage, modal & hooks
│   ├── globals.css          # Tailwind v4 theme tokens & base styles
│   ├── layout.tsx           # Root layout & UI fonts
│   └── page.tsx             # Studio workspace shell
├── src/                     # Framework-free core modules
│   ├── types/qr.ts          # Discriminated unions & config interfaces
│   ├── state/
│   │   ├── presets.ts       # 4 deeply frozen starter presets
│   │   └── store.ts         # rAF-batched reactive store
│   └── utils/
│       ├── colorContrast.ts # WCAG luminance & contrast ratio helpers
│       ├── qrSerializer.ts  # Payload serialization & escaping
│       ├── qrComposer.ts    # Master SVG composer & text sizing
│       ├── qrExporter.ts    # PNG / JPG / SVG / HTML exporters
│       └── __tests__/       # Vitest unit tests
├── PORT.md                  # Sandbox-to-Vanilla TS controller port guide
├── vitest.config.ts
└── tsconfig.json
```

---

## Instructions for Use

### Using the Studio
1. **Pick a Preset or Category**: Choose a starter preset (**Menu**, **Wi-Fi**, **Website**, **vCard**) in the top bar or select one of the six tabs under **Content & Type** and fill in your fields.
2. **Customize Style & Colors**: Select a curated `7:1+` swatch or set custom foreground/background colors, module dots, corner markers, and error correction level. Optionally upload a center logo (`<= 1 MB`); consider raising error correction to `Q` or `H` when using a logo.
3. **Verify Scannability**: Check the **Live Preview** contrast badge (`Good` indicates `>= 7.0:1`).
4. **Configure Frame & Copy**: Pick a frame template (`None`, `Bottom Banner`, `Top Badge`, or `Card Border`), enter a headline/sublabel, and adjust font stack, text size (`Small` / `Med` / `Large`), and frame colors.
5. **Export**: Choose `512px`, `1024px`, or `2048px`, then click **PNG**, **JPG**, **SVG**, or **HTML** (to view and copy an embeddable `<figure>` snippet).

### Running Locally (Development & Verification)

Install dependencies:
```bash
npm install
```

Start the development server on port `3000`:
```bash
npm run dev
```

Run tests, type-checking, linting, and production build:
```bash
npm test            # Vitest unit test suite
npx tsc --noEmit    # Strict TypeScript check
npm run lint        # ESLint check
npm run build       # Production Next.js build
```
