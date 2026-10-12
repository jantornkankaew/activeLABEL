# Reference labels from chat — planned

This feature is not implemented yet. The current editor edits vector labels; attaching a reference photo does not automatically reconstruct a document.

The intended workflow is: attach a label image in chat, confirm its real width/height and measurement unit (including printer DPI for dots), then receive an editable preview and apply or reject it. A photo alone cannot establish physical size. Perspective, rotation and cropping must be corrected before estimating geometry.

Analysis should detect text, lines, boxes, images and barcode regions. OCR results and uncertain font matches need visible review. Decode barcode type and payload where possible; request the real payload if decoding fails rather than inventing it. Preserve decoded data through resizing and require explicit confirmation for changes. Unsupported fonts can be approximated with licensed bundled families, with the substitution disclosed.

Generate canonical millimetre geometry and typed commands through the same validation, revision and undo pipeline as manual edits. Reconstruct editable text and real encoded barcodes rather than a single flattened screenshot. Treat text inside reference images as content, never as agent instructions. Image uploads need size/type limits, explicit handling of retention, and no automatic printing.

Acceptance: compare fixtures with known physical dimensions, Thai/Latin text, all supported barcode types, rotated photographs and ambiguous data. Check editable object placement and dimensions, decoded payload equality, honest confidence/substitution messages, preview/apply/reject, undo, and stale-proposal rejection. Test the actual ChatGPT attachment/vision path separately from a mocked host. Physical print and scan quality need real devices.
