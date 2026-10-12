# Implementation status

Current ChatGPT direction: Apps SDK widget + official Go MCP server, not a personal Codex connector in the website. The standalone API and demo remain. `docs/CHATGPT_APP.md` provides deployment/registration steps; preparing this repository does not deploy a public MCP endpoint or register the app in a ChatGPT account.

Implemented for the embedded app: vector text/barcode/line/box editing, mm geometry, inspector/layers, manual commands through the existing engine, stateless MCP open/propose tools, server validation using the same compiled TypeScript engine, explicit Apply/Reject, barcode-change confirmation, stale-revision rejection, monotonic Undo/Redo, widget state and JSON/SVG export. Image upload, physical printing, account storage and billing are not implemented in the embedded app.

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
