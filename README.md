# LabelCraft — Designer + Chat + Print Engine

Runnable technical prototype and implementation brief, 12 October 2026. Product name is a working name; trademark availability is not checked.

## What exists now

- React/TypeScript SVG object editor: text, barcode, image, line and box; millimetre geometry; inspector; selection/dragging; lock; undo/redo; local autosave; JSON import/export and vector SVG export.
- Shared transaction engine for manual edits and chat operations. EAN checksum, geometry, unique IDs, unsupported operations and stale revision checks.
- Offline command demonstration clearly labelled as **not an AI model**. Go API adapter for a configured Chat Completions-compatible provider. No model key in the browser. No paid credits enabled.
- Go print bridge: allowlisted printers, loopback binding, token and Origin checks, persistent job IDs, Windows GDI bitmap driver adapter and ZPL LAN bitmap adapter. No PDF required by the application.

This is not the finished commercial application. Browser visual/interaction QA, live-model calls, native Windows/macOS execution, hardware printing and performance measurements have not been verified in this Linux environment. Driver vector output, macOS native driver printing, TSPL/CPCL, USB, batch data, billing and advanced capabilities remain implementation tasks in `docs/CODEX_SPEC.md`.

## Frontend

Requires Node.js compatible with Vite 6 and npm.

```sh
npm ci
npm test
npm run dev
```

Open the Vite URL. Chat starts in offline command-demo mode. Supported examples: `ย้ายราคาไปขวาบน`, `จัดบาร์โค้ดตรงกลาง`, `เพิ่ม Lot`, `สร้างฉลาก`. Unsupported prompts explain the limitation. Objects and their contents are editable through the inspector.

## Go services

Requires Go 1.22+; no third-party Go modules.

```sh
go test ./...
go run ./cmd/api
go run ./cmd/printbridge -config printers.json -jobs bridge-jobs
```

Configure environment variables locally, never commit secrets:

| Variable | Purpose |
|---|---|
| `LABELCRAFT_API_TOKEN` | Random access token, at least 24 characters, for this prototype's single-owner API |
| `LLM_API_KEY` | Model provider key, server-side only |
| `LLM_MODEL` | Available model ID supporting JSON mode; deliberately not hardcoded |
| `LLM_URL` | Optional Chat Completions endpoint; defaults to OpenAI's HTTPS endpoint |
| `LABELCRAFT_BRIDGE_TOKEN` | Separate random local pairing token, at least 24 characters |
| `LABELCRAFT_ALLOWED_ORIGINS` | Comma-separated exact allowed frontend origins, e.g. local Vite origin |
| `API_LISTEN` | Optional API address; default loopback `127.0.0.1:28172` |

In Settings, enter the Go API URL and API access token and enable live mode. Do **not** enter the provider key into the browser. Service use/cost belongs to the operator's provider account; this prototype has no credit billing.

Copy `printers.example.json` to ignored `printers.json`. Remove unused profiles and configure the exact device address/name and DPI. In Print, enter bridge URL and pairing token, connect printers and select a profile. Jobs use a DPI-sized PNG fallback; this is not the final hybrid/vector engine. Configure paper size in the Windows driver before testing. Never use generic sample printer names or IPs as real targets.

A hosted HTTPS frontend needs a properly secured local connection (trusted HTTPS/WSS, pairing and browser private-network compatibility). The current HTTP-loopback service is a development route, not a verified production HTTPS bridge. Do not disable browser security to work around it.

## Printing safety / limitations

- Job records are persisted before transport. An already recorded job ID is never automatically re-sent, including `sending` or unknown states. Reprinting after uncertainty is an explicit user action with a new job ID.
- `transport_sent` means bytes were written; `spooled` means submitted to Windows spooler. Neither proves paper output.
- Run only one bridge instance for a job directory. Durable atomic replacement on Windows and cross-process job locking need hardening before production. For production, move job records to SQLite transactions.
- USB and raw macOS driver adapters are not implemented. macOS can use the included ZPL LAN adapter once tested on its actual printer.
- Printer raster output, module widths, quiet zones, Thai shaping, feed settings and physical size require device tests. SVG output is editable/vector, but driver output in this release is bitmap fallback.

## Next work

Give Codex `docs/CODEX_START_PROMPT.md`, `docs/CODEX_SPEC.md` and this repository. Read `AGENTS.md` before changes. Preserve working prototype behaviour; implement the roadmap in small verified steps. Do not describe unimplemented features as available.

## License

Original source: Apache-2.0. Third-party libraries retain their own licenses and notices; see NOTICE and the lockfile. The chosen public code release does not exempt the product from third-party patents. Review dependency versions, FTO and the product name before commercial release.
