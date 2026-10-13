# Short share links

The static GitHub Pages app cannot store random short IDs. It now emits smaller lossless `z2` tuple snapshots, preserving old `z1`/JSON links. These still contain document data.

A separate implemented Go service (`cmd/share`, `Dockerfile.share`) creates permanent `/s/<12-character-random-code>` redirects on an operator-owned HTTPS domain. Set `SHARE_PUBLIC_URL` and `SHARE_DATA_DIR` to a writable persistent volume; `PORT` defaults to 8080. Never use an ephemeral deployment filesystem. Set repository variable `VITE_SHARE_SERVICE_URL` to this public HTTPS URL before building Pages. Clicking Create short link explicitly uploads the snapshot; anyone holding the code can read it. Copy/share uses the returned service URL. No third-party shortener receives document data.

Writes accept only the LabelCraft origin and label snapshot destinations, limit request sizes, 60 creations/minute globally and 10,000 stored links. There is no listing or delete API. Back up the mounted directory. Add authenticated per-account quotas before operating at public commercial scale. Random codes are bearer references, not user authentication. A short custom domain further reduces total link length.

Status: service and persistence/security tests implemented; no hosted persistent service or short domain is configured in this environment. Do not claim that production short codes work until it is deployed and the repository variable is set. The deployed UI exposes this state honestly and retains compressed/file sharing.
