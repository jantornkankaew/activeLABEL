#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
task_output="${1:-dist/downloads}"
mkdir -p "$task_output"
task_staging="$(mktemp -d /tmp/labelcraft-printbridge.XXXXXX)"
trap 'rm -rf "$task_staging"' EXIT
for task_target in windows/amd64 windows/arm64 darwin/amd64 darwin/arm64 linux/amd64 linux/arm64; do
 task_os="${task_target%/*}"; task_arch="${task_target#*/}"
 task_directory="$task_staging/labelcraft-printbridge-$task_os-$task_arch"
 mkdir -p "$task_directory"
 task_binary=labelcraft-printbridge
 if [[ "$task_os" == windows ]]; then task_binary+=.exe; fi
 GOOS="$task_os" GOARCH="$task_arch" go build -trimpath -o "$task_directory/$task_binary" ./cmd/printbridge
 cp docs/NATIVE_PRINT_SETUP.md "$task_directory/README.md"
 if [[ "$task_os" == darwin || "$task_os" == linux ]]; then
  cat > "$task_directory/Start-LabelCraft.command" <<'LAUNCHER'
#!/bin/bash
set -e
cd "$(dirname "$0")"
exec ./labelcraft-printbridge
LAUNCHER
  chmod 755 "$task_directory/Start-LabelCraft.command" "$task_directory/$task_binary"
 fi
done
python3 - "$task_staging" "$task_output" <<'PY'
from pathlib import Path
import hashlib,sys,zipfile
root,output=Path(sys.argv[1]),Path(sys.argv[2])
for directory in sorted(root.iterdir()):
 archive=output/(directory.name+'.zip')
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as target:
  for file in sorted(directory.iterdir()): target.write(file,str(file.relative_to(root)))
 print(hashlib.sha256(archive.read_bytes()).hexdigest(),archive.name)
PY
