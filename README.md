# LabelCraft — Designer + Chat + Print Engine

Runnable technical prototype and implementation brief, 12 October 2026. Product name is a working name; trademark availability is not checked.

## What exists now

- React/TypeScript SVG object editor: text, barcode, image, line and box; millimetre geometry; inspector; selection/dragging; lock; undo/redo; local autosave; JSON import/export and vector SVG export.
- Shared transaction engine for manual edits and chat operations. EAN checksum, geometry, unique IDs, unsupported operations and stale revision checks.
- Offline command demonstration clearly labelled as **not an AI model** and a configured API provider for the standalone website. A separate Apps SDK widget and official Go MCP server run LabelCraft inside ChatGPT, using ChatGPT's conversation model without Codex installation or a model API key. No paid credits enabled.
- Real Chrome system print dialog for installed Windows/macOS queues; exact-mm vector pages with bundled fonts, no app-generated PDF. Optional Go print bridge: allowlisted printers, loopback binding, token and Origin checks, persistent job IDs, Windows GDI bitmap driver adapter and ZPL LAN bitmap adapter. No PDF required by the application.

This is not the finished commercial application. The ChatGPT widget, MCP contract and shared command validation have local tests; actual hosting and registration in a user's ChatGPT account are separate prerequisites. Prior API/local-Codex prototype checks passed; the local Codex connector is a legacy optional route and is no longer offered in the website's Settings. Live-model calls, hardware printing and performance measurements remain unverified. Bridge vector output, native macOS bridge printing, raw TSPL/CPCL/USB, batch data, billing and advanced capabilities remain implementation tasks in `docs/CODEX_SPEC.md`.

## LabelCraft inside ChatGPT

Use [the ChatGPT app setup guide](docs/CHATGPT_APP.md). The widget opens inside ChatGPT and supports manual editing, validated AI proposals, explicit Apply/Reject, Undo/Redo and JSON/SVG export. It uses the existing TypeScript engine on both the UI and Go MCP server. It does not extract ChatGPT tokens or call an inference API.

[Deploy the MCP server to Render using GitHub](https://render.com/deploy?repo=https://github.com/jantornkankaew/labelcraft), then add the actual HTTPS `/mcp` endpoint in ChatGPT's developer app settings. GitHub Pages cannot run this server. Account eligibility, hosting and app registration remain user steps; preparing the code is not a completed connection to ChatGPT.

## RTK CLI for Codex

RTK 0.51.0 condenses development command output. In the Linux x86_64 cloud environment, install with `bash scripts/install-rtk.sh` (pinned official release with SHA-256 verification), then run commands through `bash scripts/rtk-exec.sh`, for example `bash scripts/rtk-exec.sh npm test` or `bash scripts/rtk-exec.sh git status`. Run `bash scripts/rtk-exec.sh gain` for measured savings and `bash scripts/rtk-exec.sh proxy <command>` for full output.

The project Codex hook is in `.codex/hooks.json`. Supported Codex CLI runtimes need RTK on PATH and a restart; approve the project hook if Codex asks. The wrapper is the explicit fallback for cloud runtimes without hooks. Tracking/configuration stay outside the repository under `/workspace/.cache/rtk`. RTK does not provide AI credentials or printing capabilities.

## Editor controls

Double-click the label or use the size button to set dimensions. **Fit to page** maximizes and centres the label in the available workspace; screen zoom never changes physical print size. Toggle **Grid** and **Snap** independently and choose spacing in millimetres. Drag objects to position them; drag a selected barcode's corner to scale both axes proportionally. Text width and height are computed from bundled fonts. There are nine font choices: Noto Sans, Noto Serif, Noto Sans Mono, Noto Sans Thai, Noto Serif Thai, Open Sans, DejaVu Sans, DejaVu Serif and DejaVu Sans Mono.

Barcode type/data changes apply automatically when valid. Invalid drafts remain editable with an inline error and an explicit checksum correction or sample-data button; existing payloads are never replaced silently. Pending invalid drafts block printing and survive switching selection in the open editor. Available types: Code 128, Code 39, Code 93, EAN-13, EAN-8, UPC-A, UPC-E, Interleaved 2 of 5, QR, Data Matrix and PDF417. Barcode aspect ratio is locked to its encoded geometry. Rulers track the pointer in millimetres on both axes.

The **File** menu provides New label, Open file, Save as JSON and Export SVG. Open labels appear as stable tabs below the header. The standalone website saves jobs in this browser; the embedded app uses ChatGPT widget state. Download JSON as a portable backup. Clearing browser data or losing widget state can remove saved jobs; this is not shared cloud account storage.

For actual local printing, use **Print → Local printer → Print now**, then select the installed queue in Chrome. See [Windows/macOS local printing](docs/LOCAL_PRINTING.md) for driver/media setup and the optional HTTPS bridge. In ChatGPT, Print opens the standalone website with the current label and print preview.

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

Pages hosts the standalone static editor with offline demo or API mode. ChatGPT integration uses the separate [embedded app](docs/CHATGPT_APP.md), not a local Codex connector or an OAuth login on GitHub Pages. API mode needs a configured HTTPS API with the Pages origin explicitly allowed. The default Chrome system-dialog print route needs an installed OS printer queue; it does not need the bridge. The optional direct print bridge runs on the printer's computer. Do not put provider keys into GitHub Pages or browser code.

## Go service development

Requires Go 1.25+ for the official Go MCP SDK; the API/print bridge still use the standard library.

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

In Settings, select API, enter the Go API HTTPS URL and API access token, then verify and apply. Do **not** enter the provider key into the browser. Service use/cost belongs to the operator's provider account; this prototype has no credit billing. For ChatGPT use the embedded app guide above. The older `go run ./cmd/api -local` route remains in source for compatibility; it is not the current ChatGPT app setup.

The default system-dialog route works through installed OS queues on Windows/macOS. Configure the exact model's driver, custom paper size, 100% scale and no margins/headers/footers before printing a test label. Actual physical output remains hardware-dependent.

For the optional direct bridge, copy `printers.example.json` to ignored `printers.json` and remove unused/sample destinations. Hosted HTTPS origins require a trusted localhost certificate; launch with `-tls-cert` and `-tls-key`. The bridge checks exact Origin, token and loopback Host. See [the printing guide](docs/LOCAL_PRINTING.md). Never disable browser security or certificate checks. This route uses the existing PNG fallback.
## Printing safety / limitations

- Bridge job records are persisted before transport. An already recorded job ID is never automatically re-sent, including `sending` or unknown states. Reprinting after uncertainty is an explicit user action with a new job ID.
- `transport_sent` means bytes were written; `spooled` means submitted to Windows spooler. Neither proves paper output.
- Run only one bridge instance for a job directory. Durable atomic replacement on Windows and cross-process job locking need hardening before production. For production, move job records to SQLite transactions.
- Raw USB and native macOS bridge driver adapters are not implemented; Chrome can use installed USB/network queues on either OS. macOS can use the included ZPL LAN adapter once tested on its actual printer.
- Printer raster output, module widths, quiet zones, Thai shaping, feed settings and physical size require device tests. Chrome uses the vector SVG page; the optional bridge driver output remains bitmap fallback.

## Next work

Give Codex `docs/CODEX_START_PROMPT.md`, `docs/CODEX_SPEC.md` and this repository. Read `AGENTS.md` before changes. Preserve working prototype behaviour; implement the roadmap in small verified steps. Do not describe unimplemented features as available.

## License

Original source: Apache-2.0. Third-party libraries retain their own licenses and notices; see NOTICE and the lockfile. The chosen public code release does not exempt the product from third-party patents. Review dependency versions, FTO and the product name before commercial release.
