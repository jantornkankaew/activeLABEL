# LabelCraft's own local print helper

No QZ Tray, Java, browser extension or manually installed TLS certificate is required for the Chrome route.

1. Extract the downloaded ZIP on the computer used to print.
2. Windows: double-click `labelcraft-printbridge.exe`. Mac: double-click `Start-LabelCraft.command` (choose the Apple Silicon or Intel package for that Mac).
3. The helper opens a local pairing page. Click **เปิด LabelCraft และเชื่อมเครื่องพิมพ์**.
4. If Chrome asks to access this computer/local network, allow the requesting LabelCraft website. The Print dialog then reads the installed queues automatically. Choose a queue and its actual DPI before printing.

Leave the helper process/Terminal window open while using LabelCraft. Close it when finished. The OS must already have the exact-model driver and USB/network queue installed. Test a page using the OS settings first. Windows/macOS may require you to confirm opening this first-party executable; the project does not disable operating-system security controls. No physical print happens while starting, pairing or reading names.

The helper binds only to `127.0.0.1:28171`. The pairing link transfers a random per-run token in the URL fragment to the trusted LabelCraft site; fragments are not sent to the website server. The website clears it and keeps the token only in the current tab's session storage. No secret is included in label shares, exports or logs. Restarting the helper rotates the token, so use its new pairing page. Every API operation requires that token and the allowed origin. Chrome's localhost exception still requires its local-network/loopback permission where enforced; rejecting that permission produces a visible connection error.

Discovery uses Windows `EnumPrintersW` or macOS `/usr/bin/lpstat -p`. Names are the actual installed OS queues, not a list of brand names. DPI is unknown at discovery; the app asks you to select 203/300/600 DPI explicitly. Windows submits a raster image through GDI at the requested physical mm size; macOS submits a one-page PDF with an embedded raster image and exact mm page dimensions through `/usr/bin/lp`. Copies are set once. An accepted queue job does not establish physical paper output. After unknown output, inspect the queue before explicitly printing again; no automatic retry occurs.

Advanced configurations retain `-config`, `-jobs`, `-headless`, `-tls-cert` and `-tls-key`, plus `LABELCRAFT_BRIDGE_TOKEN` and `LABELCRAFT_ALLOWED_ORIGINS`. `-list` lists OS queues without opening a browser or printing. HTTPS loopback remains available for environments requiring it, with a trusted certificate supplied by the administrator. The public site uses the permitted secure-context loopback HTTP route by default; remote HTTP destinations are rejected.
