# Local printing on Windows and macOS

The default **Print → Local printer → Print now** route opens Chrome's real system print dialog. Choose an installed local queue, then click Print in Chrome. LabelCraft does not generate or require a PDF. It prepares a vector SVG page with bundled fonts and the document's millimetre size. The screen's fit-to-page zoom, grid, snap and selection handles are excluded from printing.

## Install and select the actual printer

1. Install the manufacturer driver for the exact model and OS, then add its USB or network queue in Windows Printers & scanners or macOS Printers & Scanners.
2. Use the OS's test-page function first. LabelCraft cannot install a hardware driver or inspect USB devices remotely from GitHub Pages.
3. Configure custom media matching the label (e.g. 50 × 30 mm) in the driver. Thermal printers may also need the correct gap/black-mark mode and calibration.
4. Open LabelCraft's Print preview and choose **Local printer**. Set the number of label pages, then **Print now**.
5. In Chrome, select the installed queue, choose the same media size, **Scale 100%**, **Margins None**, and disable **Headers and footers**. Leave Chrome copies at 1 when the app already created multiple label pages.
6. Check one label's physical size, feed and barcode scan before a batch. Custom `@page` dimensions are requests; the browser/driver can override them. Do not select “Fit to printable area” if it changes the intended physical size.

TSC, Zebra, Honeywell, EPSON and SATO queues can use this system-dialog route when the actual model has a working driver for that OS. This is not a claim that every model supports macOS, or that any of these devices has been tested in this cloud environment. A brand name alone is insufficient to choose ZPL, TSPL, EPL, ESC/POS or a native driver protocol.

Inside ChatGPT, **Print** opens the standalone LabelCraft website with the current label and print preview. The label is passed in the URL fragment, which is not sent to the web server; the website clears the fragment after importing it. You still choose the local queue and confirm printing in Chrome. The ChatGPT sandbox does not directly access local USB printers.

## Optional direct print bridge

Use this only if you need the existing configured Windows driver or ZPL LAN adapter, rather than Chrome's dialog. No arbitrary printer destination or executable printer command is accepted from the browser. The bridge binds to `127.0.0.1:28171`, checks Host and exact Origin, and requires a random 24+ character pairing token. A hosted HTTPS page requires a trusted localhost TLS certificate; never disable browser certificate/security checks.

Configure `printers.json` with only actual queues/profiles. For Windows, `mode: "windows_driver"` and `name` must exactly match the installed queue. The driver must already have the correct label media. For a network device verified to accept ZPL, use `mode: "zpl_tcp"` with its explicitly configured IP/port. Do not infer compatibility from its brand. The native macOS bridge driver adapter remains unimplemented; use Chrome's local queue for macOS, or a verified ZPL network profile.

Build `go build -o labelcraft-printbridge ./cmd/printbridge` (Windows: `.exe`). Set `LABELCRAFT_BRIDGE_TOKEN` locally, never in GitHub or a hosted environment, and `LABELCRAFT_ALLOWED_ORIGINS=https://jantornkankaew.github.io`. Obtain a trusted certificate for localhost/127.0.0.1 through an approved local CA/tool such as mkcert, then run:

```sh
./labelcraft-printbridge -config printers.json -jobs bridge-jobs \
  -tls-cert /path/to/localhost.pem -tls-key /path/to/localhost-key.pem
```

In **Print → Print bridge**, enter `https://localhost:28171` and the pairing token, connect, select the configured printer and print. Chrome may ask permission to access local-network services. This route remains a DPI-sized PNG fallback, not the final native vector driver engine.

`spooled` means submitted to the Windows queue; `transport_sent` means written to the configured network device. Neither proves that paper came out. After timeout or uncertain output, inspect the queue/device before explicitly printing again. No automatic retry occurs. Run only one bridge instance for a job directory; cross-process locking and crash-safe Windows record replacement remain hardening tasks.
