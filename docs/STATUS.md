# Implementation status

12 October 2026 — v0.1 technical prototype.

Implemented: object editor, SVG display/export, JSON save/load, atomic commands, monotonic undo revisions, labelled offline chat, configurable Go AI adapter, auth/origin guards, PNG print payload, persistent single-process job IDs, ZPL LAN adapter, Windows GDI bitmap adapter.

Not implemented: native vector driver engine, macOS native driver adapter, TSPL/CPCL/USB, secure production hosted-to-loopback connection, cross-process job lock/SQLite, credit billing/account/tenant system, Excel/CSV batch, intelligent solver, image reconstruction, team approvals. No model/hardware credentials used and no real print sent.

Priority for next Codex session:
1. Generate shared JSON Schema and server-side command/document validation; current Go API is a prototype adapter and client is final validator.
2. Make barcode module widths/quiet zones explicit and validated for printer DPI. Current SVG dimensions can scale bars fractionally; do not claim print-quality certification.
3. Add secure pairing/HTTPS and SQLite job state; verify Windows persistence/restart behaviour. Do not deploy local HTTP bridge as production.
4. Native vector/glyph/bitmap hybrid adapters; validate platform font shaping and custom media with actual printers.
5. Data binding/batch and preflight, then AI evaluation/credit ledger.

Design reference: original generated primary-screen concept. Later user selected a specific edit target that was unavailable at its supplied path; no substitute image was used for that requested edit. Await exact attachment before image redesign.

Verification: frontend type/build and core tests; Go tests and target cross-compiles reported in final run. Browser QA unavailable because managed Sites environment has no control-browser capability; no replacement preview infrastructure was started. Target OS and hardware behaviour remain unverified.
