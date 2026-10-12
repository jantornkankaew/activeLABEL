# LabelCraft native local-printer discovery

The current implementation uses the project's own small Go helper. QZ Tray and its client dependency have been removed. No Java, Chrome extension, shared cloud queue database or manually installed TLS root certificate is required for the tested Chrome route.

## Native discovery and output

- Windows: `EnumPrintersW` with LOCAL and CONNECTIONS flags and level 4 reads installed queues. Validate the returned buffer, name pointers, count and UTF-16 bounds before accepting names. IDs are stable hashes of the OS mode/name, not a brand list. Microsoft API reference: https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinters
- macOS: `/usr/bin/lpstat -p`, with a fixed locale, bounded output and a five-second deadline, returns CUPS queue names. Empty installed lists remain empty. CUPS manual: https://www.cups.org/doc/man-lpstat.html
- Discovery does not invent a DPI. A native queue has `dpi:0`; the user explicitly chooses the actual 203/300/600 DPI. Existing configured profiles retain their known DPI behavior.
- Refresh the native allowlist on both list requests and immediately before job submission. The client sends only an allowlisted ID and validated mm/DPI/copies/PNG fields; no printer names, raw commands or arbitrary destinations are supplied by a browser job.
- Windows GDI prints the raster image at mm dimensions using the driver's actual device caps; driver media must be configured for the label. macOS creates a one-page PDF with the raster image embedded at exact physical dimensions, then submits it to the selected OS queue through `/usr/bin/lp` with custom media, disabled scaling, zero margins and copies supplied once. No shell interpolation is used. The PDF is temporary, mode 0600, and deleted after submission.

## Local pairing and browser security

On start, the helper opens a private local pairing page using an unguessable per-run URL. The page links to the fixed LabelCraft website with the random pairing token in a URL fragment. It has no-referrer/no-store headers and disallows framing or scripts. The token is never logged or placed in the query string. The website clears the fragment and stores the connection only in the current tab's session storage; label files and share links do not contain credentials.

The API binds only to `127.0.0.1:28171`, checks Host against loopback, requires the random token and exact allowed origins, and permits the relevant private-network preflight only for those origins. Remote HTTP endpoints are rejected by the client. Chrome permits potentially trustworthy loopback HTTP targets from an HTTPS page when its applicable local-network/loopback permission is granted; this does not permit plaintext remote printer endpoints or waive browser permission checks. Optional trusted localhost TLS is retained for environments requiring it.

Primary browser references:
- Potentially trustworthy loopback URLs: https://w3c.github.io/webappsec-secure-contexts/#is-url-trustworthy
- Mixed-content request rules: https://w3c.github.io/webappsec-mixed-content/#should-block-fetch
- Chrome local-network access: https://developer.chrome.com/blog/local-network-access

## Delivery and verification

The Pages build generates first-party ZIPs for Windows amd64/arm64 and macOS amd64/arm64. Mac archives preserve executable launcher permissions. No native program is automatically downloaded, installed or started by the website. See NATIVE_PRINT_SETUP.md for user-machine steps.

Local verification includes Go discovery-name/CUPS parsing tests, exact PDF page geometry/xref checks, manager and HTTP authorization tests, TypeScript pairing/legacy editor tests, both frontend builds and four native cross-compiles. Chromium 154 executes the actual Go HTTP API from a page with the public HTTPS origin (production files served under that origin for the test), with normal local-network permission behavior enabled: grant permits authenticated discovery; denial fails without invented queues. This cloud run uses an explicitly labelled configured test queue, because it has no Windows/macOS printer. It checks automatic pairing, fragment clearing, explicit queue selection, unknown-DPI input, PNG/copies, no automatic print, session reuse, credential exclusion from shares, available ZIPs, mobile layout and unauthenticated rejection. The Linux driver cannot send the fixture to hardware; submission reports unknown/failed rather than a fake print success.

CI additionally executes the actual discovery API and `-list` on Windows/macOS runners without sending any print job. Installed CI queues can be empty. Native driver output and hardware/media/scanner quality remain unverified until exercised on a user's exact OS/driver/printer. TSC, Zebra, Honeywell, EPSON and SATO names are discovered only if actual queues exist; a brand does not guarantee that every model has a macOS driver. No physical print is automatically retried after uncertain output.
