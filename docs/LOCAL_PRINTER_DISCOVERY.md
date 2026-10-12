# Local OS-printer discovery through QZ Tray

LabelCraft now has an optional real OS-queue route in addition to Chrome printing and the existing Go print bridge. Install and open QZ Tray on the same Windows/macOS computer as Chrome, then open **Print → ค้นหาเครื่องพิมพ์** and permit the LabelCraft website in QZ Tray. The returned queue names appear directly in the **Printer** selector. No printer is inserted from a hardcoded brand list.

## Installation and permission

The Print dialog links directly to the publisher's [QZ Tray 2.3.0 release](https://github.com/qzind/tray/releases/tag/v2.3.0), with separate Windows Intel/AMD, Windows ARM, Mac Apple Silicon and Mac Intel downloads. These assets were verified against the release's actual asset list. Install only on the local computer; a cloud installation cannot expose the user's queues. Keep the exact-model printer driver and OS queue installed first.

QZ's normal certificate and authorization prompts remain enabled. No site-signing certificate is configured, so QZ may ask the user to allow discovery and printing interactively. No signature checks, certificate checks or browser security restrictions are disabled; no signing private key is shipped in browser code. If Chrome asks for local-network access, confirm the requesting LabelCraft origin before allowing it. Installing a helper and permitting the website are required user-machine actions that the cloud agent cannot perform remotely.

## Verified API contract

Primary evidence is the publisher's `qz-tray@2.3.0` JavaScript package and its inline API documentation, obtained from npm (the `qz.io` documentation host was inaccessible from this cloud network).

- [`qz-tray@2.3.0` source archive](https://registry.npmjs.org/qz-tray/-/qz-tray-2.3.0.tgz), `qz-tray.js`: `printers.find()` with no query returns an array of OS printer names. `websocket.connect()` negotiates helper version and authorization.
- Connections are restricted to `wss://localhost` and the four documented secure ports, 8181/8282/8383/8484; no remote host or insecure fallback is accepted.
- `configs.create(name, options)` receives only a name found in the latest discovery. Refresh before sending to catch deleted queues. Host/file destinations and raw commands are never exposed by this application adapter.
- `print(config, [{type:'pixel',format:'image',flavor:'base64',data:png}])` uses the selected OS printer driver. The existing vector document remains authoritative; this adapter is a DPI-sized PNG fallback.
- The publisher explicitly documents that `units` also applies to `density`. With `units:'mm'`, the adapter passes `density = DPI / 25.4` (dots/mm), not the unconverted DPI number. Paper size is the exact document width/height, margins are zero, scaling is disabled, copies are supplied once, and interpolation is nearest-neighbor.
- A resolved print promise reports submission, not observed physical output. Jobs have a unique queue name identifier; pending duplicate submissions are rejected, and failures never cause automatic retries. After uncertain output the UI asks the user to inspect the queue before another explicit print action.

## Verification and limits

TypeScript tests exercise helper-supplied names, strict loopback connection options, physical-size configuration, removed/unknown/disconnected queues, preflight blocking, duplicate-pending rejection and one-attempt failure handling. Chromium uses the **actual official QZ client** against a clearly labelled mock WebSocket transport: version/certificate negotiation, discovery, selected-name serialization, real 60×40 mm PNG rasterization at 300 DPI (709×472 pixels), three copies, denial, empty names, disconnection and mobile layout. A separate run without a helper checks a real connection failure and confirms that no queue is invented. The original authenticated Go-bridge and Chrome routes remain available.

No Windows/macOS host, installed OS queue, real QZ service authorization dialog, hardware printer, label feed, scanner grade or physical output was available in this cloud environment. These tests validate the integration contract, not native hardware compatibility. TSC/Zebra/Honeywell/EPSON/SATO are usable through this route only when their exact model has a functioning driver/queue on that OS. Native verification remains pending until the user installs QZ Tray and returns the discovery result; physical output still requires an explicit user print action.
