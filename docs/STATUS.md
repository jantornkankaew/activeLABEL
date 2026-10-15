# Implementation status

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
- Verification: 87 TypeScript unit tests passing, production build passing, 25 Go unit tests passing, and 3 cross-compilations passing.






