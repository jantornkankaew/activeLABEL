# Implementation status

## 2026-10-16 — Bottom Canvas Toolbar Simplification & Zero-Scroll Mobile Fit

- **Streamlined Bottom Toolbar (`src/DesignSurface.tsx`, `src/atelier.css`)**:
  - **Removed Redundant Text Labels**: Removed text labels ("Grid", "Snap", "Unit", "DPI", "Fit to page") from the bottom `.canvas-toolbar` controls, replacing toggle switches with clean, tactile icon toggle buttons (`⊞` for Grid, `🧲` for Snap, `⛶` for Fit to page) equipped with descriptive `title` tooltips and accessible `aria-label`s.
  - **Compact Selects & Zoom Controls**: Streamlined unit (`mm ⌄`), DPI (`203 ⌄`), spacing (`1 mm ⌄`), and unified zoom percentage buttons into minimal, distraction-free controls.
  - **Single-Screen Zero-Scroll Mobile Docking**: Formatted toolbar to ~310px width centered at `bottom: 8px` on screens below 700px, fitting comfortably inside any phone viewport without requiring horizontal scrolling.
- **Verification**:
  - 104 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Print Dialog 3D Coverflow Preview, Single-Row Variable Inputs & Prompt Filtering

- **Print Dialog Enhancements (`src/PrintDialog.tsx`, `src/print-dialog.css`)**:
  - **Selective Prompt Filtering**: Variables explicitly configured with `prompt: false` ("Ask before print" unchecked) are now completely excluded from the Print Dialog input list while preserving their default computed/formula values during print resolution.
  - **Single-Row Variable Inputs & Compact Spacing**: Redesigned variable items into a clean horizontal row with the variable name and required asterisk on the left and input field on the right (`flex-direction: row; justify-content: space-between`). Cleaned up line spacing to maximize visible entries in the scrollable panel without clutter.
  - **3D Coverflow Preview with Visible Neighbor Cards**:
    - Simultaneously renders previous (`clampedPreviewIndex - 1`) and next (`clampedPreviewIndex + 1`) resolved label cards on the left and right sides in 3D perspective (`rotateY`, `translateZ`, scale 0.85, elevation shadows).
    - Clicking either previous or next neighbor card directly navigates to it with keyboard accessibility (`Enter`/`Space`).
    - Tuned transition timing to a silky-smooth 0.65s easing curve (`cubic-bezier(0.22, 1, 0.36, 1)`) so users can clearly see the cards glide and swap without flashing too quickly.
- **Verification**:
  - 104 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Mobile Responsive Overhaul & Floating Dock Optimization

- **Comprehensive Mobile UI/UX Overhaul (`src/App.tsx`, `src/atelier.css`, `src/network-status.css`)**:
  - **Zero-Overflow Header**: Streamlined header to a compact 52px height with 17px brand logo, 28px touch targets, compact network status badge, and icon-only Share/Print buttons (`.header-action-label` hidden on mobile). Prevents horizontal scrolling and button clipping on narrow phone viewports.
  - **Consolidated Bottom Controls Docking**:
    - Docked the horizontal canvas toolbar at `bottom: 8px` as a swipeable, glassmorphic capsule (`background: rgba(255,255,255,0.95)`, blur, card border) ensuring Grid, Snap, Spacing, Unit, DPI, and Zoom controls scroll smoothly without text cutoff or broken flex alignment.
    - Repositioned document controls (`Layers`, `Variables`, `Formulas`, `Label Size`) to `bottom: 48px` as a sleek pill bar right above the bottom toolbar instead of floating 217px high in the middle of the label artwork.
    - Compacted AI Composer to `bottom: 84px` with sleek pill styling and reduced textarea height, freeing up over 120px of vertical workspace for comfortable canvas panning and label editing.
    - Positioned the selected object context bar at `bottom: 84px` with horizontal scroll support (`overflow-x: auto`) for easy thumb navigation of typography and barcode settings.
  - **Touch-Friendly Drawing Tool Dock**: Positioned at `top: 6px` as a 32px-height pill capsule with glassmorphism backdrop and smooth horizontal scrolling.
  - **Full-Width Bottom Sheets for Mobile**: Adjusted properties inspector and layers popovers to open as mobile bottom sheets (`bottom: 8px`, border-radius 18px, full-width with safe margins).
- **Verification**:
  - 104 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Browser-Native Chrome Omnibox PWA Installation & Clean UI

- **Native Chrome Address Bar PWA Installation (`src/App.tsx`, `src/FileMenu.tsx`, `src/atelier.css`)**:
  - **Removed Custom In-App Buttons**: Fully eliminated custom in-app install buttons, menu items, and modals (`src/PwaInstallDialog.tsx`, `src/usePwaInstall.ts`, `.btn-pwa-install`, `FileMenu` install option) to keep the canvas and header interface distraction-free.
  - **Unblocked Native Browser Experience**: Without `beforeinstallprompt` event interception or `e.preventDefault()`, Google Chrome automatically presents its native install icon (`🖥️⬇`) directly in the address bar (Omnibox) when visiting over HTTPS/localhost.
  - **Maintained Full PWA Compliance**: PWA manifest (`public/manifest.webmanifest`), service worker (`public/sw.js`), and standard registration (`src/serviceWorkerRegistration.ts`) remain active to ensure seamless desktop and mobile browser installability.
- **Verification**:
  - 104 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Project Rebranding to activeLABEL

- **Comprehensive Rebranding to activeLABEL (`index.html`, `public/manifest.webmanifest`, `src/App.tsx`, `src/ChatGPTWidget.tsx`, `src/PwaInstallDialog.tsx`, `src/printing.ts`, `src/ShareDialog.tsx`, `package.json`, `src/atelier.css`)**:
  - **Modern Brand Presentation**: Refined header and splash logo to `active` (ink neutral) + `<span>LABEL</span>` (emerald green accent `#00866c`), highlighting Active 5's identity with crisp, bold typography.
  - **Clean Header & Interface**: Removed copyright `© Active5` badge and `www.active5.co.th` link pill to keep the UI clean, distraction-free, and uncluttered.
  - **PWA & Manifest Identity**: Updated `index.html` title to `activeLABEL — Label Designer`, `application-name`, Apple mobile web app metadata, and `manifest.webmanifest` (`short_name: activeLABEL`).
  - **Dialogs & Output Files**: Updated PWA installation guidance, ChatGPT integration, native print document titles, and export filenames (`activelabel.json`).
  - **Full Data Preservation**: Retained seamless backward compatibility for saved documents in `localStorage` by migrating and reading both `activelabel-jobs-v1` and `labelcraft-jobs-v1` keys.
- **Verification**:
  - 104 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Active5 Copyright & Website Link Branding

- **Active5 Copyright & Website Link Integration (`src/App.tsx`, `src/DesignSurface.tsx`, `src/FileMenu.tsx`, `src/atelier.css`)**:
  - **Sleek Brand Pill in Header**: Positioned beside the `LabelCraft` title as an elegant, compact pill badge linking to `https://www.active5.co.th` (`© Active5 · www.active5.co.th ↗`). Features subtle hovering interaction, emerald accent coloring, and responsive collapsing on narrow viewports.
  - **Canvas Status Toolbar Credit**: Integrated seamlessly into the bottom canvas toolbar (`DesignSurface.tsx`) alongside zoom controls for persistent yet non-intrusive brand recognition.
  - **File Menu Footer**: Positioned as a dedicated, clean footer item within the `File` dropdown panel (`FileMenu.tsx`).
  - **Cloud Gate Branding**: Integrated the Active5 copyright badge into the cloud authentication splash screen.
  - **Strict Security & Accessibility**: Implemented with `target="_blank"` and `rel="noopener noreferrer"`, explicit title tooltips, and SVG icon indicators.
- **Verification**:
  - 104 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Chrome Desktop PWA Installation & App Manifest Compliance

- **PWA Installation Experience for Google Chrome (`index.html`, `public/manifest.webmanifest`, `src/usePwaInstall.ts`, `src/PwaInstallDialog.tsx`)**:
  - **Standardized PWA Assets**: Generated verified 192x192 and 512x512 PNG app icons (`public/icon-192.png`, `public/icon-512.png`) and added them to `public/manifest.webmanifest`, `index.html` (with `apple-touch-icon`), and Service Worker precache.
  - **Installability Criteria**: Configured `id`, `start_url`, `scope`, `display: standalone`, `theme_color`, categories, and app shortcuts to fulfill Chrome's desktop installability criteria.
  - **In-App Install Action**: Added a prominent "ติดตั้งแอป" (Install App) button in the top header and File menu (`FileMenu.tsx`). Captures the `beforeinstallprompt` event to trigger Chrome's native install dialog directly.
  - **Install Guidance Modal**: Added `PwaInstallDialog.tsx` showing desktop benefits and Chrome Omnibox install instructions when triggered before the native prompt fires.
  - **Standalone Mode Awareness**: Automatically detects when running as an installed standalone app (`display-mode: standalone`) and gracefully hides the install buttons to keep the canvas clean.
- **Verification**:
  - 104 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Minimal Network Status Popover, Offline Duration & Last Sync Timestamp

- **Minimal Network Popover & Status Badge (`src/NetworkStatusBadge.tsx` & `src/network-status.css`)**:
  - **Minimal Aesthetic Design**: Streamlined the popover into a clean 245px compact card removing redundant text blocks and large panels in favor of crisp, modern typography and clean key-value rows.
  - **Live Offline Duration Tracking**: Added `offlineSince` persistence in `src/syncEngine.ts` (`labelcraft-offline-since-time`). Tracks exact timestamp when connectivity dropped, presenting clock time (e.g. `10:45:30`) and live-updating relative duration (e.g. `5 นาทีที่แล้ว` / `5m`) in both popover and header badge.
  - **Precise Last Sync Timestamp**: Displays formatted clock time and relative time of the last successful sync with cloud/local persistence (e.g. `10:52:14 (เมื่อสักครู่)`).
  - **Dynamic Real-Time Refresh**: Popover ticks every 2 seconds while open to update elapsed time labels without manual refresh.
- **Verification**:
  - 104 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Print Dialog Variable Resolution & Comprehensive Variable Display

- **All Document & Formula Variables Displayed in Print Dialog (`src/PrintDialog.tsx` & `src/variables.ts`)**:
  - **Comprehensive Variable Ingestion**: Updated Print Dialog `asked` list to resolve all project variables defined in `doc.variables`, variables utilized in formulas (`usedVariables(doc)`), and synthesized variables detected in canvas templates.
  - **Accurate Canvas Requirement Validation**: Differentiated required variables (only variables rendered directly on canvas objects require non-empty values with `*` and validate before printing). Variables used in formulas or optional project fields are editable without blocking print if empty.
  - **Formula Default Value Resolution**: Initialized Print Dialog values state with `variableValues(doc.variables, {}, doc.formulas)` to compute initial values through the formula engine.
  - **Dynamic Variable Memory**: When editing variables in Print Dialog, `remember` cleanly persists updates and newly synthesized variables into `doc.variables`.
- **Verification**:
  - 103 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Immersive 3D Photo Album Preview & Tactile Deck Overhaul

- **Full-Featured 3D Photo Album Experience (`src/PrintDialog.tsx` & `src/print-dialog.css`)**:
  - **Layered 3D Stack Deck**: Displays realistic stacked cards behind the active label (`layer-deep` and `layer-next` with perspective depth, subtle rotation, and live peeking SVG of the upcoming serial label).
  - **Tactile 3D Flip Physics**: Upgraded animation to full 3D card flips (`albumFlipNext` / `albumFlipPrev`) with 3D elevation (`translate3d`), dynamic tilt (`rotateY(-24deg)`), scale settling, and dynamic shadow expansion.
  - **Dynamic Gloss & Specular Sweep**: Realistic specular light reflection (`photo-gloss-sweep`) glints across the surface of the photo paper on each page flip.
  - **Vintage/Modern Photo Mounting Corners**: Decorative photo corners (`album-corner`) at all 4 edges, providing a genuine collector's photo album aesthetic.
  - **Embossed Serial Stamp**: Embossed watermark stamp (`#01 / 10`) placed on the photo print with translucent blur and border.
  - **Interactive Flippers & Keyboard Navigation**: Floating side arrow buttons on the album stage (`album-stage-flipper`) plus native keyboard arrow navigation (`ArrowLeft` / `ArrowRight`) and a minimal dot pagination bar (`album-dots-bar`).
- **Verification**:
  - 102 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Offline Support, Network Status Indicator & Automatic Cloud Re-sync

- **Offline-First PWA Capabilities**:
  - Implemented Service Worker (`public/sw.js`) with Cache Storage strategy for offline app shell caching (`index.html`, scripts, styles, bundled Thai/Latin fonts, SVG assets).
  - Added Web App Manifest (`public/manifest.webmanifest`) and application icon (`public/icon.svg`) for installable PWA support.
  - Safe registration via `src/serviceWorkerRegistration.ts` during window load.
- **Real-Time Network Status Indicator (`NetworkStatusBadge.tsx` & `network-status.css`)**:
  - Placed in top header action bar with distinct states: `🟢 Online`, `🟠 Offline (X changes pending)`, `🔄 Syncing…`, `✅ Synced`, and `⚠️ Error`.
  - Interactive popover dialog provides network details, local storage confirmation, queued changes count, last synced timestamp, and manual "Sync Now" button.
- **Offline Sync Queue & Automatic Re-sync Engine (`src/syncEngine.ts`)**:
  - When offline, changes are safely persisted to `localStorage` (`labelcraft-jobs-v1`) and queued into `labelcraft-offline-sync-v1`.
  - Network state listeners (`online` / `offline` events) automatically trigger background sync when connectivity is restored, flushing pending documents to the cloud without losing edits.
  - Cloud gate allows instant fallback with `ทำงานแบบออฟไลน์ (Continue Offline)`.
- **Verification**:
  - 102 TypeScript tests passed (`bash scripts/rtk-exec.sh npm test`).
  - Production build passed (`bash scripts/rtk-exec.sh npm run build`).
  - All 25 Go tests in 8 packages passed (`bash scripts/rtk-exec.sh go test ./...`).
  - Desktop print bridge cross-compiled for 6 OS/architecture targets with `scripts/build-printbridge.sh`.

## 2026-10-16 — Print Dialog Redesign (Studio 2-Column, Photo Album Preview & Variable Management)

- **Print Dialog Studio Redesign**:
  - Re-architected modal into a modern 2-column layout (Left: Photo Album Preview Stage & Serial Navigator; Right: Quantity settings, scrollable Prompt Variables, Preflight alerts; Bottom: Help tips and side-by-side action buttons).
  - **Photo Album Transition**: Label preview is presented as an album paper card with tactile directional animations (`albumSlideNext` / `albumSlidePrev` with smooth translation, subtle perspective scaling and rotation), giving a physical flip-book feel when navigating between serial labels.
  - **Bounded Variables Scroll**: Solved layout overflow when multiple prompt variables exist by introducing a bounded, scrollable list (`max-height: 180px` with custom slim scrollbars). Variable inputs remain compact and auto-persist to document variables on blur.
  - **Dedicated Quantity Controls**: Moved Copies and Serial count steppers into a clean top card in the right sidebar with real-time total label summary (`รวม X ดวง`).
  - **Cancel Action**: Added a clear `ยกเลิก` (Close/Cancel) button in the footer actions directly adjacent to the `Print` button, alongside the existing modal header close button.
- **Verification**:
  - 98 TypeScript tests passed with `bash scripts/rtk-exec.sh npm test`.
  - Production build passed with `bash scripts/rtk-exec.sh npm run build`.
  - All 25 Go tests in 8 packages passed with `bash scripts/rtk-exec.sh go test ./...`.
  - Desktop print bridge cross-compiled for `darwin-amd64`, `darwin-arm64`, `linux-amd64`, `linux-arm64`, `windows-amd64`, and `windows-arm64` using `scripts/build-printbridge.sh`.

Current ChatGPT direction: Apps SDK widget + official Go MCP server, not a personal Codex connector in the website. The standalone API and demo remain. `docs/CHATGPT_APP.md` provides deployment/registration steps; preparing this repository does not deploy a public MCP endpoint or register the app in a ChatGPT account.

Implemented for the embedded app: vector text/barcode/line/box editing, mm geometry, inspector/layers, manual commands through the existing engine, stateless MCP open/propose tools, server validation using the same compiled TypeScript engine, explicit Apply/Reject, barcode-change confirmation, stale-revision rejection, monotonic Undo/Redo, widget state, JSON/SVG export and a user-initiated print handoff to the standalone Chrome print route. Image upload, direct local-device access from the embedded sandbox, account storage and billing are not implemented. Chrome system printing is available through the standalone website; actual hardware output is unverified.

Local checks: 16 TypeScript tests; 18 Go tests including official MCP-client protocol/schema tests; live local MCP smoke with the actual Node worker; Chromium desktop/mobile host-mock interaction checks including Apply/Undo/Redo and barcode confirmation. No live ChatGPT model or account connection was tested. Standard Docker build in this cloud instance encountered its proxy certificate trust restriction; Normal-trust GitHub Actions successfully built and smoke-tested the deployment image in run 38207060501. Render deployment and ChatGPT registration remain external prerequisites.

12 October 2026 — v0.1 technical prototype.

Implemented: object editor, SVG display/export, JSON save/load, atomic commands, monotonic undo revisions, labelled offline chat, API/ChatGPT provider selector, personal Codex CLI adapter, trusted-TLS configuration and loopback/Host/auth/Origin guards for the AI connector, Windows/macOS launchers and connector ZIP build workflow, PNG print payload, persistent single-process job IDs, ZPL LAN adapter, Windows GDI bitmap adapter.

Not implemented: native vector driver engine, macOS native driver adapter, TSPL/CPCL/USB, secure production hosted-to-loopback connection, cross-process job lock/SQLite, credit billing/account/tenant system, Excel/CSV batch, intelligent solver, image reconstruction, team approvals. No model/hardware credentials used and no real print sent.

Priority for next Codex session:
1. Generate shared JSON Schema and server-side command/document validation; current Go API is a prototype adapter and client is final validator.
2. Make barcode module widths/quiet zones explicit and validated for printer DPI. Current SVG dimensions can scale bars fractionally; do not claim print-quality certification.
3. Add secure pairing/HTTPS and SQLite job state; verify Windows persistence/restart behaviour. Do not deploy local HTTP bridge as production.
4. Native vector/glyph/bitmap hybrid adapters; validate platform font shaping and custom media with actual printers.
5. Data binding/batch and preflight, then AI evaluation/credit ledger.

Design reference: original generated primary-screen concept. Later user selected a specific edit target that was unavailable at its supplied path; no substitute image was used for that requested edit. Await exact attachment before image redesign.

Verification: TypeScript tests and type/build; Go race tests; AI connector cross-compiles for Windows amd64/arm64 and macOS amd64/arm64, plus the required print-bridge targets. Chromium checked AI Settings at 1440×1000 and 390×844, API/Codex mock connection → edit → Undo, revision/barcode preservation and token storage exclusion. HTTPS requests validated a temporary test trust anchor; unauthorized, disallowed-Origin and nonlocal-Host requests were rejected. Public npm Codex 0.162.1 binary resolution and CLI flags were checked; no actual ChatGPT OAuth or live inference was performed. Native launchers, macOS/Windows execution, real mkcert trust, GitHub Pages-to-local browser permission behavior and hardware output remain unverified.

GitHub Actions run 38201173316 succeeded: native Windows/macOS Go unit tests, connector help and launcher syntax checks, Linux race tests, and all four connector ZIPs. This verifies native test execution, not end-to-end launcher/login/model behavior on a user's computer. Pages deployment run 38201173262 also succeeded.

QR rendering regression fixed: omit the unsupported undefined height option for bwip-js QR rendering. QR/Code 128/EAN SVG tests and manual QR, font/bold, host-mock interactions passed.

Editor improvements (12 October 2026): both standalone and embedded editors support double-click label size dialogs, Noto Sans/Serif/Mono font choices with bundled Latin/Thai fonts, computed text bounds, 11 real bwip-js symbologies, staged barcode type/data editing, two millimetre rulers with cursor markers, and multiple named jobs (up to 50). Standalone jobs persist in this browser; embedded jobs persist in ChatGPT widget state, not an account database. JSON import/export provides portable backup; embedded import excludes images. No cross-device storage is claimed.

Text dimensions use shared bundled-font advances and line metrics; SVG disables Latin ligatures and kerning to match. Thai shaping, fallback for scripts outside the bundled Latin/Thai subset and printed glyph output still need target-device checks. SVG embeds the font data so exports and PNG fallback use the same fonts. Retail codes enforce supplied check digits and Interleaved 2 of 5 rejects odd lengths rather than silently padding payloads. Module widths and print quality remain separate work.

Improvement checks: 19 TypeScript tests (all 11 barcode encoders, checksum/payload rejection, auto text sizing/overflow, independent jobs and legacy migration); 18 Go tests; standalone and self-contained widget builds; Chromium 1440×960 and 390×844 interaction checks for all five requests, file switching/reload, no framework overlays or app console errors. Real local MCP + mocked ChatGPT host also checked Apply/Reject, Undo/Redo, stale proposals and explicit barcode consent. Browser plugin was unavailable, so installed Playwright used system Chromium. Print bridge cross-compiled for Windows amd64 and macOS amd64/arm64; no physical print or actual ChatGPT account session was tested.

Barcode ratio follow-up: every symbology now renders with uniform SVG scaling; bar widths, gaps, text and padding are never stretched separately along X/Y. The shared engine derives aspect ratio from the encoded SVG and adjusts the other dimension for width-only or height-only updates. Conflicting two-axis edits are rejected atomically. QR/2D padding is symmetric; type/payload changes and legacy imports fit the correct shape inside the existing bounds. A visible ratio-lock note appears in both inspectors. This does not establish minimum physical module width or successful scanning on a printer.

Ratio verification: 20 TypeScript tests and 18 Go tests passed; both builds and required bridge cross-compiles passed. Chromium desktop/mobile checks in both editors exercised proportional width/height edits, staged barcode changes, persistence and JSON import with no app errors. All 11 encoders were tested for uniform up/down scaling, conflicting dimensions and unchanged payloads. Physical scan/print quality remains untested.

Workspace/local-print update (12 October 2026): both editors have maximum centred Fit to page, zoom controls, independent millimetre grid/snap settings, shared drag and proportional barcode corner-resize gestures with one undo step, automatic validated barcode type/data updates with persistent invalid drafts and explicit checksum/sample actions, nine licensed bundled font families, and a conventional File menu/stable document tabs. Invalid barcode drafts block Print until resolved. Grid, selection handles and unused embedded font faces are removed from SVG exports and print output.

Default local printing now opens Chrome's real system print dialog with exact-mm vector label pages. Installed manufacturer USB/network queues on Windows or macOS are selected by the user; no PDF export or bridge installation is required for this route. ChatGPT Print transfers the current label to the standalone website via a validated URL fragment, clears it there and opens print preview. The direct bridge gained trusted-TLS flags and loopback Host/private-network guards, retains authenticated configured destinations and never retries jobs automatically. The native macOS bridge adapter remains unimplemented.

Verification for this update: 25 TypeScript tests and 19 Go tests; builds for both editors; Chromium 1440×960 and 390×844 with no app errors/overlays. Interaction checks covered limiting-axis fit and exact centre, optional snap and free drag, proportional corner resize/undo, automatic barcode updates, invalid draft retention across selection, checksum correction, nine fonts, File menu/tabs/reload and clean SVG exports. Print was intercepted, never sent to hardware: Chrome's popup was invoked, two label pages were rendered, CSS paper geometry was checked at 60×40 mm, and the actual MCP/host-mock print handoff opened standalone preview with the correct label. PDF was generated only as a temporary QA measurement artifact, not by the app. No TSC, Zebra, Honeywell, EPSON or SATO physical printer, actual native Chrome print session, or real ChatGPT account was available here. Driver/media setup, scan quality and physical scale still require each actual model. Self-contained widget size increased to roughly 2.2 MB uncompressed with the additional fonts; account-hosting limits and load performance remain unmeasured.

Additional font QA: all nine families in regular and bold rendered Latin/Thai text in Chromium within the shared computed bounds. Invalid barcode drafts were verified to persist across switching selection while Print remains disabled. The temporary print-size PDF contained exactly two pages for two requested copies.

Measurement/alignment update (12 October 2026): both editors now offer mm, cm, inch and dot display/input units, including 203/300/600 DPI for dot conversion. Physical document geometry, commands, exports and print pages remain millimetres; unit/DPI preferences do not create edits or change the label. Rulers, cursor coordinates, size dialogs, geometry/font inputs and grid choices follow the selected unit. Six selected-object alignment actions position against label edges or centres, bypass snap for exact placement and use normal validated undo/redo. Locked objects cannot be aligned. Reference-image reconstruction through chat is future work, specified in REFERENCE_LABELS.md; no live upload-analysis feature is claimed.

Verification: 29 TypeScript tests and Go tests passed; standalone Pages-base and self-contained widget builds passed, as did required Windows/macOS print-bridge cross-compiles. Chromium desktop/mobile checks in both editors exercised unchanged documents when switching units/DPI, inch inputs, cm size edits, all six exact alignments with snap enabled, locking, undo/redo, existing editor interactions, SVG export and print handoff. Intercepted print output retained 60×40 mm paper while displaying dots at 300 DPI. Preference reload and inch grid conversion were checked separately. No hardware print or reference-image inference was performed.

Shape mouse resizing (12 October 2026): selected unlocked lines expose a right-end length handle, and boxes expose a bottom-right corner handle for independent width/height adjustment. Both editors use physical-mm pointer conversion, optional endpoint grid snap, label-bound clamping and one validated history transaction on release. Barcode resizing retains its existing proportional behavior. Line orientation and stroke thickness remain unchanged when resizing length.

Verification: 31 TypeScript tests, both frontend builds, Go tests and all three required print-bridge cross-compiles passed. Chromium at desktop and mobile sizes checked both editors with actual MCP proposals and a mocked widget host: expansion/shrink, independent box dimensions, line length with unchanged height, one revision per drag, undo/redo, locked-handle removal, snap and label-bound clamping; no app errors. No physical printing was performed.

Share/freeform/property update (12 October 2026): header Share replaces Save in standalone and is also available in the widget. It provides bounded editable snapshot links, clipboard copy with a manual fallback, JSON downloads and feature-detected native sharing. Receivers import an independent validated document and clear the fragment without opening Print; large labels must use JSON files. No shared cloud database or synchronized editing is claimed.

Lines support optional local vector endpoints inside a positive bounding box; legacy horizontal lines are unchanged. Tail dragging fixes the start and allows up/down/left/right/vertical/reversed directions, optional endpoint snapping, bounded movement and one undoable validated transaction. Rendering, moves, width/height changes, alignment, exports and MCP proposals retain the endpoints. Double-clicking an object reveals its inspector and stops document handling; blank-paper double-click opens Document property. The old Label size heading is renamed.

Verification: 35 TypeScript tests, Go tests/race, standalone Pages-base and self-contained widget builds, and required print-bridge cross-compiles passed. Official MCP schema tests accept endpoint geometry and reject unknown nested fields. Chromium in both editors at 1440×960 and 390×844 checked fixed-start line angles/crossing, snap/locking/undo/redo, subsequent real MCP proposals, object versus blank double-click, Share copy/download/native-share mock, independent link recipients without printing, and clean SVG. Existing unit/align/grid/barcode/font/file/print handoff checks also passed, including intercepted Chrome paper geometry at 60×40 mm. Native sharing was mocked; an actual mobile share sheet, real ChatGPT account and physical print remain untested.

Barcode standards update (12 October 2026): the old arbitrary-height/common-padding image ratio is replaced by deterministic reference profiles and barcodeScale percentage. Both editors remove independent barcode width/height inputs even in dot mode, show physical result/X/quiet zones, and keep the encoded wide:narrow ratio (3:1 for Code39/I2of5). EAN/UPC retail uses nominal X/bar-height/quiet-zone references and enforces 80–200%; QR/DataMatrix/PDF417 have distinct borders and PDF417 has 3X rows. Percent and corner drag update both axes together, bypass sizing snap and preserve payload. Type/payload changes preserve reference magnification without truncating height; layout overflow is now an editable draft with print blocking. Mandatory Code93 C/K checks were missing from the previous encoder options and are now enabled. UPC-E HRI is kept within the reference box; Code39 trailing whitespace is excluded from the bar span.

Printer-DPI controls diagnose fractional dot modules and offer explicit uniform ratio adjustments, including an atomic repair action in Print. Legacy imports retain payload and fit the corrected proportional geometry inside old bounds; legacy retail under 80% is visibly flagged and blocked from printing. Preflight also blocks modules below one device dot and quiet-zone overlap, with segment-aware checks for boxes/lines. Fractional-dot warnings remain advisory for the vector route. Generic profile dimensions/editing limits are application defaults; no universal GS1 or ISO grading certification is claimed. Current official GS1 PDF access was blocked, so first-party encoder implementations with standards citations were used, with exact limitations recorded in BARCODE_STANDARDS_RESEARCH.md.

Verification: 44 TypeScript tests; both production builds; Go tests/race and all required print-bridge cross-compiles passed. Chromium checked both editors at 1440×960 and 390×844: percentage controls across all units, no editable barcode dot width/height, 80/200 limits, proportional mouse resize despite snap, unchanged payload, undo/redo, validated MCP percentages, DPI conversion, legacy print blocking/repair, actual stroke/module/quiet-zone geometry and HRI bounds. Independent ZXing-C++ WASM decoding passed all 11 example symbols; UPC results were compared as equivalent normalized GTINs while stored payloads remained unchanged. Existing full editor checks also passed, including barcode draft/checksum behavior, units/alignment/fonts/files/export and intercepted 60×40 mm print output. No physical printer, media, scanner quality grade or real ChatGPT account was tested.

Integer resize/compact properties/printer selection update (12 October 2026): mouse barcode preview and release now use whole-percent steps and floor the available fit percentage, independent of grid/dot sizing. A live editor-only percentage label is removed from exports/print. Both inspectors use a compact Data/Type/Ratio/DPI layout with collapsed technical details. Barcode DPI changes adjust physical ratio immediately; DPI-aligned percentages may remain fractional. Invalid fit/locked edits are rejected without changing the previous geometry or preference.

Print replaces route tabs with one visible Printer selector. Chrome's option opens its real native queue chooser; installed OS queues cannot be enumerated/preselected by the standard webpage API. Authenticated local bridge profiles populate the same selector after Load printers. Choosing a bridge profile or changing Print DPI applies the size adjustment without another button. Changing pairing URL/token clears stale profiles. This exposes configured service profiles, not discovery of every installed OS printer. No automatic printing or physical-success claim was added.

Verification: 45 TypeScript tests, both production builds, Go tests and all required print-bridge cross-compiles passed. Chromium desktop/mobile in standalone and widget checked integer percentages in every drag preview and commit, snap independence, aspect/payload preservation, undo/redo, immediate DPI changes and collapsed properties. Print checks invoked Chrome's popup with print intercepted, loaded two authenticated mock service profiles into the selector, selected a profile and checked DPI, then submitted exactly one mock job to the selected ID with correct DPI/PNG. Token changes cleared the list. No actual native printer list, ChatGPT account or physical print was available in this cloud environment.

The existing full editor regression also passed after this update, including centred fit, unit/ruler and alignment behavior, invalid barcode drafts/checksum correction, font rendering, file tabs/reload, stripped SVG UI overlays and intercepted 60×40 mm Chrome paper geometry.

### Editable barcode overflow
Barcodes may extend beyond the document while retaining valid data, standard ratio limits and whole-percent mouse resizing. Both editors show only the off-page portion red, preserve accessible outside resize handles through scroll space, and offer a concise overflow warning. Shrinking/moving, undo, JSON migration and AI proposal previews preserve this draft. Other object bounds remain enforced. Print preflight and the native-dialog entry point block overflow. Verification: 46 TypeScript tests, both production builds, Go tests and Windows/macOS bridge cross-compiles; Chromium checks passed in both editors for overflowing percentage edits, outside-handle shrinking in whole-percent steps and undo; the web print dialog disables submission while overflow remains. Screenshots confirmed black inside and red outside the paper. No physical printing was performed.

### Delete confirmation, deselection and QR overflow colour
Both editors now share a styled native modal confirmation for the Delete key and inspector delete buttons. Cancel starts focused, Escape cancels, focus stays inside the modal, and confirmed removal uses the normal revision-checked transaction/undo engine. Editable fields, locked objects, other dialogs, active drags and pending AI reviews suppress the shortcut. Clicking blank paper or surrounding canvas clears selection. QR/DataMatrix/PDF417 inherited SVG fills now receive the red overflow tint, alongside explicit linear strokes, while white quiet zones and normal export colours remain unchanged.
Verification: 47 TypeScript tests; both production builds; Go tests and all required bridge cross-compiles. Chromium checks passed in both editors for QR red/black rendering, blank-canvas deselection, Delete confirmation/cancel/Escape/undo, inspector confirmation, text-field shortcut suppression and locked objects. Confirmation fit at 390×844 and 1440×960. No physical printing or real ChatGPT account was tested.

### Compressed snapshot sharing
Share links now use versioned `#share=z1.` zlib/base64url snapshots; existing percent-encoded JSON links still open. The sample seed link decreased from 1,966 to 632 characters (about 68%) without losing document content. Links remain bounded to 16,000 characters and expanded documents to 200,000 UTF-8 bytes; streaming decode limits expansion and rejects malformed or oversized input. JSON file sharing remains available for large documents. Share dialogs memoize encoding per document. No external storage or public short-code service has been configured: truly short lookup URLs require durable hosted storage beyond GitHub Pages.
Verification: 50 TypeScript tests, both production builds, Go tests and required bridge cross-compiles passed. Chromium opened compressed links from both editors into fresh standalone documents with unchanged objects/new document IDs/cleared fragments and no print action; legacy share links also opened correctly. No physical printer or real ChatGPT account was exercised.

### Clear browser printer selection
When no authenticated bridge profiles are available, Print now shows a system-printer card and an explicit “เปิดรายชื่อเครื่องพิมพ์ใน Chrome” button instead of an empty placeholder Printer dropdown. The dropdown appears only after actual configured bridge profiles are returned; changing token/URL removes it. The print preview, prepared print window and LOCAL_PRINTING guide explain Destination → See more…, the system-dialog fallback and OS queue checks. This improves selection clarity; it does not enumerate installed hardware from a web page or establish that the user's OS has a working queue.
Verification: 50 TypeScript tests, both production builds, Go tests and all required bridge cross-compiles passed. Chromium verified the absent placeholder selector, native print API invocation with interception, blocked-popup recovery, authenticated printer-list/job mocks, selector invalidation and 390×844 layout. No physical printer or user OS queue was accessible or exercised.

### OS queues inside the printer list via QZ Tray
Implemented an optional official QZ Tray 2.3.0 client route, with direct publisher installer links for Windows Intel/AMD/ARM and macOS Intel/Apple Silicon. Print → ค้นหาเครื่องพิมพ์ reads OS queue names from the permitted local helper and shows them in the in-app selector; no hardcoded brand list, fake connection or implicit print is used. Existing Chrome and authenticated Go-bridge routes remain available. QZ uses strict secure localhost connections and normal authorization prompts. The selected OS queue is rediscovered before sending a mm-sized PNG through the driver, using DPI/25.4 for dots/mm, explicit copies, no scaling and no raw/remote/file destination support. Pending duplicate submissions are rejected and failed/unknown output is never auto-retried.
Verification: 56 TypeScript tests, both builds, Go tests and all required Windows/macOS bridge cross-compiles passed. Chromium exercised the actual official QZ JavaScript client against labelled mock WebSocket responses: handshake/discovery, all helper-returned names, explicit selection, real PNG 709×472 at 60×40 mm/300 DPI, three copies, denial, no queues, disconnect and no automatic retry. A separate actual no-helper environment produced a visible failure and no invented printers. Legacy Chrome and Go-bridge browser checks also passed, including popup-block recovery and authenticated list/job mocks. Installer asset names and the retained LGPL source notice were verified.
Native verification remains pending: the cloud does not have the user's Windows/macOS host, installed QZ service, actual printer queues or hardware. Installation, local permission and the user's discovery result must be checked on that computer; physical printing still needs an explicit user print action. See LOCAL_PRINTER_DISCOVERY.md for exact sources and limits. This integration is ready for local verification; hardware success is not claimed.

Follow-up browser verification also passed the ChatGPT-widget → standalone print handoff reaching the official QZ client list without automatic printing, and a printer literally named “choose” remains an explicit selection rather than colliding with the placeholder.

### First-party native helper replaces QZ Tray
The user declined QZ Tray. Its client, types and notice have been removed from the current build. LabelCraft's existing Go helper now discovers Windows queues with EnumPrintersW and macOS queues with lpstat, issues a random per-run pairing token through a private local page/fragment, and pairs the current tab without manual token entry. Credentials stay in tab session storage and are excluded from label shares/exports. Authenticated GET and POST refresh the OS allowlist. Discovery exposes unknown DPI as 0; the user sets actual DPI. The new macOS driver adapter submits a one-page raster-image PDF at exact mm dimensions through CUPS; Windows retains GDI. Public Pages builds include four first-party binary ZIPs and executable Mac launchers. No QZ/Java/browser extension/manual TLS-root installation is required for the tested Chrome loopback route; Chrome permission, strict loopback/origin/token checks remain required.
Local verification: 51 TypeScript tests, Go tests/race, both builds and all four native package cross-compiles passed. ZIP machine types and executable launcher permissions were inspected. Independent Poppler inspection confirmed a valid one-page 60×40 mm PDF. Chromium 154 connected an HTTPS-origin production page to the actual Go HTTP API with local-network permission granted, automatically read an explicitly labelled fixture queue, cleared the pairing fragment, preserved tab credentials without adding them to shares, and checked explicit selection, unknown-DPI editing, PNG/copies, 401 rejection, mobile/download availability and no automatic printing. Without the permission it displayed a genuine failure and no invented queue. The Linux fixture cannot reach hardware; its output attempt reported unknown/failed rather than a fake success.
Native CI is configured to execute real OS discovery and the read-only `-list` command on Windows/macOS before publishing downloads. CI queues may be empty. User-machine queue discovery, native media/driver behavior and physical output remain separate checks after the user runs the helper; no hardware output has been claimed or automatically retried. See NATIVE_PRINT_SETUP.md and LOCAL_PRINTER_DISCOVERY.md.

## 2026-10-13 — Canvas Atelier redesign (selected concept 2)

- Rebuilt standalone workspace hierarchy around a full canvas: floating object tools, centered title/document tabs, contextual properties, layers popover and compact expandable assistant composer. Share/Print remain prominent; autosave and all command/validation/history paths retained.
- Added scoped neutral design styles and responsive mobile layout; shared embedded editor/printing logic remains intact. Grid now starts hidden and can be enabled independently of snap.
- Browser-verified desktop/mobile editing, barcode auto validation/ratio/DPI, units/alignment, fonts, delete+undo, document/object double-click, files/reload, Share, Print/setup downloads and demo chat/settings. No fabricated connection or physical print success. See `design-qa.md`.
- Validation: 51 TypeScript tests, frontend build and Go tests passed. Hardware printing and live AI remain separate user-machine/service checks.
- Cross-built all four helper ZIPs successfully: Windows amd64/arm64 and macOS amd64/arm64. No Go/native printer code changed in this redesign.

## 2026-10-13 — Selection handles, zoom, sharing and printer follow-up

- Eight fixed-screen-size blue resize handles and solid selection outline for text/barcode/image/box. Opposite anchor stays fixed; barcodes retain encoded ratio, integer mouse magnification and overflow editing. Text scales its font with measured geometry. Lines retain their freeform endpoint handle. Added pure geometry regressions and real browser drags for all eight barcode handles.
- Editable zoom percentage with preset suggestions; barcode magnification also exposes presets. Added Duplicate, horizontal center and Delete to the floating toolbar. Grid defaults on, snap remains independent.
- Lossless tuple-based z2 compressed snapshots (sample browser check: 436 characters including public URL), with legacy z1/JSON decoding retained. Implemented persistent Go short-link service, security/persistence tests, Docker build and optional frontend/repository-variable integration. **Not deployed:** no persistent share host/domain is configured, so production still uses compressed links. See SHORT_LINKS.md.
- Printer setup opens immediately when unpaired, six Windows/macOS/Linux native download packages, shared CUPS Linux adapter, Linux native discovery CI prerequisite. Paired-tab BroadcastChannel sync fixes the original Print tab remaining unpaired; secrets stay in per-tab session storage, not documents/localStorage. Browser tests use explicitly marked queue fixtures and confirm no automatic print submission. Chrome permissions and running the local helper are still required; actual user hardware is not accessible from this workspace.
- 54 TypeScript tests and Go tests pass; standalone and ChatGPT builds pass; all six desktop helper packages cross-build. Browser verification includes eight handles, undo, typed zoom/preset lists, default grid, duplicate/align, share round-trip, printer setup, cross-tab pairing, reopening print and responsive mobile controls. CI native queue checks provide OS evidence separately from cross-compilation; physical output remains unverified.

## 2026-10-13 — Reopen an already-running printer helper

- Helper binds its loopback listener before opening the pairing browser. Saves the private setup URL to an owner-readable session file; opening a second instance reopens the running helper's pairing page after a bounded, non-redirecting health check instead of failing on port collision. No token logging or automatic print submission.
- Added Windows Start-LabelCraft.cmd and retained macOS/Linux terminal launchers with visible startup errors. Print setup points Windows users to the launcher.
- Tested real helper private-page HEAD response and 0600 session-file permissions with a configured test fixture; zero print jobs. Session URL validation rejects remote destinations, credentials, query/fragment and non-private paths. Unit tests, frontend build and all six package builds pass; launcher syntax inspected/checked. Actual desktop browser-launch integration remains covered only by target-platform APIs, not a claim of testing the user's machine.
- Short-link hosting remains blocked: no persistent hosting account/service is connected. Existing Go service and deployment instructions are ready; no public short-code service has been provisioned and no paid resources were created.

## Browser-only printing (current user choice)

- Removed connector downloads, pairing, discovery, token inputs and local job submission from the website print flow. Old pairing fragments are discarded; stored pairing data and cross-tab broadcasts no longer trigger connections. Go bridge source remains for legacy development.
- Print → เลือกเครื่องพิมพ์… opens Chrome/system print selection. Retains immediate DPI adjustment, preflight, copies and exact-mm vector pages with bundled fonts. No in-app printer enumeration or physical-success claim.
- Verified 54 frontend tests, frontend production build, Go tests and six desktop bridge cross-builds. Chromium browser checks invoked stubbed window.print (no hardware), verified two 50×30 mm pages and no editor adornments, invalid copy blocking, popup-blocked feedback, no helper requests with stale pairing, and mobile/tablet layouts without horizontal overflow. Actual native printer lists and hardware output cannot be verified from the cloud environment.

## Compact print workflow

- Replaced the instruction-heavy print modal with a restrained preview, document title, physical dimensions, immediate DPI selector and Print action. Help and barcode warnings are collapsed; validation errors remain visible. Escape, focus containment and focus restoration support keyboard operation.
- Print now invokes the browser from a same-origin iframe without a popup. One label page is prepared; printer selection and copy count belong to Chrome, avoiding duplicate copy multipliers. Frame cleanup follows afterprint (including cancellation); a later explicit print replaces any retained frame. No success or printer-discovery claim is shown.
- Read Chromium's printing.idl: chrome.printing is ChromeOS-extension-only. Direct Windows/macOS queue enumeration inside this ordinary website remains unavailable without an installed native integration, which the user rejected.
- Chromium browser checks passed for frame invocation, no popup/local-helper requests, exact 50×30mm page, no editor adornments, cleanup/retry, Escape/focus containment and desktop/mobile layouts. Native print invocation was stubbed: actual OS chooser and hardware output remain unverified. Frontend tests (54), production build, Go tests and six desktop cross-builds passed.

## Framed barcode printing and inline text

- Preflight now follows rendered layer order and stroke geometry. Transparent boxes enclosing a full barcode are printable; strokes tight against the outer edge produce a spacing warning, while foreground ink crossing modules/quiet zones still blocks. Underlying objects hidden by the barcode's opaque white background are not treated as visible collisions. No geometry, barcode payload or print artwork is automatically modified.
- Double-clicking unlocked text opens Properties and a focused inline editor at its canvas position. Each accepted change follows the shared command engine and updates measured dimensions, Properties, autosave and undo. Enter/Escape/blur end editing; invalid bounds are rejected. Editor controls are removed from print/export. Frame interiors allow selecting enclosed objects.
- Validation: 58 frontend tests including QR/Data Matrix/Code128 enclosure, crossing stroke and z-order regressions; production build; Go tests; six desktop cross-builds. Chromium checked inline Thai editing, Properties synchronization, invalid bounds, Undo/Redo, persistence and printable QR frame exported with updated text and no inline controls. Native print invocation was stubbed; no hardware job was sent.

## Follow-up: inset QR frames and scaled text controls

- The previous enclosure rule only accepted boxes outside the entire barcode image. Frames inset into its white quiet margin still failed. Now an enclosing frame is accepted if its 0.2 mm stroke stays outside the encoded module region; reduced quiet-zone spacing is a warning, not a print blocker. Geometry/payload are unchanged. Tests cover fractional insets and the exact stroke/module collision threshold.
- The previous HTML input border was rounded to CSS pixels before the SVG transform, producing a visibly thick blue band. Inline input layout now cancels SVG scaling and uses screen-pixel dimensions, a 1 px border, a caret instead of automatic select-all, and no resize handles during editing.
- Verified 59 unit tests, production build, Go tests and all desktop cross-builds. Chromium end-to-end checks reproduce a QR frame inset 0.6 mm into its white margin: Print enabled, frame/text preserved in print SVG, no editor artifacts. Text editing, Thai input, Properties, undo/redo and persistence pass. Measured borders at 25/100/340/800% zoom were 0.98–1.01 screen px. Native print invocation was stubbed; hardware output is unverified.

## Text frames and print variables

- Text objects now support italic and underline. Auto size can be disabled to expose a resizable fixed frame with left, centre or right internal alignment; inline editing mirrors the selected style.
- Documents can define named variables with defaults and an optional print prompt. Text and barcode formulas concatenate variables with `{{name}}`, preserve their source through JSON/share snapshots and resolve defaults in the editor.
- Print asks only for prompted variables that the label uses, renders the resolved preview and revalidates resolved barcode data before opening Chrome's print dialog.
- Verification: 62 TypeScript tests and both production builds passed. Chromium exercised variable creation, formulas, fixed text frames/styles, pre-print overrides, resolved text/barcode SVG output, keyboard fields and responsive desktop/mobile layouts. Native printing was intercepted; no hardware job was sent.

## Variable workflow redesign

- Variables use compact cards with a display name, default value, technical key and print-prompt toggle. The empty state creates the first variable directly.
- Text and Barcode Properties now expose a Value source selector. A variable can be linked without writing template syntax, with editable Prefix and Suffix fields and a live preview. Fixed values and multi-variable advanced formulas remain available.
- Verification: 63 TypeScript tests and the production build passed. Chromium checked creation, text and barcode binding, prefix/suffix updates, changed defaults, live previews and desktop/mobile layouts.

## Required variable questions in Print

- Print presents every used variable marked **Ask before print** as a numbered question above the label preview. Display names become the question labels, defaults remain editable and changes update the preview immediately.
- Required values show an inline error and keep Print disabled until completed. The section stacks cleanly on mobile and remains keyboard accessible.
- Chromium verified default values, empty-value blocking, live text resolution, re-enabling Print and desktop/mobile layouts. Native print was not invoked in this UI check.

## Remembered print variables

- Each print question and input now share one horizontal row on desktop and mobile.
- Leaving a print-value field stores that value as the variable's new document default, refreshes every linked Text and Barcode object on the design canvas, and persists through the existing autosave. Reopening Print starts with the remembered value. Linked locked objects also refresh without unlocking them.
- Verification: 64 TypeScript tests and the production build passed. Chromium checked horizontal alignment, required-value gating, live preview, remembered canvas content, reopening Print and responsive desktop/mobile layouts.

## Professional Properties and expanded typography

- Properties is reorganized into Content, Position & size, Typography and label-alignment sections with a compact object-type header, consistent spacing and a wider scrollable panel.
- Font size is an editable point-size control backed by 22 common presets from 6–96 pt. Font families increased from 9 to 19 and are grouped into bundled, deterministic print fonts and familiar system fonts. System choices retain explicit bundled fallbacks when unavailable.
- Chromium verified all sections, 19 options in two groups, preset/custom point input, rendered family/size updates and responsive desktop/mobile layout. Bundled font export remains filtered to families actually used.

## Self-contained portable design files

- LabelDocument now owns variables, remembered print values, unit, DPI, grid visibility, snap and physical grid spacing alongside objects and typography. These settings are validated, revisioned, undoable and included in JSON, compressed Share links, browser autosave and ChatGPT widget state.
- Opening or switching labels restores that label's own settings. New labels receive clean defaults; legacy files are migrated with the same defaults. AI connection details and credentials remain application state and never enter a design file.
- Verification: 65 TypeScript tests and production build passed. Chromium exported a configured label, opened it in a fresh browser context, verified variables/settings, checked isolation between two open label tabs and confirmed autosave after reload.

## Independent 1D bar height and top shapes

- All linear symbologies can shorten bars from 10–100% without changing X-dimension or magnification. The top-centre mouse handle keeps the barcode bottom edge and width fixed; the other resize handles retain proportional magnification behavior.
- Top artwork supports Flat, Wave, Zigzag, Sawtooth and Bubble. Matrix and stacked 2D codes do not expose these controls. Settings persist through autosave, JSON, compressed Share links, SVG export and print rendering.
- Top-handle dragging uses continuous 0.01% bar-height precision instead of rounding every pointer frame to a whole percent. Width, X-dimension, magnification and the bottom anchor remain fixed throughout the gesture.
- Barcode artwork now renders as inline SVG geometry rather than a new base64 image URL on every pointer frame, removing Chrome image decoding and blank-frame flicker. A full transparent hit area keeps selection reliable over quiet zones.
- Both centre-edge handles now adjust 1D bar height in either direction. The top handle anchors the bottom edge; the bottom handle anchors the top edge. A shortened barcode can be restored up to 100% from either handle without recalculating magnification.
- Verification: 70 TypeScript tests and web/ChatGPT production builds passed. Chromium grew and shrank both handles from 50%, retained 61.37% magnification and exact width, preserved each opposite anchor and reported no console errors.

## 2026-10-15 — Bottom workspace controls refactor

- Converted Grid and Snap checkboxes into accessible toggle switches with tactile sliding knob animations and active teal states.
- Replaced separate zoom in/out buttons, input and select with a unified segmented zoom stepper combining `[-]`, percentage input, `[▾]` preset menu and `[+]` into one cohesive control.
- Streamlined toolbar hierarchy by removing redundant pseudo-headers ("Document", "Layout", "View") and aligning Unit and DPI inline horizontally, removing the 3-level vertical clutter.
- Kept the bottom workspace controls container frameless and transparent without outer borders or card backgrounds, preserving the clean canvas atelier aesthetic.
- Removed clipped teal focus outline on the zoom percentage input and presets select for clean cursor editing.
- Verification: 71 TypeScript tests, frontend production build, Go unit tests and printbridge cross-compilations passed.

## 2026-10-15 — Smart alignment guidelines and text character baseline snapping

- Added object-to-object smart alignment guidelines across all 4 edges: top, bottom, left, and right.
- Text objects strictly measure their bottom edge by font baseline (`o.y + textMetrics(content, fontSize, fontName, bold).baseline`), aligning characters to baseline rather than using the object's bounding box frame.
- Displays thin purple guidelines (`#8b5cf6`, 1px non-scaling stroke) spanning across the canvas when moving objects into alignment.
- Snaps smoothly to aligned edges within a responsive threshold (~0.4–0.6 mm, scaled with zoom).
- Guidelines are active only during drag and disappear immediately upon mouse release (`finish` / `cancel`).
- Guidelines are marked with `data-editor-only="true"` and are cleanly stripped from SVG export and print output.
- Verification: 78 TypeScript tests passing, production build passing.

## 2026-10-15 — Floating quick property controls refactor (minimal & elegant)

- Redesigned the floating object property bar (`.context-bar`) with a modern frosted-glass pill aesthetic (`rgba(255, 255, 255, 0.94)`, `backdrop-filter: blur(14px)`, `box-shadow`, subtle borders).
- Eliminated vertical label clutter ("Font family", "Size (pt)", "Text align") to align all quick controls horizontally at a consistent 30px height.
- Implemented `.font-family-select` with integrated chevron indicator and smooth dropdown styling.
- Created `.unified-font-size-control` matching the bottom zoom control stepper: number input paired seamlessly with a `ChevronDown` preset dropdown menu.
- Converted Bold (B), Italic (I), and Underline (U) into a unified `.quick-btn-group` segmented pill with active teal highlights (`.chosen`).
- Converted "Auto size" checkbox into the tactile `.switch-toggle` with animated sliding knob.
- Unified text alignment buttons into a cohesive segmented icon group (`.quick-btn-group`).
- Verification: 78 TypeScript tests passing, production build passing.

## 2026-10-15 — Full Object Properties panel refactor (minimal & elegant)

- Redesigned the full Object Properties panel (`Inspector` / `.properties-popover`) using the same minimal, elegant frosted-glass design language (`backdrop-filter: blur(16px)`, `rgba(255, 255, 255, 0.96)`, `#e5e4df` subtle border, clean elevation shadow).
- Integrated `.font-family-select` with smooth chevron dropdown and unified font size stepper (`.unified-font-size-control`) into the Inspector typography section.
- Modernized text styles (Bold, Italic, Underline) and text alignment into unified `.quick-btn-group` segmented pill controls with refined active teal states (`.chosen`).
- Replaced the legacy Auto size checkbox with the tactile `.switch-toggle` sliding knob.
- Redesigned `AlignmentControls.tsx`: transformed bulky boxes and Thai text labels into two sleek segmented icon groups (Horizontal & Vertical alignment) using `.quick-btn-group`, preserving tooltips and ARIA accessibility labels.
- Standardized numeric dimension and coordinate inputs (X, Y, W, H) to 32px height with subtle `#00866c` focus rings and muted unit suffixes.
- Styled the Lock button (`.lock-btn`) and Remove button (`.property-remove`) with subtle iconography and cohesive hover states.
- Verification: 78 TypeScript tests passing, production build passing.

## 2026-10-15 — Android Studio-style Anchor constraint system & layout solver

- Removed "Align to label" (`AlignmentControls`) from the Object Properties panel as requested.
- Built a ConstraintLayout-style Anchor constraint system (`src/anchors.ts` and `src/AnchorControls.tsx`):
  - Each side of an object (top, bottom, left, right) can anchor to either the label (`parent`) or to any other object in the document.
  - Supports configurable margin/padding distances in mm (presets 0, 2, 4, 8 mm and custom numeric input) as well as `auto` margins (for automatic centering and flexible distribution).
  - Built an Android Studio-style visual Constraint Blueprint widget with interactive circular anchor nodes, margin badges, quick centering buttons (`H-Center`, `V-Center`, `Maximize`), and side tabs.
  - Implemented an iterative layout solver in `src/anchors.ts` (`solveAnchors`) that automatically repositions dependent objects when target objects move, resize, or when the document dimensions change (`op: 'resize'`).
  - Added canvas visual anchor guidelines in `src/renderer.tsx` showing dashed teal constraint lines (`.canvas-anchor-line`), source/target dots, and margin badges on the label canvas for the selected object (tagged `data-editor-only="true"` and omitted from SVG/print).
  - Synchronized canvas dragging in `src/useCanvasInteraction.ts` to update anchor margins when moving constrained objects.
  - Synchronized Go MCP tool schema in `internal/chatgptapp/server.go` to support `anchors` in `labelcraft_propose_edit`.
  - Verification: 84 TypeScript unit tests passing (including 6 new tests in `tests/anchors.test.ts`), production build passing, 25 Go unit tests passing, and printbridge cross-compilation passing for all 6 targets.

## 2026-10-15 — Fix typography frame gaps and switch alignment in Object Properties

- Fixed the empty gap inside the Style button group border: set `.type-row .quick-btn-group button` to `flex: 1`, distributing Bold, Italic, and Underline evenly across 3 equal segments without empty white space on the right.
- Fixed the gap in the font size control: set `.type-row .unified-font-size-control input` to `flex: 1` with centered text, docking the chevron arrow selector on the right at a consistent 26px width.
- Balanced Font Size and Style into an equal 50/50 two-column grid (`grid-template-columns: 1fr 1fr; gap: 10px;`) at matching 32px heights.
- Fixed the vertical text wrapping on "Auto size": forced `.switch-toggle` to `flex-direction: row !important; align-items: center !important;` so the switch pill and label sit horizontally side-by-side.
- Vertically aligned the Auto size switch with the text alignment icon group in a refined card container.
- Verification: 84 TypeScript tests passing, production build passing.

## 2026-10-15 — Rebuild Anchor Constraint Widget to authentically match Android Studio Layout Inspector

- Completely redesigned the Anchor constraint inspector in `src/AnchorControls.tsx` to replicate Android Studio's authentic 4-sided Constraint Widget:
  - Eliminated the tabbed interface in favor of simultaneous 4-sided Top/Bottom/Left/Right control.
  - Positioned 4 margin pills directly on the 4 blueprint box edges with preset dropdown popovers (`0`, `2`, `4`, `8`, `16`, `24`, `auto`).
  - Implemented 4 interactive circular anchor handles: clicking when unconstrained automatically calculates the current margin distance to parent without jumping (via `calculateCurrentMargin` in `src/anchors.ts`); clicking when linked disconnects the constraint.
  - Rendered horizontal and vertical SVG zigzag tension spring coils (`\/\/\/\/\/`) inside the blueprint center view when dual-axis centering constraints exist.
  - Added Android Studio quick toolbar buttons (`H-Center`, `V-Center`, `Clear All Constraints`).
  - Added comprehensive simultaneous attribute rows below the blueprint widget for all 4 edges, allowing explicit selection of target (`Parent` or another object), target snap edge (`Top`/`Bottom`, `Left`/`Right`), manual numeric margin inputs in mm, `Auto` toggle, and quick remove buttons.
  - Added on-canvas visual zigzag spring coils (`springPath` in `src/renderer.tsx`) and circular anchor perimeter nodes on the selected object, strictly marked with `data-editor-only="true"` so they never bleed into SVG export or physical printing.
- Verification: 84 TypeScript unit tests passing, production build passing, 25 Go unit tests passing with full race detection.

## 2026-10-15 — Canvas Drag & Drop Anchor Connections and Pixel-Scaled Delicate Nodes

- Re-engineered canvas anchor handles and connection mechanics:
  - Replaced fixed-mm anchor handles with screen-pixel-scaled delicate handles (`3.2 / pixelScale`), keeping dots tiny, sharp (3.2px radius), and non-intrusive at every zoom level (25%–1600%).
  - Added an invisible generous hit circle (`7.5 / pixelScale`) with `cursor: crosshair` for effortless pointer interaction without visual clutter.
  - Sized constraint line endpoints (`sx, sy`, `tx, ty`) and margin badges inversely with zoom (`vectorEffect="non-scaling-stroke"`).
  - Implemented interactive drag-and-drop anchor connections:
    - Dragging from any perimeter handle (Top, Bottom, Left, Right) draws an active rubberband wire in real time following the pointer.
    - Proximity to any other object automatically detects the closest edge, highlights the target object with a glowing dashed box and bold snap edge, and displays a floating pill badge (`Snap to [Object] (Edge)`).
    - Proximity to label boundary highlights the parent edge with a dashed line and snap badge (`Snap to Label (Edge)`).
    - Dropping commits the constraint with `calculateCurrentMargin` so the view maintains its exact placement without jumping.
    - A simple click without dragging continues to toggle the constraint (links to parent or disconnects).
  - Elevated the Blueprint Widget in `src/atelier.css` with an authentic Android Studio architectural blueprint grid (`radial-gradient`), rounded cards, and elevated margin pills.
- Verification: 84 TypeScript unit tests passing, production build passing, 25 Go unit tests passing, and 3 cross-compilations passing.

## 2026-10-15 — Authentic Android Studio Layout Inspector Constraint Widget Replication

- Replicated Android Studio Layout Inspector Constraint Widget matching the user's reference screenshot:
  - In the Inspector:
    - Dark slate theme (`#2b2d30` widget stage with `#313438` center view and `#4e5157` borders).
    - Split margin dropdown pills `[ margin | ▾ ]` with solid connector lines for active constraints.
    - Iconic Android Studio blue circular plus buttons `(+)` (`#3871e0`) connected via dotted lines for unconstrained edges (e.g. bottom).
    - Inner dimension glyphs inside the center view: horizontal and vertical fixed-dimension I-beams (`|———|`).
    - Horizontal Bias slider with circular thumb badge displaying `(50)` (or current percentage 0–100), smoothly adjusting horizontal position across available width.
    - Collapsible `> Constraints (N)` section with target, edge, and margin inputs.
  - On the Canvas:
    - Dense zigzag tension springs in vibrant Android Studio blue (`#2196F3`) ending with arrowheads at the parent/target boundaries (`|<` and `>|`).
    - Solid blue perimeter anchor nodes `(●)` with thin white centers on the selected view.
    - Floating margin distance numbers placed directly alongside the constraint lines.
- Verification: 84 TypeScript unit tests passing, production build passing, 25 Go unit tests passing, and 3 cross-compilations passing.

## 2026-10-15 — Authentic Android Studio Dot-to-Dot Constraint Linking & Cubic Bezier Wires

- Re-engineered drag & drop constraint linking matching Android Studio ConstraintLayout editor:
  - **Dot-to-Dot Target Discovery**:
    - During anchor dragging (`activeAnchorDrag`), all other objects on canvas visibly reveal their receptive circular anchor dots (Top & Bottom for vertical drags, Left & Right for horizontal drags).
    - As the pointer approaches another object or dot, the closest candidate anchor snaps magnetically with a glowing halo ring (`rgba(33, 150, 243, 0.22)`) and highlighted target box.
    - Dragging towards canvas borders snaps to the parent boundary with a guide rail.
  - **Smooth Cubic Bezier Wires (`bezierWirePath`)**:
    - When constrained to another object, rendered lines now accurately calculate the target object's true midpoint anchor handle coordinate (`getAnchorPoint(t, a.targetEdge)`), eliminating previous alignment offsets.
    - Connectors use smooth cubic Bezier arcs with natural departure/approach vectors and crisp arrowheads at the target dot.
    - Center dual-parent constraints render the classic Android Studio tension zigzag spring (`springPath`).
    - Margin badge pill is centered along the curve displaying exact distance (`margin mm` or `auto`).
  - **Refined, Compact Anchor Handles**:
    - Reduced visual handle radius to a crisp, subtle Android Studio proportion (`2.4 / pixelScale`, ~2.4 screen pixels), eliminating oversized dots.
    - Generous invisible hit zone (`7.5 / pixelScale`) with reliable element ID resolution on pointer down.
  - **Live Floating HUD Tooltip**:
    - Dynamic floating badge above cursor displaying target name, edge, and live margin (`Target • 8.0mm`).
## 2026-10-15 — Edge-Line Resize Handles (Border Grab for Height/Width Adjustment)

- Resolved conflict between constraint linking nodes at midpoints and height/width resizing:
  - **Full Border-Line Grab Handles (เส้นขอบเป็นจุดจับปรับขนาด)**:
    - Replaced overlapping middle square handles with active border edge lines:
      - **Top Edge (เส้นขอบบน)**: Spans `o.x` to `o.x + o.width` with cursor `ns-resize`, dragging increases/decreases height from top (`handle="n"`).
      - **Bottom Edge (เส้นขอบล่าง)**: Spans `o.x` to `o.x + o.width` with cursor `ns-resize`, dragging increases/decreases height from bottom (`handle="s"`). For linear barcodes, shortens/restores bar height.
      - **Left Edge (เส้นขอบซ้าย)**: Spans `o.y` to `o.y + o.height` with cursor `ew-resize`, dragging adjusts width (`handle="w"`).
      - **Right Edge (เส้นขอบขวา)**: Spans `o.y` to `o.y + o.height` with cursor `ew-resize`, dragging adjusts width (`handle="e"`).
    - Added subtle hover highlight (`.canvas-edge-resize:hover`, `.canvas-edge-resize-ew:hover`) indicating resizable edges with `ns-resize`/`ew-resize` cursors.
  - **Separation of Concerns matching Android Studio**:
    - Border edges are used to grab and resize dimensions (height and width).
    - Center circular nodes (`3.8 / pixelScale` compact hit radius) are dedicated constraint handles for linking (`crosshair` cursor).
    - 4 corner squares (`nw`, `ne`, `se`, `sw`) remain available for proportional/diagonal resizing.
## 2026-10-15 — Constraint Widget Stabilization & Circular Plus Button Styling

- **Rigid 3×3 Grid Layout (ป้องกัน center box เบี้ยว/ขยับเมื่อใส่ค่า margin)**:
  - Re-architected `.as-widget-frame` into a 3×3 CSS Grid with explicit columns (`1fr 92px 1fr`) and rows (`minmax(34px, auto) 60px minmax(34px, auto)`).
  - Column 2 is dedicated exclusively to `.as-center-view` (92px wide, centered horizontally and vertically).
  - Left slot (Col 1) and Right slot (Col 3) are both `1fr` width, guaranteeing that `.as-center-view` remains 100% dead center without any drift, skewing, or distortion when margins (e.g. `8.14`, `3.68`) are assigned or altered.
  - Connector lines and anchor dots align seamlessly with the center view perimeter.
- **Crisp Circular Plus Button (`.as-blue-plus-btn`) matching Android Studio**:
  - Overrode `.atelier button`'s global `min-height: 36px` and `border-radius: 10px` that previously stretched buttons into vertical pills.
  - Fixed `.as-blue-plus-btn` to a perfect 18px × 18px circle (`border-radius: 50% !important; min-width: 18px !important; min-height: 18px !important; max-width: 18px !important; max-height: 18px !important; line-height: 1 !important;`).
  - Centered bold plus icon (`<Plus size={10} strokeWidth={2.4}/>`) in Android Studio blue (`#3871e0`) with hover scale.
  - Reset `.as-margin-pill` and `.as-tool-btn` to their compact 22px design without vertical ballooning.
## 2026-10-15 — Editable Margin Combobox & Dark-Theme Hover Contrast Fix

- **Direct Typing + Preset Dropdown (`MarginCombobox`)**:
  - Replaced static margin button pills with an interactive combobox (`as-margin-combobox`) matching Android Studio:
    - **Editable Input Field (`.as-margin-input`)**: Direct numeric typing (e.g. `8`, `12.5`, `0`, or `auto`) with Enter/blur commits and Escape revert.
    - **Chevron Dropdown Arrow (`.as-combobox-arrow`)**: Opens preset popover (`Auto`, `0 mm`, `4 mm`, `8 mm`, `16 mm`, `24 mm`, `32 mm`).
    - **Click-Outside Dismissal**: Added `pointerdown` listener to automatically close open popovers when clicking outside.
- **Fixed White-on-White Hover Text Invisibility**:
  - Root cause: `.atelier button:hover { background: #eeede9 }` was overriding dark theme button styles with an off-white background while text color was light gray (`#dfe1e5`), rendering the text invisible on hover.
  - Solution: Container converted to a scoped `<div>` with explicit `.as-margin-combobox:hover` (`background: #43454a !important; color: #ffffff !important; border-color: #5f6368 !important;`), ensuring high contrast dark-theme readability at all times.
  - Active focus state highlights in Android Studio blue (`#3871e0`).
- Verification: 87 TypeScript unit tests passing, production build passing, 25 Go unit tests passing, and 3 print-bridge cross-compilations passing.

## 2026-10-15 — Interactive Canvas Anchor Drag & Drop Fix (การโยงเส้นจุดเชื่อมต่อ)

- **Root Cause Analysis (สาเหตุที่กดแล้วไม่มีเส้นลากออกมา)**:
  1. **Hit Target Conflict & Inadequate Hit Radius (`hitR`)**:
     - `hitR` was previously `Math.max(0.6, 3.8 / pixelScale)` (~3.8 to 4 screen pixels radius, 7.6px diameter).
     - Directly underneath sat the border resize handles (`canvas-edge-resize`, 12px wide) and object move rect (`pointerEvents="all"`).
     - Mouse clicks almost always missed the 7.6px dot and hit the edge resize line or object body instead.
  2. **Delayed Visual Feedback in `startAnchor`**:
     - `setActiveAnchorDrag` was omitted in `startAnchor` on mousedown, delaying wire appearance until after mouse movement occurred.
  3. **Static Snap Coordinates vs Dynamic Cursor Wire**:
     - Wire previously rendered only between snapped coordinates (`snapX, snapY`). When moving freely or snapping to parent, the line stayed glued to the border rather than following the mouse pointer.
  4. **Pointer Capture & React Re-render Event Loss**:
     - Mouse tracking was bound only to the viewport container element. Rapid movement or React re-renders could lose pointer tracking.
- **Implemented Fixes**:
  - **Enlarged Touch/Mouse Hit Radius**:
    - Increased `hitR` to `Math.max(2.5, 12 / pixelScale)` (minimum 24px diameter screen hit target) with `pointerEvents="all"` and `cursor: crosshair`, ensuring effortless grabbing without competing with edge resize handles.
    - Preserved crisp visual handle dot (`hr = Math.max(0.3, 2.4 / pixelScale)`).
  - **Instant Visual Response on Mousedown**:
    - In `startAnchor`, immediately initializes `setActiveAnchorDrag` with current candidate target so the anchor handle highlights with an active dashed ring, receptive candidate dots light up on all other objects, and the connecting wire appears instantly on click.
  - **Fluid Cursor-Following Interactive Wire**:
    - During free drag (when `isSnapped === false`), the wire smoothly follows the mouse pointer (`currentX, currentY`) with an active target circle and HUD badge.
    - When approaching an anchor dot on another object or a label boundary within snap threshold (10mm), the wire snaps magnetically to that target and highlights the target dot / parent edge.
  - **Global Window-Level Pointer Tracking**:
    - Attached window-level `pointermove`, `pointerup`, and `pointercancel` listeners during active dragging, guaranteeing continuous tracking across the entire screen regardless of speed or element boundaries.
- **Verification**:
  - 87 TypeScript unit tests passing (`tests/*.test.ts`).
  - Production build passing (`tsc --noEmit && vite build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Remove Barcode Resize Percentage Label Under Barcode (นำตัวเลข % ใต้บาร์โค้ดออก)

- Removed the on-canvas barcode magnification percentage text (`{Number(barcodeMagnification(o).toFixed(2))}%`) previously rendered below selected barcode elements (`aria-label="Barcode resize percentage"`).
- Canvas workspace remains clean without overlay text clutter under barcodes. Barcode properties and magnification remain fully accessible via the property inspector panel.
- Verification: 87 TypeScript unit tests passing, production build passing, 25 Go unit tests passing, and 3 print-bridge cross-compilations passing.

## 2026-10-15 — High-Visibility Anchor Wires & Dynamic Real-time Distance Updates During Dragging (เส้นโยงจุดยึดชัดเจนและอัปเดตระยะห่าง Real-time ขณะลาก)

- **High-Visibility Solid Anchor Wires**:
  - Fixed issue where anchor connection lines were rendered as faint hairlines (<0.25px) on high-DPI canvases due to dividing `strokeWidth` by `pixelScale` while `vectorEffect="non-scaling-stroke"` was active.
  - Upgraded anchor wires to clean, distinct 1.8px screen strokes, solid blue connection nodes, and clear arrowheads.
  - Added subtle dashed target outline (`stroke="#2196F3" strokeWidth="1.2" strokeDasharray="3 2"`) surrounding the target object when anchored to another object so the connected relationship is immediately visible.
- **Dynamic Real-time Distance Calculation During Object Movement**:
  - Implemented continuous anchor distance recomputation during `current.mode === 'move'` inside `useCanvasInteraction.ts`.
  - Margin badge on the canvas (`calculateCurrentMargin`) and sidebar constraint widget now dynamically reflect the exact physical distance as the object is being dragged across the label.
- **Verification**:
  - 88 TypeScript unit tests passing (`tests/*.test.ts`).
  - Production build passing (`tsc --noEmit && vite build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Print bridge cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.
## 2026-10-15 — Authentic Android Studio Constraint Widget Design & Syntax (ปรับดีไซน์และรูปแบบตาม Android Studio)

- **Authentic Android Studio Layout**:
  - Center Box: clean transparent 64×54px frame with 1px border (`#5a5d63`), 4 inward T-shaped I-beams with center opening, and removed inner text labels to match Android Studio's design.
  - Anchor Nodes: 11px solid gray circles (`#7a7f8d`) on constrained borders, vertical dotted connector leading to 18px blue circular `+` button on unconstrained edges.
  - Comboboxes: compact inputs with blue focus/active border (`#3871e0`).
  - Bias Slider: track with circular badge displaying `(50)` format.
- **Android Studio Syntax in Constraints List**:
  - Implemented `ConstraintLinkIcon` (authentic S-curve wire glyph connecting two nodes).
  - Formatted constraint rows in true Android Studio syntax: `Start → StartOf parent (0mm)`, `End → EndOf parent (0mm)`, `Top → BottomOf Brand (8mm)`.
  - Added dimension entries `Width (42.0mm)` and `Height (8.0mm)`.
  - Interactive row selection with inline target, edge, and margin editors.
- **Verification**:
  - 88 TypeScript unit tests passing (`tests/*.test.ts`).
  - Production build passing (`tsc --noEmit && vite build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Print bridge cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Streamlined Barcode Property Inspector & App-wide Light Theme Conversion (ปรับ Property ของ Barcode และเปลี่ยนธีมสีเป็นสีปกติ)

- **Redesigned Barcode Property Inspector & Eliminated Redundancies**:
  - Removed duplicate 4-button ratio row (`[50%, 100%, 150%, 200%]`); all ratio presets are now accessible via the integrated preset dropdown next to the `Ratio (%)` input.
  - Removed floating dimension readout from the Barcode editor; physical dimensions (`🔒 W × H mm · สัดส่วนคงที่ N%`) are now unified inside the "Position & size" inspector panel alongside X and Y coordinates.
  - Clean 2-column layout for linear barcodes placing `Ratio (%)` and `Bar height (%)` side-by-side, followed by `Top style`.
  - Polished collapsible "Technical details" section with clean key-value layout.
  - Preserved full keyboard accessibility and symbology validation feedback.
- **Full Light Theme Conversion for Constraint Layout Widget**:
  - Converted all `.as-*` components from dark/black backgrounds (`#1e1f22`, `#2b2d30`, `#313438`) to the application's clean light surface theme (`#ffffff` / `#fafaf8` / `#e5e4df`).
  - Center view rendered with subtle `#f8f9fa` canvas tint and `#c4c9d0` boundary.
  - Margin comboboxes and inputs styled with clean white background, `#d5d8dc` border, and royal blue focus ring (`#2563eb`).
  - Constraints list styled with clean white background, `#f1f5f9` dividers, `#f8fafc` row hover, and `#eff6ff` selection highlight.
- **Verification**:
  - 88 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Compact Sleek Arrowheads & Movable Target Connection Handles (ปรับลูกศรให้เล็กลงและสามารถลากย้ายจุดเชื่อมต่อที่ปลายลูกศรได้)

- **Compact Sleek Arrowheads**:
  - Reduced oversized arrowhead dimensions in `springPath` and `bezierWirePath`:
    - `arrowLen` reduced from `1.4mm` to `0.65mm` (more than 50% sleeker).
    - `arrowW` reduced from `1.0mm` (2mm span) to `0.4mm` (0.8mm total span).
    - Arrowhead stroke width refined to `1.3px` for crisp, sharp vector rendering.
  - Arrowheads now sit cleanly behind target anchor dots without overwhelming the canvas or text.
- **Interactive, Movable Target Connection Point**:
  - Made the target anchor point at the tip of the arrow interactive with `.canvas-anchor-target-handle` and `hitR` hit area.
  - Users can now click and drag directly from the arrow tip / connection point:
    - Dragging the target point moves the connection wire with magnetic target snapping to other objects or parent edges.
    - Dropping on a new target reconnects the constraint to that target with the new physical margin.
    - Dragging away into empty space or clicking to toggle deletes/disconnects the constraint.
    - While dragging, the old static wire is hidden and replaced by real-time responsive wire feedback.
- **Verification**:
  - 88 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Thin Crisp Edge Resize Hover Indicator (ปรับเส้นปรับความสูง/ความกว้างที่ขอบให้บางลง คมชัด ไม่หนาเกินไป)

- **Thin Non-Scaling Visual Edge Indicator**:
  - Replaced the thick 1.5mm–2mm edge resize line (`strokeWidth={Math.max(1.5, 6/pixelScale)}` without `vectorEffect`, which rendered as an oversized 15–22px blue band on screen) with a sleek, crisp 1.8px non-scaling vector indicator (`.canvas-edge-indicator` with `vectorEffect="non-scaling-stroke"`).
  - Maintained an ample transparent hit zone (`pointerEvents="stroke"`, 8 screen pixels) so users can easily grab the edge without requiring pixel-perfect mouse precision.
  - Hovering over any edge (top, bottom, left, right) highlights the edge with a clean, modern royal blue line (`#2563eb`) with smooth 0.12s transition.
  - Retained all existing resize functionality (`n`, `s`, `w`, `e`, `nw`, `ne`, `se`, `sw`) and clean SVG export stripping.
- **Verification**:
  - 88 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Fix Constraint Row Delete Button Hover Contrast (แก้ปุ่ม X ลบ Constraint พื้นหลังกลืนกับตัว X เมื่อเอาเม้าส์ชี้)

- **Contrast & Specificity Fix for `.as-as-row-del`**:
  - Identified root cause: `.atelier button:hover` (`background: #eeede9`) had higher CSS specificity than `.as-as-row-del:hover`, causing the delete button's hover background to become light beige/grey while `.as-as-row-del:hover` turned the `X` icon white (`#ffffff`), making the `X` invisible against the light background.
  - Added scoped `.atelier .as-as-row-del:hover` and `.atelier button.as-as-row-del:hover` rules with `background: #ef4444 !important; color: #ffffff !important;` and `stroke: currentColor !important;`.
  - Added active feedback (`#dc2626`) and explicit non-hover transparent background with `#94a3b8` slate icon.
  - Also protected `.as-accordion-toggle` and `.as-as-auto-toggle` against unwanted `.atelier button:hover` background overrides.
- **Verification**:
  - 88 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Strict Precision Hit Bounds for Connection Handles (ปรับพื้นที่ตรวจจับเมาส์ของจุดเชื่อมต่อให้ตรงกับขนาดจุดจริง)

- **Eliminated Oversized Phantom Hit Area**:
  - Identified root cause: `hitR` previously had an oversized minimum clamp `Math.max(2.5, 12 / pixelScale)` which in millimeter document units created a 2.5mm radius circle (25 to 50+ screen pixels wide). This caused mouse interactions (`crosshair`/`grab` cursor and dragging) to trigger prematurely when the mouse was still far away from the connection point.
  - Replaced `hitR` with screen-scaled pixel dimensions strictly matching visual circles:
    - Perimeter object handles: hit radius set to exact visual circle radius `r={hr}` (`3.8 / pixelScale` ≈ 7.6px diameter).
    - Arrow target handles: hit radius set to exact visual circle radius `r={hr * 1.15}` (`4.37 / pixelScale` ≈ 8.7px diameter).
  - Hover highlights and drag interactions now activate only when the mouse cursor is directly over the connection point.
- **Verification**:
  - 88 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Refine Zigzag Spring Link Wire (ปรับเส้นเชื่อมต่อแบบหยักให้มีขนาดเล็กลง เพรียวบาง และพอดีสายตา)

- **Compact, Refined Spring Path on Canvas**:
  - Reduced zigzag spring amplitude `amp` in `springPath` from `0.55mm` (1.1mm peak-to-peak) down to `0.22mm` (0.44mm peak-to-peak), cutting the zigzag width by 60% for a sleek, compact appearance.
  - Adjusted wave pitch `coils = Math.max(3, Math.floor(span / 0.75))` and lead distance for smooth, elegant wave transitions.
  - Reduced connection wire and active drag wire `strokeWidth` from `1.8px` down to `1.2px` (matching the `1.2px` arrow stroke width), replacing the heavy thick stroke with a crisp vector line.
- **Compact Spring in Blueprint Inspector Widget**:
  - Reduced horizontal spring height from 8px to 5px (`viewBox="0 0 64 5"`, `strokeWidth="1.1"`).
  - Reduced vertical spring width from 8px to 5px (`viewBox="0 0 5 54"`, `strokeWidth="1.1"`).
- **Verification**:
  - 88 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Enlarge Arrow Tip Connection Circle & Hand Pointer Cursor (ขยายขนาดจุดเชื่อมปลายลูกศรให้ชัดเจนขึ้น และเปลี่ยนเคอร์เซอร์เมาส์เป็นรูปมือ)

- **Larger, Prominent Arrow Tip Connection Circle**:
  - Increased arrow tip connection handle radius from `4.37px` to `targetR = 6.0 / pixelScale` (diameter ~12px on screen), making it easy to see, target, and grab.
  - Added a clean 1.8px non-scaling white border and an inner white center dot for clear visual affordance.
  - Aligned active dragging snap dot radius to `targetR` for consistent visual feedback.
- **Hand Pointer Cursor (`cursor: pointer`)**:
  - Changed cursor from `grab`/`crosshair` to `cursor: pointer` (👆 hand pointer) on both arrow tip connection handles and perimeter connection handles.
  - Active drag continues to use `cursor: grabbing` (✊ closed hand) during movement.
- **Verification**:
  - 88 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Unified Ratio Combobox for Barcode Inspector (ปรับช่อง Ratio เป็น Combobox Pill สไตล์เดียวกับ Constraint Widget)

- **Unified Combobox Pill Control (`RatioCombobox`)**:
  - Replaced the side-by-side number input + native `<select>` button with a single cohesive pill combobox, matching the design of `MarginCombobox` in the constraint widget.
  - Composed of:
    - Text input with bold numeric ratio value, removing browser default spin buttons (`▲▼`).
    - Subtle vertical divider line (`|`, `.as-combobox-divider`).
    - Down chevron trigger (`⌄`, `<ChevronDown size={11} className="as-chevron" />`).
    - Floating preset popover (`.as-preset-popover.as-ratio-popover`) with clean hover states and active `.chosen` indicator.
- **Interactions & Validation**:
  - Direct keyboard entry commits and validates on Enter or Blur, clamping values within symbology limits (`limits.min` – `limits.max`).
  - Escape key reverts uncommitted draft value.
  - Click-outside detection automatically closes the preset dropdown popover.
  - Presets list dynamically filters values according to symbology scale limits.
  - Maintains full accessibility (`aria-label="Barcode magnification"` and `aria-label="Barcode ratio presets"`).
  - Responsive styling support for both sidebar inspector (35px height) and quick barcode dock (30px height).
- **Verification**:
  - 88 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Align Ratio Combobox and Bar Height Fields (ปรับระดับความสูงและเส้นขอบของช่อง Ratio และ Bar Height ให้เท่ากันพอดี)

- **Exact Vertical and Dimensional Alignment**:
  - Matched `.as-ratio-combobox` height (`32px`), border radius (`8px`), border (`1px solid #d5d8dc`), and box shadow (`0 1px 2px rgba(0,0,0,.02)`) exactly with the inspector's input specification.
  - Eliminated extra top margin on `.as-ratio-wrap` so both `Ratio (%)` and `Bar height (%)` labels share identical `gap: 5px`, ensuring top edges align at the exact same pixel.
  - Aligned grid items with `align-items: start; gap: 10px; margin-bottom: 10px;`.
- **Verification**:
  - 88 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Relocate Remove Object Button to Content Header (ย้ายปุ่มลบวัตถุเป็นไอคอนถังขยะด้านขวาของ CONTENT)

- **Header Placement & Clean Icon Design**:
  - Moved the object deletion action from the bottom of the inspector up to the top Content section header (`.property-section-header`), directly to the right of `<h4>Content</h4>`.
  - Replaced the large bottom rectangular button ("Remove object") with a compact, dedicated trash can icon button (`.property-remove-btn`) using `<Trash2 size={14} />`.
  - Styled with subtle hover interaction (`#fdf3f2` background with `#d32f2f` danger red icon) and properly disabled when the object is locked (`disabled={item.locked}`).
- **Verification**:
  - 88 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Value Source Redesign & LEGO Formula Builder (ออกแบบ Value Source ใหม่หมด พร้อมตัวสร้างสูตร Formula แบบ LEGO)

- **Unified Value Source Grouped Dropdown with Dividers**:
  - Completely redesigned "Value source" selector in the property inspector into a structured grouped list:
    - **Fixed value**
    - Divider (`──────────`)
    - **Variable** group (listing all defined variables + `+ Variable` shortcut)
    - Divider (`──────────`)
    - **Formula** group (listing all created formulas + `+ Formula` shortcut)
  - Selecting `+ Variable` directly opens `VariablesDialog`.
  - Selecting `+ Formula` opens `FormulaBuilderDialog`.
  - Contextual inspector panel shows prefix/suffix for variables, or formula details card (with name, block count, live preview badge, and `✏️ Edit Formula` button) when a formula is active.
  - Added 1-click action pills (`+ Variable`, `+ Formula`) below the dropdown for quick management.
- **Variables with Multi-Formula Composition**:
  - Variables can now compose and interpolate values from multiple formulas simultaneously via `{{formula:FormulaName}}` or `{{formula:FormulaId}}`.
  - In `VariablesDialog`, added one-click formula helper pills (`+ Combine Formula: [+ Exp Date]`) to easily insert formula tags into default variable values.
  - Added live preview in `VariablesDialog` to display the evaluated formula string in real time.
- **LEGO-Style Visual Formula Builder (`FormulaBuilderDialog`)**:
  - Interactive modular builder where users construct formulas without typing code:
    - **DateTime Function**: `now` (current date/time), `format_date` (presets or custom mask), `add_days` (add/subtract days for expiry calculations), `add_months`, `add_years`, `date_part` (day, month, year, weekday).
    - **String Function**: `concat` (combine text/variables), `pad_start` (zero/char padding), `pad_end`, `substring` (slice text), `uppercase`, `lowercase`, `replace`, `trim`.
    - **Numeric Function**: `counter` (sequence generator with pad), `math_op` (+, -, *, /), `round` (decimal rounding).
    - **Condition (IF)**: if/else branching with comparison operators (`==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `empty`).
    - **LOOP / Repeat**: repeats text or patterns N times.
  - Formula variables integration: blocks can pull values from document variables (`fromVariable`) or static inputs.
  - Visual LEGO-brick block styling (`.lego-block` with top studs, category border accents, move up/down reordering, remove buttons).
  - Real-time live simulation card (`.formula-simulation-card`) displaying the simulated result dynamically as blocks are added or modified.
  - Multi-formula manager: create, name, duplicate, and delete multiple independent formulas per document.
- **Architecture & Transaction Engine**:
  - Added `LabelFormula` and `FormulaBlock` schemas to `LabelDocument.formulas`.
  - Added `setFormulas` operation to `Command` and `apply` transaction engine in `src/core.ts`.
  - Updated Go MCP schema in `internal/chatgptapp/server.go` with `formulaBlock` and `formula` schemas.
- **Verification**:
  - 94 TypeScript unit tests passing (`npm test`, including 6 new comprehensive formula evaluation and interpolation suites).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Close Project with Confirmation (ปุ่มปิดโปรเจคพร้อมหน้าต่างถามยืนยัน)

- **Interactive Close Button on Document Tabs**:
  - Added an intuitive close button (`×`, `<X size={12} />`) to each document tab in `DocumentTabs` (`.tab-close-btn`).
  - Styled with subtle hover interaction (`#fee2e2` background with `#dc2626` icon) and scoped click propagation prevention so clicking close does not switch tabs accidentally.
  - Also added a "Close label" action in the `File` menu dropdown for convenient access.
- **Safety Confirmation Dialog (`CloseProjectDialog`)**:
  - Promptly presents a clean modal dialog (`.close-project-dialog`) asking for user confirmation before closing the project.
  - Displays the project's exact title and helpful message clarifying that unexported changes may be lost (with export JSON advice).
  - Handles fallback gracefully: if the closed document was the only active one, automatically initializes a fresh new project (`newJob(1)`) so the workspace remains usable; if closing an active project among multiple, automatically switches to the nearest remaining tab.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`, including close project lifecycle test).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Formula Builder UX Overhaul & Spacious Layout (ปรับปรุง Formula Builder ให้ใช้งานง่าย ไม่บีบอัด)

- **Modal Sizing Override Fix**:
  - Identified that global `.modal` width was locked to 450px in `src/style.css`, severely cramping `.formula-modal` and causing block inputs and category palette to truncate.
  - Added strict high-priority sizing rules (`width: min(900px, 95vw) !important; max-width: 900px !important; height: min(800px, 92vh) !important;`) to ensure generous breathing room across all screen sizes.
- **1-Click Quick Presets Bar (⚡ สูตรสำเร็จรูปยอดนิยม)**:
  - Added top preset bar allowing users to generate complete working formulas with a single click:
    - ⚡ วันหมดอายุ (+30 วัน)
    - ⚡ วันหมดอายุ (+1 ปี)
    - ⚡ Lot วันนี้ (LOT-YYYYMMDD)
    - ⚡ รหัสลำดับ (SEQ-0001)
    - ⚡ แปลงพิมพ์ใหญ่ (UPPERCASE)
- **Categorized Horizontal Tabs & Natural Thai Sentence Blocks**:
  - Replaced the overwhelming vertical list of 15 buttons with 5 clean horizontal category tabs:
    - 📅 วันที่และเวลา | 🔤 จัดการข้อความ | 🔢 ตัวเลขและลำดับ | 🔀 เงื่อนไข IF | 🔁 ทำซ้ำ Loop
  - Filtered function chips grid with clear Thai descriptions for easy selection.
  - Re-engineered block forms into natural Thai reading sentences (e.g. `บวกเพิ่ม: [ 30 ] วัน | รูปแบบวันที่: [ DD/MM/YYYY ⌄ ]`) rather than rigid key/value technical inputs.
  - Added step flow indicator (`⬇ นำผลลัพธ์ส่งต่อไปยังขั้นตอนถัดไป...`) connecting LEGO blocks visually.
  - Featured prominent Live Simulation card at the top displaying real-time outputs immediately.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Step-by-Step Formula Wizard (ตัวช่วยสร้างสูตรแบบถาม-ตอบทีละขั้นตอน)

- **Dedicated Formula Wizard Mode (Default)**:
  - Added a top mode switcher between **🧙‍♂️ ตัวช่วยถาม-ตอบ (Wizard - แนะนำ)** and **🧱 ต่อบล็อก LEGO (โหมดขั้นสูง)**.
  - Wizard mode removes all visual clutter and block assembling friction, replacing it with a 2-step guided experience:
    - **ขั้นตอนที่ 1: เลือกประเภทสูตรที่ต้องการ** (การ์ดขนาดใหญ่ 6 หมวดหมู่: วันหมดอายุ/วันที่ล่วงหน้า, วันที่ผลิต/วันปัจจุบัน, เลขอัตโนมัติ/ลำดับรัน, รหัส Lot ผสมวันที่, จัดการข้อความ, เงื่อนไข IF/ELSE)
    - **ขั้นตอนที่ 2: ตอบคำถาม 1-2 ข้อง่ายๆ** (ปุ่มลัดเลือกค่าที่ใช้บ่อย เช่น `+7 วัน`, `+14 วัน`, `+30 วัน`, `+1 ปี`, ฟอร์แมตวันที่, กำหนดข้อความนำหน้า/ต่อท้าย)
- **Instant Live Preview & Single-Click Application**:
  - Step 2 features a sticky summary card displaying the evaluated live result in real time (`EXP: 14/11/2026`).
  - Single click on `✨ บันทึกและใช้สูตรนี้ทันที` generates the underlying LEGO blocks automatically and applies them to the formula.
  - Power users can click `🔍 ดูบล็อก LEGO ที่สร้างให้` to inspect and fine-tune individual blocks in advanced mode.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Reimagined 2-Column Visual LEGO Builder (คิดใหม่ ทำใหม่: ตัวต่อ LEGO สายพาน 2 คอลัมน์)

- **Eliminated Header Clutter (No More Stacked Bars)**:
  - Replaced the 5 vertically stacked toolbars with a single, streamlined top app bar containing:
    - Formula switcher dropdown and inline rename field.
    - Prominent, high-contrast final live result badge (`🎯 ผลลัพธ์สุดท้าย: SEQ-0001`).
    - Clean close modal action.
- **Dedicated 2-Column Workspace**:
  - **Left Sidebar (~290px LEGO Toolbox)**:
    - Quick 1-click recipe templates at top (`⚡ วันหมดอายุ 30 วัน`, `⚡ Lot วันนี้`, `⚡ เลขรัน 0001`, `⚡ UPPERCASE`).
    - Organized piece categories with distinct color-coded chips (📅 วันที่, 🔤 ข้อความ, 🔢 ตัวเลข, 🔀 เงื่อนไข, 🔁 ทำซ้ำ).
    - Categorized piece cards with descriptive text and 1-click `[+ เพิ่มชิ้นนี้]` button that instantly snaps the piece onto the chain.
  - **Right Main Canvas (LEGO Baseplate Workspace)**:
    - Subtle blueprint dot grid background for genuine tactile feel.
    - True 3D embossed LEGO studs on each brick (`○ ○ ○ ○ ○ ○`).
    - Color-coded borders and accents per category.
    - High-contrast, tactile action buttons (Up `▲`, Down `▼`, and Red `🗑️ ลบ`) resolving previous faint/empty icon issues.
    - Flow connector with downward arrow (`⬇ ส่งผลลัพธ์ไปยังชิ้นถัดไป`) between bricks.
    - **Live Step-by-Step Output Footer**: Every single brick dynamically displays its intermediate calculated result (`✨ ผลลัพธ์ของขั้นตอนนี้: [ ... ]`), giving instant visual feedback on how each block transforms the data.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Ultra-Minimal LEGO Formula Builder (มินิมอล ใช้งานง่าย คลีนสบายตา)

- **Removed Heavy Sidebars & Noisy Backgrounds**:
  - Eliminated the cluttered 290px left sidebar and dizzying blueprint dot grid in favor of a sleek, centered, single-flow canvas (`max-width: 620px`).
  - Removed pseudo-stud dashes in favor of clean modern cards with subtle colored category left borders.
- **Single-Line Natural Sentence Blocks**:
  - Converted block parameter forms into concise, single-line natural Thai sentences (e.g., `บวกเพิ่ม: [ 30 ] วัน • รูปแบบ: [ 15/10/2026 (DD/MM/YYYY) ⌄ ]`).
  - Integrated intermediate result pills directly into the brick header (`➔ 14/11/2026`).
- **Inline Action Bar (`+ ต่อบล็อกเพิ่ม`)**:
  - Replaced the multi-tier sidebar with a clean floating category action row right under the block chain:
    - `[ + 📅 วันที่ / วันหมดอายุ ▾ ]`
    - `[ + 🔤 ข้อความ / คำนำหน้า ▾ ]`
    - `[ + 🔢 ตัวเลขและลำดับ ▾ ]`
    - `[ + 🔀 เงื่อนไข IF ]`
  - Clicking any category opens a sleek popover menu to add that block in 1 click.
- **Streamlined Top Bar & Presets**:
  - Clean browser-style formula tabs (`[ 🧩 วันหมดอายุ ] [ + ]`).
  - Compact live result pill (`ผลลัพธ์: 14/11/2026`) and 1-click recipe pills (`[ ⚡ วันหมดอายุ 30 วัน ] [ ⚡ Lot วันนี้ ] ...`).
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Quick Barcode Context-Bar Baseline Alignment (จัดระนาบช่องเครื่องมือบาร์โค้ด)

- **Root Cause**:
  - The floating context bar (`.quick-barcode`) contained a mix of native `<select>`, `<input type="number">`, custom `RatioCombobox` component, and labels.
  - The barcode symbology and style dropdowns were wrapped in `.barcode-editor > label` which was inheriting flex-direction column and 6px gap from global `style.css`.
  - Differing margins, spin buttons, line-heights, and box-sizing across `<select>`, `<input>`, and `.as-ratio-wrap` caused the controls to sit on staggered vertical baselines.
  - An errant `.barcode-editor { flex-wrap: wrap; justify-content: center; }` on line 19 of `atelier.css` caused inconsistent flex layouts.
- **Fix**:
  - Locked all controls, wrappers, inputs, selects, comboboxes, and labels in `.atelier .quick-barcode` to a uniform `height: 30px`, `display: inline-flex`, `align-items: center`, and `box-sizing: border-box`.
  - Enforced `vertical-align: middle !important` and `margin: 0 !important` across all child elements.
  - Reset number input spin-buttons with `-webkit-inner-spin-button, -webkit-outer-spin-button { appearance: none !important; margin: 0 !important; }`.
  - Standardized `.as-ratio-wrap` and `.as-ratio-combobox` with `height: 30px !important`, ensuring `Ratio (%)` and `Bar height (%)` align horizontally on the exact same center baseline as the dropdowns, divider, and context button.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Spacious 2-Panel LEGO Formula Studio (ขยายพื้นที่กว้าง ใช้งานง่ายด้วย 1-Click Palette)

- **Spacious Studio Layout & Fullscreen Toggle**:
  - Expanded dialog from cramped 800px popup to a generous `1200px × 860px` studio workspace (`width: min(1200px, 96vw)`, `height: min(860px, 92vh)`).
  - Added 1-click **Maximize / Fullscreen toggle** (`[ ⛶ ]`) expanding to `98vw × 96vh` for maximum working comfort.
- **Left Palette (คลังชิ้นส่วน LEGO 1 คลิกต่อบล็อก & แม่แบบสำเร็จรูป)**:
  - Fixed 330px sidebar with always-visible categories and 1-click addition buttons (no hidden dropdowns).
  - **Instant 1-Click Templates**: Expiry 30 days, Expiry 1 year, Lot today, Running sequence, Uppercase, Price + VAT 7%.
  - **Categorized Bricks**:
    - 📅 Date & Time: Now, Add days, Add months, Add years, Format date, Date part.
    - 🔤 Text & Variables: **Dedicated `variable` brick (`🧩 ดึงค่าตัวแปร`)**, Concat prefix/suffix, Pad 0s, Uppercase, Lowercase, Substring, Replace, Trim.
    - 🔢 Numbers & Math: Counter, Math op (+ - × ÷), Round decimals.
    - 🔀 Logic & Loops: IF/ELSE condition, Repeat pattern.
- **Right Workspace & Live Previews**:
  - Prominent **Live Result Card** in 18px monospace green box with 1-click copy action.
  - Project variables bar showing real document variables.
  - **Inline Variable Inserters (`[ {x} ตัวแปร ▾ ]`)** on text inputs allowing 1-click variable tag insertion without manual typing.
  - **Quick Shortcut Pills** inside bricks (e.g. `[+7 วัน]`, `[+14 วัน]`, `[+30 วัน]`, `[+60 วัน]`, `[+90 วัน]`, `[+1 ปี]`, `[+ VAT 7%]`, `[ลด 10%]`).
  - Tactile LEGO styling: 3D studs, step badges, colored category borders, duplicate brick, re-ordering, and step-by-step intermediate output badges.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Smart Constraint Edge Auto-Detection & Thin Object Handle Separation

- **Root Cause of Line Moving Above Text**:
  - Thin line objects (`height: 0.1mm`) had overlapping top and bottom anchor handles (`cy: y` vs `cy: y+h`).
  - The bottom handle SVG circle rendered after the top handle, so pointer-down on the line always grabbed `side = 'bottom'` instead of `'top'`.
  - When dragging upwards to an object above (such as "ACTIVE 5"), it created `Bottom → BottomOf Brand (2.8mm)`, which in layout engine mathematics solves as `line.bottom = Brand.bottom - 2.8mm`, pulling the line UP into the text.
- **Fix**:
  - **Handle Separation**: In `src/renderer.tsx`, separated top and bottom handles on thin objects (`isThinV`) by an offset (`vOffset = 3.5 / pixelScale`), allowing distinct visual and hit-test selection of top vs bottom handles.
  - **Smart Drag Direction Auto-Detection**: In `src/useCanvasInteraction.ts`, when snapping an anchor wire between objects, the engine checks relative geometry:
    - If the source item is physically below the target, the connection automatically binds to the source item's **`top`** edge (`Top → BottomOf`).
    - If the source item is physically above the target, the connection automatically binds to the source item's **`bottom`** edge (`Bottom → TopOf`).
    - Corresponding horizontal auto-detection for `left` and `right`.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Authentic LEGO® Education Word Blocks Studio (Scratch 3.0 Jigsaw Blocks)

- **Authentic LEGO Word Blocks Visual Architecture**:
  - Replaced generic web cards with genuine **LEGO Education SPIKE Prime / Scratch 3.0 Word Blocks**:
    - **Classic Puzzle Tabs & Sockets**: Interlocking top notch (凹 socket in) and bottom tab (凸 tab out) connecting sequentially.
    - **Hat Block at the Top**: `🚩 เมื่อคำนวณสูตร [ชื่อสูตร]` starting the formula execution chain.
    - **Official Category Palette Colors**:
      - 🟧 Variables (`#FF8C1A`): `( [ตัวแปร] )` oval pills, `ตั้งค่าผลลัพธ์เป็นตัวแปร [ ▾ ]`
      - 🟦 Date & Time (`#4C97FF`): `( วันที่ปัจจุบัน รูปแบบ [DD/MM/YYYY ▾] )`, `( วันที่ปัจจุบัน + [30] วัน )`, etc.
      - 🟩 Operators & String (`#59C059`): `( เชื่อมข้อความ [ ] กับ [ ] )`, `( เติมเลข [0] ด้านหน้า [4] หลัก )`, uppercase, substring, etc.
      - 🟪 Math & Numbers (`#9966FF`): Counter, Math operations, Round decimals.
      - 🟨 Control / Logic (`#FFAB19`): IF / ELSE condition blocks, Repeat pattern.
    - **White Inset Input Slots**: Rounded white capsule pills (`border-radius: 14px`) with inner shadows for numeric and string values.
    - **Speech Bubble Step Output**: Each block displays its dynamic intermediate result in a Scratch-style speech bubble `💬 ได้ค่า: "..."`.
    - **Scratch Stage Monitor**: High-contrast LCD stage display at the top right showing live formula output with active green LED and copy button.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
## 2026-10-15 — Fix Vertical Scrolling & Auto-Scroll in LEGO® Word Blocks Canvas

- **Root Cause of Canvas Overflow**:
  - In CSS Flexbox, flex items default to `min-height: auto`. Intermediate flex containers (`.wb-coding-workspace` and `.wb-canvas-scroll`) expanded their height to accommodate long block chains instead of conforming to the dialog viewport.
  - As a result, when users added multiple function blocks (e.g. 7+ blocks), the stack extended past the screen edge, clipped behind the footer, and mouse/touchpad scrolling was blocked because the scroll container never reached its overflow boundary.
- **Fix**:
  - **Flexbox Scroll Constraints**: Added `flex: 1 1 0% !important; min-height: 0 !important; height: 0 !important; max-height: 100% !important; overflow-y: auto !important;` to `.wb-canvas-scroll` and `.wb-palette-blocks-scroll`.
  - Added `min-height: 0 !important; height: 100% !important;` to `.wb-coding-workspace` and `.wb-palette-sidebar`.
  - **Visible Custom Scrollbars**: Added styled 10px scrollbars with hover states (`::-webkit-scrollbar` and Firefox `scrollbar-width: thin`) so users can easily see and drag the scrollbar.
  - **Bottom Breathing Room**: Added `padding-bottom: 80px` to `.wb-blocks-chain-container` so the last block and its step speech bubble have ample clearance above the bottom boundary.
  - **Auto-Scroll on Block Addition**: Implemented `useEffect` and `canvasScrollRef` on `.wb-canvas-scroll` to smoothly auto-scroll down to the latest block whenever a new block is appended or inserted.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Minimal LEGO® Word Blocks & Action Button Icon Visibility Fix

- **Issues Addressed**:
  - The block trailing action buttons (move up, move down, duplicate, delete) appeared as an empty dark rectangle with no icons. Root cause: global `button` padding (`padding: 9px 12px` in `src/style.css`) caused `.wb-btn-act` (`width: 22px; height: 22px`) content-box to collapse to negative dimensions (`22 - 24 = -2px`), squishing inner SVG icons to 0 width.
  - Blocks were bulky and occupied too much vertical and horizontal screen real estate, causing date formats and labels to wrap awkwardly into two rows.
  - Step result speech bubbles were pushed off the right screen edge due to excessive text (`ได้ค่า: "..."`).
- **Fixes**:
  - **Visible Action Buttons**: Enforced `padding: 0 !important; width: 20px !important; height: 20px !important;` on `.wb-btn-act`, explicit white stroke `stroke: #ffffff !important; stroke-width: 2.2 !important;` on `.wb-btn-act svg`, and `color="#ffffff"` on Lucide icon components. Up/down/copy/trash icons are now crisp, sharp, and centered.
  - **Minimal & Compact Block Design**:
    - Reduced `.wb-block` padding from `10px 16px` to `4px 10px`, font size to `12px`, and prevented multiline wrapping (`white-space: nowrap`).
    - Scaled puzzle notch and bottom tab proportionally (`16px × 4px`).
    - Reduced `.wb-hat-block` padding to `5px 14px 7px` with matching `12px` font.
    - Compacted form controls: `.wb-slot-input` and `.wb-slot-dropdown` height `24px` with `border-radius: 12px`, padding `1px 7px`, font size `11.5px`.
    - Simplified date format select options to clean standard codes (`DD/MM/YYYY`, `YYYY-MM-DD`, `YYYYMMDD`).
  - **Compact Step Bubble**: Changed speech bubble output to `= "{stepVal}"` with slim padding `2px 7px` and max width `190px`, preventing horizontal overflow.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-15 — Enforce English-Only Formula Names

- **Requirement**: Formula names must be strictly in English (`A-Z, a-z, 0-9, _, -`).
  - **Rationale**: Formula evaluation and variable interpolation syntax (`{{formula:name}}`) relies on clean identifier matching (`[A-Za-z0-9_:]+`).
- **Changes**:
  - **Preset Recipes**: Updated all built-in formula presets to English names: `Expiry_30_Days`, `Expiry_1_Year`, `Lot_Today`, `Auto_Sequence`, `Uppercase_Text`, `Price_With_VAT`.
  - **Default & New Formulas**: Initial default formula named `Expiry_30_Days`; new formulas created via "+ Formula" named `Formula_N`.
  - **Input Sanitization**: Restricts formula name text field via real-time regex filtering (`replace(/[^A-Za-z0-9_\-\s]/g, '')`), stripping any non-English/Thai characters.
  - **Save Validation**: Automatically sanitizes all formula names on save to guarantee valid English names.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-16 — Minimal Atelier Top Bars & Category Strip in LEGO® Word Blocks Studio

- **Issues Addressed**:
  - Global `.atelier button` (`min-height: 36px; border-radius: 10px; border-color: #e5e4e1`) and `style.css` (`padding: 9px 12px; gap: 8px; background: white`) bled into `.wb-cat-strip-btn`, turning the 5 category tabs (`ตัวแปร`, `วันที่`, `ข้อความ`, `เงื่อนไข`, `แม่แบบ`) into oversized white bordered buttons that overflowed the sidebar and clipped the 5th tab (`แม่แบบ`).
  - The dialog top header (`#2a3447`) and two-row stage monitor card felt heavy compared to LabelCraft's minimal light Atelier theme (`#faf9f6`, `#202124`, `#007a62`).
- **Fixes**:
  - **Minimal Segmented Category Strip (`.wb-category-strip`)**: Converted to a 5-column equal grid (`grid-template-columns: repeat(5, minmax(0, 1fr))`) with compact 28px-tall tabs (`padding: 0 4px !important; font-size: 11px !important`), 7px category dots, transparent inactive state, and subtle elevated white active pill (`#ffffff` with `#e2e2dd` border), ensuring all 5 categories fit cleanly without horizontal clipping.
  - **Minimal Atelier Header (`.wb-studio-header`)**: Restyled header to clean `#ffffff` surface with `#e5e4e1` border, `#202124` typography, 28px-tall formula tabs using Atelier emerald teal active states (`#e6f3ef` / `#007a62`), and borderless 28×28px window action buttons.
  - **Compact Single-Row Stage Bar (`.wb-stage-bar`)**: Inline formula name field (`height: 30px`) and single-row stage output badge (`[● ผลลัพธ์:] [ value ] [ คัดลอก ]`), plus matching minimal footer buttons.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-16 — Drag-and-Drop Block Reordering & Readable Slot Inputs in LEGO® Word Blocks Studio

- **Issues Addressed**:
  - Moving blocks up/down previously required clicking tiny Up/Down arrow buttons (`ChevronUp` / `ChevronDown`) at the right end of each block; the user requested direct drag-and-drop reordering and removal of the arrow buttons.
  - Input slots (`.wb-slot-input.num`, `.wb-slot-input.mini`, `.wb-slot-dropdown`) inside each block were clipped and unreadable because global `src/style.css` (`input, select { padding: 8px 10px; width: 100%; height: 35px; }`) and browser native `<input type="number">` spin buttons (`::-webkit-inner-spin-button`) consumed ~20px inside 52px-wide pill inputs.
- **Fixes**:
  - **Drag-and-Drop Reordering**: Replaced `moveBlock` and the Up/Down arrow buttons with HTML5 drag-and-drop reordering (`reorderBlock`) on `.wb-step-row`, including a `<GripVertical>` handle inside `.wb-block-index`, live swap on `onDragOver`, visual `.is-dragging` feedback, and automatic `draggable=false` on `onMouseDown` when interacting with `<input>`, `<select>`, or `<button>` controls.
  - **Readable Slot Inputs & Dropdowns**: Removed native number spin buttons (`-webkit-appearance: none; display: none;` and `-moz-appearance: textfield`), widened `.wb-slot-input.num` to `68px !important`, `.wb-slot-input.mini` to `48px !important`, `.wb-slot-dropdown` to `min-width: 118px !important`, and text inputs to `90px–125px` with `6px` border-radius and `padding: 0 6px !important` / `0 8px !important`.
- **Verification**:
  - 95 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-16 — Variable Setter Blocks (`set_variable`, `change_variable`, `set_value`) & Inline Variable Management in LEGO® Word Blocks Studio

- **Issues Addressed**:
  - The Variables (`ตัวแปร`) category previously only read variable values (`functionName: 'variable'`) and lacked blocks to set or modify variable values (`set [variable v] to [...]`, `change [variable v] by (...)`).
  - `resolveVariableValuesWithFormulas` previously passed an empty `{}` variable map into `evaluateAllFormulas`, preventing formulas from reading initial document variables or propagating mutated variable values back to the label document.
- **Fixes**:
  - **Formula Engine (`src/formulaEngine.ts`)**:
    - Added `set_variable` (`mode: 'custom' | 'current'`, `value`), `change_variable` (`delta`), and `set_value` (`value`).
    - Updated `evaluateAllFormulas` and `resolveVariableValuesWithFormulas` to pass initial document variables into formula evaluation and propagate variable mutations across blocks, formulas, and resolved label variables.
  - **LEGO® Word Blocks UI (`src/FormulaBuilderDialog.tsx`, `src/App.tsx`, `src/formula.css`)**:
    - Added inline variable creation and direct value editing in the `ตัวแปร` palette shelf (`[ชื่อตัวแปร] = [ค่าเริ่มต้น] [+ ตั้งค่า]`), plus per-variable value input, quick `Set` block insertion, and delete button.
    - Added Orange Variable Blocks in the palette and canvas: `กำหนดค่าตัวแปร [v] เป็น [ค่าที่ระบุ / ผลลัพธ์ก่อนหน้า]` (`set_variable`), `เปลี่ยนค่าตัวแปร [v] เพิ่ม/ลดทีละ [...]` (`change_variable`), `ดึงค่าจากตัวแปร [v]` (`variable`), and `กำหนดค่าตั้งต้นเป็น [...]` (`set_value`).
    - Connected `FormulaBuilderDialog` `onSave` to commit both `setFormulas` and `setVariables` atomically in `App.tsx`.
- **Verification**:
  - 96 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-16 — Drag-and-Drop Variable Reporter Pills into Any Block Input Slot (`×` to Remove)

- **Issues Addressed**:
  - Users requested the ability to use a variable's value inside any editable input slot of any LEGO® Word Block by dragging a variable reporter pill directly into that slot, and to remove the variable from the slot using an `×` button beside the variable name.
- **Fixes**:
  - **Formula Engine (`src/formulaEngine.ts`)**:
    - Added `resolveNum` helper and template resolution (`resolveTemplate`) across all numeric and string block parameters (`days`, `months`, `years`, `format`, `delta`, `length`, `char`, `start`, `padZeros`, `value`, `decimals`, `times`) so any slot storing `{{varName}}` dynamically evaluates the variable's runtime value.
  - **LEGO® Word Blocks UI (`src/FormulaBuilderDialog.tsx`, `src/formula.css`)**:
    - Made variable reporter pills (`.wb-pill-reporter`) in both the left `ตัวแปร` palette and the top `.wb-variables-ribbon` draggable (`draggable={true}`, `startVariableDrag`, `endVariableDrag`).
    - Upgraded all 21 editable input slots across all blocks (`set_variable`, `change_variable`, `set_value`, `add_days`, `add_months`, `add_years`, `format_date`, `concat`, `pad_start`, `substring`, `replace`, `counter`, `math_op`, `round`, `if_else`, `repeat`) to `renderSlotInput(...)`.
    - Dropping a variable onto any input slot binds `{{varName}}` and renders an embedded orange variable chip (`[ ● varName [×] ]`) with an `×` clear button that removes the variable and restores the standard input field.
    - Updated `.wb-variables-ribbon` (`ตัวแปรในโปรเจกต์:`) to render directly from `localVariables` (with live `runtimeVarMap` values) and connected `commitLocalVariables` (`onVariablesChange`) in `App.tsx` so newly created or updated variables (e.g. `duration = 7`) appear immediately in the project variables ribbon and persist to the project document right away.
- **Verification**:
  - 97 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.

## 2026-10-16 — Print Dialog Redesign: Copies, Serial Count, Serial Preview Navigator, and Label DPI

- **Issues Addressed**:
  - Users requested a redesigned Print Dialog with:
    1. **Copies (`จำนวน Copy`)**: Number of copies per label (`1–100`).
    2. **Serial (`จำนวน Serial`)**: Number of sequential serial labels (`1–500`).
    3. **Removal of the `Label DPI` selector**: Use the label's own configured DPI (`doc.settings.dpi`) directly without a redundant dropdown in the Print Dialog.
    4. **Interactive Serial Preview Navigator**: When a serial count is specified, allow previewing each serial label before printing with First (`|◀`), Previous (`◀`), direct label number input (`ฉลากใบที่ [ N ] / M`), Next (`▶`), and Last (`▶|`) navigation controls.
- **Fixes**:
  - **Formula & Variable Serial Engine (`src/formulaEngine.ts`, `src/variables.ts`)**:
    - Updated `counter` block evaluation to offset by `__serial_index__` (`start + serialOffset * step`) and `change_variable` (`incrementValueString`) to increment both numeric values and alphanumeric strings with trailing digits (e.g. `A50001` -> `A50002`) across serial iterations `0..serialIndex`.
    - Updated `resolveVariableValuesWithFormulas`, `variableValues`, and `resolveDocument` to accept `serialIndex = 0`.
  - **Print Dialog & Multi-Serial Print Engine (`src/PrintDialog.tsx`, `src/printing.ts`, `src/print-dialog.css`)**:
    - Added `.print-quantity-bar` with stepper and numeric inputs for `จำนวน Copy` (`1–100`) and `จำนวน Serial` (`1–500`).
    - Added `.print-serial-nav` below the label proof with First (`ChevronsLeft`), Previous (`ChevronLeft`), direct jump-to-label number input (`serial-jump-input`), Next (`ChevronRight`), and Last (`ChevronsRight`) controls.
    - Removed the `Label DPI` dropdown and used `doc.settings?.dpi ?? defaultDocumentSettings.dpi` directly for preflight and read-only display (`55 × 35 mm · 203 DPI`).
    - Updated `openSystemPrint` to accept `string | string[]` so all `serialCount` vector label SVGs are rendered and repeated `copies` times each (`serialCount * copies` total sheets).
- **Verification**:
  - 98 TypeScript unit tests passing (`npm test`).
  - Production build passing (`npm run build`).
  - 25 Go unit tests passing (`go test ./...`).
  - Cross-compilation verified for `windows/amd64`, `darwin/arm64`, and `darwin/amd64`.



