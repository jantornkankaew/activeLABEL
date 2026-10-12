# Instructions for Codex

Read README.md and docs/CODEX_SPEC.md before implementing changes. Keep TypeScript frontend and Go API/print bridge. No .NET and no Electron-sized desktop editor. The bridge is a small background process.

Manual and AI actions must pass the same label command validation and history engine. Never execute AI-generated JavaScript/SQL/raw printer commands. Preserve barcode payload unless the user explicitly requests a change. Use monotonic revisions including undo/redo.

Maintain vector label objects as source of truth. Do not treat screenshot/canvas pixels as physical dimensions. The existing bitmap print route is a fallback, not the finished vector engine.

Keep printer destinations server-configured and allowlisted. Bind bridge to loopback, use explicit origins and pairing, and implement secure hosted-page connectivity. Never open unauthenticated arbitrary printing endpoints. Never auto-retry a job after unknown physical output.

No fake credits, payment success, AI output, printer connection or print success. Demo behaviour must remain visibly labelled. Real services require real configured credentials. Keep secrets out of source, logs, browser bundles and snapshots.

Run `npm test`, `npm run build`, `go test ./...`; cross-compile bridge for windows/amd64, darwin/arm64 and darwin/amd64. Native API behaviour and hardware output still need target-system tests; cross-compilation does not establish compatibility.

Deliver only claims backed by tests. Track remaining work honestly in docs/STATUS.md. Use a local mock transport for automated tests; do not send to a real printer without the user's requested print action.
