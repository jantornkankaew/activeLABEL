# Implementation status

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
