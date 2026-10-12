# LabelCraft — Designer + Chat + Print Engine

Runnable technical prototype and implementation brief, 12 October 2026. Product name is a working name; trademark availability is not checked.

## What exists now

- React/TypeScript SVG object editor: text, barcode, image, line and box; millimetre geometry; inspector; selection/dragging; lock; undo/redo; local autosave; JSON import/export and vector SVG export.
- Shared transaction engine for manual edits and chat operations. EAN checksum, geometry, unique IDs, unsupported operations and stale revision checks.
- Offline command demonstration clearly labelled as **not an AI model**. Settings can select a configured API provider or the personal ChatGPT/Codex connector. No model key or OAuth token in the browser. No paid credits enabled.
- Go print bridge: allowlisted printers, loopback binding, token and Origin checks, persistent job IDs, Windows GDI bitmap driver adapter and ZPL LAN bitmap adapter. No PDF required by the application.

This is not the finished commercial application. Desktop/mobile AI Settings, both provider paths with mocks, HTTPS/auth guards, and undo were checked in Chromium on Linux. Live-model calls, native Windows/macOS execution, hosted-page private-network access, hardware printing and performance measurements remain unverified. Driver vector output, macOS native driver printing, TSPL/CPCL, USB, batch data, billing and advanced capabilities remain implementation tasks in `docs/CODEX_SPEC.md`.

## RTK CLI for Codex

RTK 0.51.0 condenses development command output. In the Linux x86_64 cloud environment, install with `bash scripts/install-rtk.sh` (pinned official release with SHA-256 verification), then run commands through `bash scripts/rtk-exec.sh`, for example `bash scripts/rtk-exec.sh npm test` or `bash scripts/rtk-exec.sh git status`. Run `bash scripts/rtk-exec.sh gain` for measured savings and `bash scripts/rtk-exec.sh proxy <command>` for full output.

The project Codex hook is in `.codex/hooks.json`. Supported Codex CLI runtimes need RTK on PATH and a restart; approve the project hook if Codex asks. The wrapper is the explicit fallback for cloud runtimes without hooks. Tracking/configuration stay outside the repository under `/workspace/.cache/rtk`. RTK does not provide AI credentials or printing capabilities.

## Frontend development

Requires Node.js compatible with Vite 6 and npm.

```sh
npm ci
npm test
npm run dev
```

Open the Vite URL. Chat starts in offline command-demo mode. Supported examples: `ย้ายราคาไปขวาบน`, `จัดบาร์โค้ดตรงกลาง`, `เพิ่ม Lot`, `สร้างฉลาก`. Unsupported prompts explain the limitation. Objects and their contents are editable through the inspector.

## Open in Chrome with GitHub Pages

In this repository's GitHub **Settings → Pages**, choose **GitHub Actions** as the build source. The `Deploy LabelCraft to GitHub Pages` workflow builds and publishes the frontend on pushes to `main`; it can also be run manually from **Actions**. After a successful deployment, open `https://jantornkankaew.github.io/labelcraft/` in Chrome.

Pages hosts the static editor. Settings offers API or ChatGPT through the personal Codex connector. Follow [AI connection setup for Windows/macOS](docs/AI_CONNECTIONS.md) for the local HTTPS connector, official login and pairing. API mode needs a configured HTTPS API with the Pages origin explicitly allowed. The Go print bridge still runs on the printer's computer; its secure hosted-page connection remains separate. Do not put provider keys into GitHub Pages or browser code.

## Go service development

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
| `LABELCRAFT_CODEX_ENABLED` | Set to `1` to enable the personal ChatGPT connector; requires loopback binding |
| `LABELCRAFT_CODEX_BIN` | Optional native Codex executable path; Windows uses `codex.exe`, not the npm `.cmd` shim |
| `API_TLS_CERT`, `API_TLS_KEY` | Trusted localhost/server TLS certificate and private key paths; required for hosted HTTPS origins in ChatGPT mode |

In Settings, select API, enter the Go API HTTPS URL and API access token, then verify and apply. Do **not** enter the provider key into the browser. Service use/cost belongs to the operator's provider account; this prototype has no credit billing. For ChatGPT mode use the local launcher documented above. `go run ./cmd/api -local` generates a pairing token in the user configuration directory; it also requires trusted TLS for its default allowed hosted origin and an official Codex login. No LLM API key is required for Codex mode, and failed Codex requests do not fall back to API.

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
