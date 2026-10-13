# Local printing on Windows and macOS

The default **Print → Print…** route opens Chrome's real system print dialog. Choose an installed local queue, then click Print in Chrome. LabelCraft does not generate or require a PDF. It prepares a vector SVG page with bundled fonts and the document's millimetre size. The screen's fit-to-page zoom, grid, snap and selection handles are excluded from printing.

The compact preview contains the label, dimensions and DPI. Print invokes a same-origin iframe directly: no popup tab or popup permission. Printer selection and copies are configured once in Chrome. Barcode errors remain blocking; help and warnings expand only when needed.

The Chromium source defines [`chrome.printing`](https://github.com/chromium/chromium/blob/main/chrome/common/extensions/api/printing.idl) with `platforms=("chromeos")`. This extension API does not expose printer enumeration to ordinary websites on Windows/macOS.

## Install and select the actual printer

1. Install the manufacturer driver for the exact model and OS, then add its USB or network queue in Windows Printers & scanners or macOS Printers & Scanners.
2. Use the OS's test-page function first. LabelCraft cannot install a hardware driver or inspect USB devices remotely from GitHub Pages.
3. Configure custom media matching the label (e.g. 50 × 30 mm) in the driver. Thermal printers may also need the correct gap/black-mark mode and calibration.
4. Open LabelCraft's Print preview, check the label and DPI, then choose **Print…**.
5. In Chrome, select the installed queue, choose the same media size, **Scale 100%**, **Margins None**, and disable **Headers and footers**. Set the required copies in Chrome; LabelCraft prepares one label page.
6. Check one label's physical size, feed and barcode scan before a batch. Custom `@page` dimensions are requests; the browser/driver can override them. Do not select “Fit to printable area” if it changes the intended physical size.

TSC, Zebra, Honeywell, EPSON and SATO queues can use this system-dialog route when the actual model has a working driver for that OS. This is not a claim that every model supports macOS, or that any of these devices has been tested in this cloud environment. A brand name alone is insufficient to choose ZPL, TSPL, EPL, ESC/POS or a native driver protocol.

Inside ChatGPT, **Print** opens the standalone LabelCraft website with the current label and print preview. The label is passed in the URL fragment, which is not sent to the web server; the website clears the fragment after importing it. You still choose the local queue and confirm printing in Chrome. The ChatGPT sandbox does not directly access local USB printers.

The website cannot enumerate operating-system printer queues through the standard browser printing API. The real queue list appears in Chrome's native print dialog. No local connector is offered or contacted by the website.

## Chrome does not list my printer

Open **Destination / ปลายทาง → See more… / ดูเพิ่มเติม…** in Chrome's print preview; the initial menu may show only recent destinations and Save as PDF. If the installed queue is still absent, choose **Print using system dialog…** to inspect the operating-system printer list.

- Windows 11: **Settings → Bluetooth & devices → Printers & scanners**. Windows 10: **Settings → Devices → Printers & scanners**. Confirm that the exact queue exists, then open its printer properties and print a test page. If no queue exists, install the exact-model manufacturer driver and add its USB or network printer.
- macOS: **System Settings → Printers & Scanners**. Confirm the queue exists; use **Add Printer, Scanner, or Fax…** if necessary, using the exact model's supported driver or AirPrint when the printer supports it. Check printing from another application first.

If OS printing works but Chrome still omits the queue, close and reopen Chrome after adding the printer, then use the system dialog. If OS printing fails, resolve the queue/driver/connection there before using LabelCraft. The cloud workspace cannot inspect or install printers on the user's computer. The Chrome route does not require Local Print Bridge, and listing a printer or opening a dialog does not establish physical output.

## Barcode size and preflight

Select the actual printer DPI (203/300/600) in Barcode properties or Print. Barcode sizing uses reference magnification (%) and keeps both axes, module widths and quiet zones proportional. Changing the DPI selector in Barcode properties or Print immediately applies an undoable uniform adjustment to make X an integer number of device dots; no Apply button is required. It can fail if a barcode is locked or the ratio exceeds its supported limits; document overflow remains editable but blocks printing. Increasing document size or moving the barcode may be necessary, especially for retail symbols at 203 DPI. The toolbar display-unit DPI remains a view preference; Barcode/Print DPI controls perform the explicit size adjustment.

Print blocks legacy retail magnifications outside 80–200%, modules below one device dot and visible foreground ink crossing barcode modules or reserved quiet zones. Transparent enclosing frames are allowed, including frames inset into the white quiet margin when the stroke remains clear of the encoded module area. Reduced quiet-zone spacing gives a non-blocking warning; strokes reaching the modules remain blocking. Lower layers hidden by the barcode’s opaque white background do not cause false overlap errors. It warns about fractional device-dot modules and generic Code39/Code93 bars below recommended height. Generic application references do not replace GS1-specific usage requirements or physical print-quality verification. No automatic resizing or print submission occurs. See [barcode sizing sources and limits](BARCODE_STANDARDS_RESEARCH.md).

## Legacy bridge development

Go bridge source and platform tests remain in the repository. The current website does not expose pairing, printer discovery, downloads or bridge job submission. Historical bridge documentation is for developer use, not a prerequisite for browser printing.
