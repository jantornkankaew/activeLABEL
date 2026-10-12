#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist-connectors
for task_target in windows/amd64 windows/arm64 darwin/amd64 darwin/arm64; do
  task_os="${task_target%/*}"
  task_arch="${task_target#*/}"
  task_dir="dist-connectors/labelcraft-$task_os-$task_arch"
  mkdir -p "$task_dir"
  task_binary=labelcraft-connector
  if [[ "$task_os" == windows ]]; then task_binary+=.exe; fi
  GOOS="$task_os" GOARCH="$task_arch" go build -trimpath -o "$task_dir/$task_binary" ./cmd/api
  cp scripts/resolve-codex.mjs "$task_dir/"
  cp docs/AI_CONNECTIONS.md "$task_dir/"
  if [[ "$task_os" == windows ]]; then
    cp scripts/start-chatgpt-windows.ps1 "$task_dir/"
  else
    cp scripts/start-chatgpt-macos.sh "$task_dir/"
  fi
done
python3 - <<'PY'
from pathlib import Path
import hashlib, zipfile
root = Path('dist-connectors')
for directory in sorted(root.iterdir()):
    if not directory.is_dir(): continue
    archive = root / (directory.name + '.zip')
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as output:
        for file in sorted(directory.iterdir()):
            output.write(file, str(file.relative_to(root)))
    print(hashlib.sha256(archive.read_bytes()).hexdigest(), archive.name)
PY
