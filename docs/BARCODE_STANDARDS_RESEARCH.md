# Barcode sizing research

Research date: 2026-10-12. Scope: physical symbol geometry and proportional resizing in LabelCraft. This is engineering guidance, not a claim of GS1 or ISO print-grade certification.

## Findings and evidence

A barcode has a narrow module width **X**, encoded bar/space multiples, required blank quiet zones, and (for linear symbols) a bar height. A whole-image aspect ratio is not itself a barcode sizing standard. The present `height:10` and common padding produce an encoder image ratio without establishing retail nominal dimensions.

The installed first-party [bwip-js README](https://github.com/metafloor/bwip-js/blob/master/README.md) documents that `scale=1` corresponds to one pixel per narrow module, `height` and `width` inputs are normalized to millimetres, and padding is in points and scales with the image. Its release note also warns that EAN guard descent changes the final image height; the short-bar height must therefore not be inferred from total SVG height. LabelCraft should normalize vector module geometry into physical millimetres and then apply uniform magnification.

### Retail EAN/UPC

The first-party [Zint EAN/UPC implementation](https://github.com/zint/zint/blob/master/backend/upcean.c) explicitly cites ISO/IEC 15420:2009 section 4.3.3 and GS1 General Specifications 21.0.1 section 5.12.3.1 for nominal short-bar heights. Its [output implementation](https://github.com/zint/zint/blob/master/backend/output.c), function `out_quiet_zones`, cites GS1 section 5.2.3.4 for quiet zones.

| Symbol, without supplement | Encoded modules | Quiet left/right | Nominal X | Nominal short bars | Width including quiet zones |
| --- | ---: | --- | ---: | ---: | ---: |
| EAN-13 | 95 | 11X / 7X | 0.330 mm | 22.85 mm | 37.29 mm (113X) |
| EAN-8 | 67 | 7X / 7X | 0.330 mm | 18.23 mm | 26.73 mm (81X) |
| UPC-A | 95 | 9X / 9X | 0.330 mm | 22.85 mm | 37.29 mm (113X) |
| UPC-E | 51 | 9X / 7X | 0.330 mm | 22.85 mm | 22.11 mm (67X) |

The 100% nominal reference and 80–200% retail magnification correspond to X=0.264–0.660 mm. All dimensions, including short bars, guard extensions, HRI text and quiet zones, must scale together. Height truncation cannot be silently described as compliant. EAN-13 nominal overall height is conventionally 25.93 mm, EAN-8 21.31 mm; the actual HRI and guard layout must be constructed and checked, not obtained by forcing these totals around arbitrary encoder options.

**Evidence limitation:** the official current [GS1 General Specifications](https://ref.gs1.org/standards/genspecs/) and GS1 Australia/UK/US PDF hosts returned proxy HTTP 403 in this cloud environment. The exact current application table and nominal total-height typography were not retrieved directly. The nominal X, magnification range and conventional total heights should be checked against the current GS1 retail application table before a certification claim. The bar heights and quiet-zone values above were independently verified in retrieved first-party encoder source with explicit standards references. Zint's output layout may allocate an extra edge column for rendering; use the actual 67-module EAN-8 encoding rather than copying its 68-column display bookkeeping.

### Other symbologies

| Symbol | Geometry guidance | Verified primary implementation |
| --- | --- | --- |
| Ordinary Code 128 | Fixed integer module multiples; 10X horizontal quiet zones. X and height depend on application. Do not relabel ordinary Code 128 as GS1-128. | [Zint output](https://github.com/zint/zint/blob/master/backend/output.c); [BWIPP Code128](https://github.com/bwipp/postscriptbarcode/blob/master/src/code128.ps.src) |
| Code 39 | Two-width symbol. Preserve the selected wide:narrow ratio; narrow and wide bars/spaces are not independent stretch axes. Quiet zones 10X. Recommended bar height at least 5 mm or 15% of encoded width, whichever is greater. | [Zint code.c](https://github.com/zint/zint/blob/master/backend/code.c), comments citing ISO/IEC 16388:2007 section 4.4; [BWIPP Code39](https://github.com/bwipp/postscriptbarcode/blob/master/src/code39.ps.src) |
| Interleaved 2 of 5 | Two-width symbol; BWIPP default bar and space ratios 2.0. Quiet zones 10X. Generic I2of5 is not automatically GS1 ITF-14 and does not acquire bearer bars from its name. | [BWIPP I2of5](https://github.com/bwipp/postscriptbarcode/blob/master/src/interleaved2of5.ps.src); Zint output cites ISO/IEC 16390 section 4.4 |
| Code 93 | Integer module multiples; 10X horizontal quiet zones. AIM guidance recommends minimum height 0.2 inch or 15% of total symbol length. Application-specific constraints still matter. | [Zint code.c](https://github.com/zint/zint/blob/master/backend/code.c), comments citing ANSI/AIM BC5-1995 section 2.6 |
| QR Code | Square modules; blank border 4X on all sides. Uniform scaling. | Zint output cites ISO/IEC 18004:2015 section 9.1; [Denso official sizing guide](https://www.qrcode.com/en/howto/code.html) (host blocked in this environment) |
| Data Matrix ECC200 | Square modules even for rectangular symbol layouts; blank border 1X on all sides. Uniform scaling. | Zint output cites ISO/IEC 16022:2006 section 7.1 |
| PDF417 | Narrow horizontal module X; row height at least 3X; blank border 2X on all sides. Uniform magnification preserves row-height ratio. | [BWIPP PDF417](https://github.com/bwipp/postscriptbarcode/blob/master/src/pdf417.ps.src) defaults `rowmult=3`; [Zint PDF417](https://github.com/zint/zint/blob/master/backend/pdf417.c) cites ISO/IEC 15438:2015 sections 5.8.2/5.8.3 |

Code 39 and generic I2of5 commonly permit a wide:narrow ratio from 2:1 to 3:1; this exact allowable interval was not retrieved from an official standard in this session. A conservative initial implementation can retain the encoder's verified 3:1 actual ratio rather than expose an unverified generalized certification range. BWIPP `renlinear` accepts bar/space ratio values from 0.1 to 5 for rendering; those permissive renderer limits **are not** a standard allowance. Current BWIPP Code39 patterns use wide digit 3, so `barratio=r` yields wide width 2r+1 while narrow stays 1 (default r=1 means 3:1). I2of5 uses wide digit 2 and explicit ratio defaults 2.0, which yield a default 3:1 actual wide:narrow ratio (r+1). Inspect the actual module run widths and test any public ratio setting rather than passing an assumed ratio blindly.

## Recommended implementation

1. Offer **magnification (%)** as the resizing input for barcodes. Keep x/y in the selected document units. Show resulting width, height and X in mm as read-only physical evidence; changing the editor to dots must not switch the barcode to independent dot width/height editing.
2. Build a deterministic nominal symbol per symbology and payload. Use known retail X and short-bar heights; use explicitly labelled application defaults for generic symbols. Compute geometry from actual encoded modules, HRI bounds and type-specific quiet zones. Make white quiet-zone backgrounds explicit so grid/other shapes cannot appear behind the symbol.
3. Mouse corner scaling changes the same magnification factor on both axes. For retail profiles enforce 80–200%; reject an impossible fit with an explanation rather than silently shrink below the lower limit or crop bars. Preserve payload on resize, migration and profile changes.
4. When a type or payload change produces a different module count, recompute nominal geometry and preserve magnification where feasible. Never independently adjust height to keep a previous arbitrary rectangle.
5. Preserve existing documents honestly: migration can derive an old physical magnification and report/reject an incompatible retail size; do not silently replace payload or falsely certify a legacy undersized symbol.
6. Printing remains at actual mm with no fit-to-page. Device dots may be displayed as X×DPI/25.4 diagnostic information; fractional dots indicate raster alignment limitations, not permission to distort the vector symbol. Real scanner/print-grade verification depends on printer, media, contrast, resolution and the selected application profile.

## Validation to accompany the change

Unit tests should verify retail nominal X/width/short-bar height, 80% and 200% bounds, type-specific quiet zones, square 2D modules, PDF417 3X row height, and exact payload preservation. UI tests should switch mm/cm/inch/dot and verify the same magnification and mm geometry; drag-resize and undo should preserve both module ratios and document revisions. Decoder smoke tests are useful but do not establish ISO quality grades or successful physical printing.

## Implemented profile and checks

LabelCraft now uses percentage magnification against deterministic reference geometry. Retail references use the table above, conventional nominal total heights, and the encoder's OCR-B vector HRI. The actual HRI paths were measured in Chromium to ensure they stay within the reference box. UPC-E's outside check digit is repositioned beneath the right quiet-zone region without altering its encoded bars. Code39's trailing intercharacter gap is excluded from the encoded bar span. The actual Code39/I2of5 wide:narrow ratio remains fixed at the verified 3:1; no permissive renderer multiplier is presented as a standards setting.

Generic references use X=.330 mm as an application default, not a universal required module size. Code39 uses max(5 mm,15% encoded width); Code93 uses max(5.08 mm,15% full symbol width); generic Code128/I2of5 use max(10 mm,15% encoded width) as editor defaults. The generic 10–1000% editing range is an application policy, not a standard compliance interval. GS1-specific Code128/ITF14/DataMatrix/QR application profiles and grading are not implied by these generic names.

The installed BWIPP [Code93 encoder](https://github.com/bwipp/postscriptbarcode/blob/master/src/code93.ps.src) defaults `includecheck` to false; its conditional branch emits C and K when enabled. LabelCraft now enables both mandatory Code93 check symbols while leaving stored and human-readable payload unchanged. An independent ZXing-C++ WASM decoder reads the resulting Code93 correctly.

Print preflight rejects legacy retail sizes outside 80–200%, modules smaller than one device dot, and other objects intersecting reserved quiet zones. Outlined boxes and freeform lines are checked by their segments rather than a filled bounding rectangle. Text/image collisions use conservative bounds. Fractional device-dot widths are reported, with explicit ratio-adjustment actions that keep the chosen retail interval and recompute both axes uniformly. The user selects the printer DPI; the browser cannot detect it reliably. No automatic print or silent DPI-based resize occurs.

Verification used 4-pixel/module browser renders and independent ZXing-C++ via `zxing-wasm` 3.1.5, with successful reads of all 11 supported examples. UPC-A is reported by that decoder as the equivalent zero-prefixed GTIN-13, and UPC-E as its equivalent expanded GTIN-13; the editor's original UPC payload is unchanged. This is a decoder smoke check, not testing of damaged symbols, all payloads, physical printers, or ISO/GS1 quality grades.

Scaled generic Code39/Code93 can fall below their absolute recommended bar heights even when proportions remain correct; Print reports that case as application-height guidance. This reinforces why proportional scaling alone cannot claim conformance for every application.
