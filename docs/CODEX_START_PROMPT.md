# Prompt for Codex

Continue this repository into a production-quality open-source barcode label design platform with optional paid AI credits. Read AGENTS.md, README.md, CODEX_SPEC.md and STATUS.md before changes.

The app must be one integrated Web Designer + Chat workspace. Manual edits and AI edits modify the same typed document and share validation, undo/redo, selection and revisions. AI is allowed to propose layout and data-binding changes, not silently invent business data. Keep editing usable when AI is unavailable.

Use TypeScript for frontend and Go for API/background print bridge. Printing must not depend on opening a PDF. Implement native driver routes plus printer-language adapters according to platform/device capabilities. Preserve text/vector geometry and rasterize only unsupported parts, with a tested bitmap fallback. macOS without driver must have a tested LAN raw-command route. Do not promise all printers.

Keep the existing prototype runnable. Start with the priorities in STATUS.md: strict shared schema validation; full barcode module/quiet-zone validation; secure bridge and durable job ledger; native/hybrid render adapters. Then add data binding, benchmarked AI tools and credits. Do not begin by rewriting the whole UI or billing before validating physical output.

The desired product goes beyond a basic drawing tool: constraint-aware layouts, preflight, data intelligence, reference-image reconstruction, template memory, team approvals, audit and printer calibration. Treat these as milestones; do not present mock implementations as real capability.

Proceed autonomously on code and automated tests. Report blockers involving credentials, missing references or physical hardware accurately. Do not ask for approval for routine reversible implementation choices. Preserve the user's chosen image when an exact edit target is supplied; if unavailable, request the missing attachment instead of substituting a different image.
