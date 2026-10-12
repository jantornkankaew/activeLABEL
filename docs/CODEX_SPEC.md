# Product specification — LabelCraft

Version 1.1 · 12 October 2026 · Working name. This specification supersedes earlier PDF-first/no-agent recommendations. Prototype status is documented separately.

## Product intent

One professional web workspace combines an object designer and conversational AI. It produces dependable barcode labels and print jobs. The editor/core are open source; a separately operated AI service can sell credits. Users may design manually without purchasing AI.

Primary screen: document header with save/undo/redo/print; left object tools/layers/inspector; centre physical label canvas with rulers and zoom; right conversational assistant, selected-object context and proposed changes. Support panel collapse and keyboard use. Thai and English UI/content; fonts with licensed embedding. Responsive usability; desktop is first production target.

## Accepted technology and printing requirements

TypeScript frontend (current React/Vite); Go API and background Print Engine; PostgreSQL for hosted accounts/credit ledger; SQLite for hardened local print ledger. Print bridge runs on Windows and macOS Intel/Apple Silicon. Keep low overhead: no bundled Chromium desktop UI, no idle polling loops, bounded queues/jobs/images, measure idle and burst RSS/CPU.

The user explicitly accepts installing a small bridge. They want direct printing via driver, without a PDF step. On macOS when vendor drivers are unavailable, use tested raw-command adapters. LAN comes first; USB is model-specific follow-up. Driver/platform adapters must be distinct from the canonical document and transport adapters.

## Source of truth and commands

Versioned label document: stable IDs, revision, physical dimensions, typed objects, licensed asset/font references, field bindings, rules and printer/media profiles. Coordinates mm; screen zoom separate. Barcode module width and quiet zone explicit in mm/device dots. Numeric rounding cannot stretch or compress barcode modules unpredictably. History revisions stay monotonic even when undo returns old contents.

Commands: add/update/remove/group/align/distribute/bind/resize/reorder; validated atomic transactions. Shared schemas generated for TS and Go; server revalidates authenticated AI commands and bills only a validated deliverable. Client rejects stale revision responses; never overwrite edits made while AI runs. Every UI path and AI tool uses the same rules.

Text shaping must preserve Thai combining marks; fit/wrap/clipping are explicit properties. Barcode payloads are strings. Prevent leading-zero loss. Keep QR square and respect EAN/Code128 symbology rules. Images and effects do not turn the whole document into opaque pixels.

## Capability milestones beyond a basic editor

| Capability | User outcome | Implementation / proof |
|---|---|---|
| Constraint-aware layout | “Make it 40×25, keep barcode readable” gives a feasible layout or explains why not | Solver/layout rules enforce margins, fixed sizes and module constraints; AI chooses/proposes among valid layouts |
| Preflight | Detect overflow, invalid data, clipped quiet zones, insufficient image resolution and font issues before print | Deterministic report by object/row; does not claim ISO grade without verifier |
| Data intelligence | Upload Excel/CSV, map fields, find duplicates/missing IDs and preview variants | Local parsing by default, confirmed mapping, validate each row; show exact errors |
| Batch composition | One template becomes 500 variable labels with bounded resource use | Streaming/chunking, cancellation, previews and row-level validation |
| Reference reconstruction | Image/PDF example becomes editable text/shape/barcode layout | Ask for physical size, OCR confidence, confirm decoded payload; never manufacture a barcode from guessed pixels |
| Template memory | Reuse company layout, fonts and constraints on future work | User-approved preferences and versioned templates, scoped to organization |
| Conversational editing | Edit selection, apply a style, compare alternatives, revert a turn | Typed command proposals, preview/diff, atomic history |
| Calibration profiles | Consistent output for actual printer/media | Stored per-model/DPI/media offsets, test pattern and measured compatibility matrix |
| Hybrid Print Engine | Crisp text/shapes/barcodes with images where needed | Vector/text platform rendering or native printer primitives; bitmap only for unsupported regions/fallback |
| Controlled operations | Teams share/approve templates and audit reprints | Account/organization authorization, immutable approved versions, audit and explicit reprint reasons |
| Integration API | ERP/stock apps generate jobs from a template plus data | Scoped API keys, validation, idempotency, status without false physical-success claims |

These are target capabilities, not all available in v0.1. Start with edit/preflight/data/printing correctness. Do not add artistic AI QR, arbitrary code execution, RFID, 3D packaging optimization or regulated-label certification without separate scope and IP/standards review.

## AI orchestration

Use existing model APIs, not own model training initially. Benchmark a lower-cost model and a stronger fallback on the same 100+ prompts. Tools include getSelection, proposeCommands, inspectConstraints, suggestFieldMapping and previewVariant. No direct tool bypasses authorization, validation or print confirmation.

Send minimal context and selected IDs. External document/CSV text is data, never privileged instruction. Do not upload all business data by default. Model/refusal/timeout/malformed-output failures leave the document intact. Limit tokens, iterations and retries. Store cost/latency/outcome metadata without logging provider keys or sensitive sample rows.

Single safe edit can update canvas immediately with undo. Complex changes show diff/proposal. Printing initiated through chat presents printer, dimensions, copies and data range for review before transport; ambiguous destructive data edits ask targeted questions.

## Printing pipeline

Canonical document → resolve data/font/constraints → preflight → display list → platform/printer renderer → transport/spooler → observed status.

- Driver renderer: text/glyph paths, fills/strokes and images in physical coordinates. Windows native GDI/other suitable API; macOS native print route where queue exists. Validate custom media, printable offsets and DPI; do not assume driver paper is correct.
- Raw renderer: use supported ZPL/TSPL/CPCL primitives where verified; unsupported text/font/effects rendered as device-resolution bitmap. No arbitrary AI raw command accepted.
- Fallback renderer: monochrome raster at target DPI, crisp barcode edges, no fit-to-page. Not the default replacement for the entire vector architecture.
- Transports: configured Windows queue, macOS queue or allowlisted LAN endpoint. USB after targeted-device tests. No arbitrary destination passed by browser.
- Local connection: trusted HTTPS/WSS/pairing; explicit Origin/Host checks, token scope, replay-resistant jobs, allowlisted app origins, no public bind by default. Test Chromium private-network protections and Safari compatibility; current HTTP demo is insufficient for hosted production.
- Durable jobs: SQLite transactions, lock against multiple instances, persisted intent and outcome; at-most-once automatic submission per job ID. A lost acknowledgement gives uncertain status; user chooses explicit reprint with new ID. No false exactly-once physical-print promise.

Status vocabulary: validated, queued, rendering, sending, spooled/transport_sent, printer_reported (if supported), confirmed_by_user, failed_before_send, unknown_after_send. Browser dialogue closure is not physical success. Paper-out/offline/cover-open monitoring is device-specific.

## Open source and paid credits

Core/editor Apache-2.0; preserve dependency licenses, NOTICE and font licenses. Hosted AI/billing operation can be separate. Open source allows competitors to fork and sell; do not add a no-commercial clause and still call it open source. Trademark and third-party patent clearance remains separate.

Credits: quote → reserve → execute → validated/persisted deliverable → settle; failed/no deliverable → release. Server is authority. Append-only ledger and unique provider/payment/job IDs. Verify signed payment webhooks, reconcile duplicates/out-of-order events; never credit based on browser redirect. Provider failures cannot double-charge. Undo after delivered generation does not inherently refund inference. Show policy in UI.

Prices are hypotheses until actual cost p50/p95 and willingness-to-pay tests. No unlimited AI free tier or hidden cost escalation. Manual edit/export/reprint unchanged labels does not consume AI credits.

## Definition of done

Unit/integration tests for transactions, stale commands, undo revisions, invalid inputs, per-tenant access, webhook/job duplicates and crash recovery. TS build; Go tests/race checks; cross-compile Win amd64, Mac amd64/arm64. Browser QA desktop/mobile plus real native OS tests and hardware matrix. Reference-image fidelity review when the user's exact selected image is available.

Physical proof: known mm patterns, 203/300 DPI where devices available, barcode payload equality on scan, Thai shaping and long text, margins/rotation, repeated batch and offline recovery. Automated decode success is not ISO print-grade certification. Record printer model/firmware/driver/OS/browser/media/transport and known limitations.

Target estimates: 1–2 week technical proof; 10–12 weeks limited MVP with ready testers; expanded advanced platform and hybrid adapters may need more time. Do not treat estimates as commitments before hardware and selected image/UX are validated.

## Measurement preferences and future reference labels

Display/input units are mm, cm, inch or dot with explicit DPI. Canonical document/command geometry remains mm; changing view units must not change revisions or physical printing. Alignment positions selected objects relative to label bounds with six validated undoable actions; exact centre placement bypasses grid snap. Future chat image reconstruction follows [REFERENCE_LABELS.md](REFERENCE_LABELS.md), including physical-size confirmation, decoded barcode payload review and editable preview/apply; it is not currently implemented.

## Freeform lines, properties and sharing

Lines may have optional local-mm `line: {startX,startY,endX,endY}` points inside their canonical x/y/width/height bounds. Missing points retain legacy horizontal rendering. Dragging the tail keeps the start fixed, supports any direction including vertical and reversed lines, snaps the tail optionally and commits once on release. Reject invalid or zero-length endpoints; preserve vector points through import/export, moves, alignment, proposals, print and undo.

Double-click an object to select it and reveal its inspector; stop the event before document handling. Double-click blank paper to open Document property. The former Label size heading uses Document property.

The header Share action shares an editable snapshot via a validated `#share=` URL or JSON file. A receiver imports a new document identity, clears the fragment and never automatically prints. Keep links bounded (16,000 characters); large documents use file sharing. Native share/clipboard availability must have explicit fallbacks. This is snapshot sharing, not synchronized collaboration or cloud account storage.

## Barcode reference magnification

Barcode size uses `barcodeScale` (percentage) with canonical mm dimensions computed from a deterministic type/payload profile, not independent dot width/height editing. EAN/UPC retail references use X=.330 mm, type-specific quiet zones and nominal bar heights, with 80–200% uniform magnification. Generic profiles are explicitly application references; their 10–1000% editor range is not a certification interval. Code39/I2of5 keep verified 3:1 wide:narrow encoding; QR has 4X quiet zones, DataMatrix1X, PDF4172X and 3X rows. Code93 includes mandatory C/K checks without modifying stored payload.

Mouse barcode resizing changes the same percentage and bypasses dimension grid snap; position snap remains available. Type/payload changes preserve magnification (clamp to the new supported retail interval if needed), recompute dimensions and reject overflow rather than truncate bars. Legacy imports fit corrected proportional geometry within existing bounds without silently changing payload; undersized retail remains editable but cannot print until corrected. Print preflight checks selected DPI, small modules and quiet-zone intersections; explicit DPI adjustment commits through normal undo. See BARCODE_STANDARDS_RESEARCH.md for sources and evidence limitations. Certification still requires the current application specification and physical verification.

## Integer barcode gestures and concise printer controls

Mouse barcode resizing rounds to whole 1% steps during preview and commit, retains symbology magnification limits and preserves aspect ratio/payload/undo. A small editor-only percentage label shows the current resize; exports and printing remove it. Barcode properties show Data, Type, Ratio, DPI, presets and physical dimensions; verbose module/profile diagnostics remain in collapsed Details. Changing Barcode DPI immediately performs the validated device-width adjustment; precise device-aligned percentage can be fractional even though mouse steps are whole percentages.

Print has one destination selector: Chrome's actual system chooser, or authenticated configured Local Print Bridge profiles after Load printers. Standard browser APIs cannot enumerate/preselect native OS queues in the webpage. Print DPI or bridge destination changes adjust barcode geometry immediately and atomically; errors retain the previous choice/geometry. No automatic job submission occurs. Tokens remain in memory and changing URL/token clears stale destinations.

Barcode layout overflow is an editable draft state: keep uniform encoded geometry and payload, allow corner resizing and movement beyond all four paper edges, and tint only the outside portion red in both editors. Allocate scroll space for outside handles. Manual and AI transactions, undo and JSON/shared jobs accept this state; other objects retain bounds validation. Printing must reject overflow before opening the native dialog or submitting a bridge job. Red overlays and handles are editor-only.

Selecting an object then pressing Delete opens a shared native modal confirmation in both editors, naming the object with Cancel focused, Escape cancellation and undo support. Ignore Delete in editable fields, other dialogs, locked objects, active drags and pending AI proposals. Inspector delete buttons use the same confirmation and revision-checked remove transaction. Pointer-down on blank paper or canvas surrounding it clears selection; object and resize targets retain selection. Matrix overflow tint must include inherited SVG fills as well as explicit strokes, while preserving white quiet zones and original export colours.

Share encodes new links as `#share=z1.` followed by zlib-compressed UTF-8 JSON in unpadded base64url. Continue accepting legacy JSON links. Enforce 16,000-character URLs and a 200,000-byte expanded-document limit with incremental decoding before JSON/schema validation. Memoize per document, preserve all geometry/payload/font metadata and keep fresh receiver identities and no-print behavior. Short lookup codes require actual durable hosted storage; do not claim a cloud short-link service from compressed snapshots.

When no authenticated bridge profiles are loaded, Print must not show an empty or placeholder printer dropdown. Show a system-printer card and the explicit “เปิดรายชื่อเครื่องพิมพ์ใน Chrome” action instead. Only show the in-app printer selector after real configured bridge profiles load; token/URL changes clear it. Include Destination → See more… and system-dialog/OS-queue troubleshooting in the preview and prepared print page. Chrome API invocation is verifiable without claiming installed printer discovery or physical output.
