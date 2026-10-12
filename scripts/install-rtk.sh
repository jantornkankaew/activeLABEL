#!/usr/bin/env bash
set -euo pipefail
if [[ "$(uname -s)/$(uname -m)" != Linux/x86_64 ]]; then
  echo 'This installer targets Linux x86_64 cloud environments.' >&2
  exit 1
fi
task_rtk_dir="${RTK_INSTALL_DIR:-/workspace/toolchains/rtk/bin}"
if [[ -x "$task_rtk_dir/rtk" ]] && [[ "$("$task_rtk_dir/rtk" --version)" == 'rtk 0.51.0' ]]; then
  exit 0
fi
task_rtk_tmp="$(mktemp -d)"
trap 'rm -rf "$task_rtk_tmp"' EXIT
curl -fsSL --retry 2 https://github.com/rtk-ai/rtk/releases/download/v0.51.0/rtk-x86_64-unknown-linux-musl.tar.gz -o "$task_rtk_tmp/rtk.tar.gz"
printf '%s  %s\n' 5028d3b19a8f0990d30fec9fbb07e32782bc5698e618fb1861aad8a9ccba4eb5 "$task_rtk_tmp/rtk.tar.gz" | sha256sum -c -
python3 - "$task_rtk_tmp" <<'PY'
import pathlib, sys, tarfile
root = pathlib.Path(sys.argv[1])
with tarfile.open(root / 'rtk.tar.gz') as archive:
    archive.extractall(root, filter='data')
PY
mkdir -p "$task_rtk_dir"
install -m 755 "$task_rtk_tmp/rtk" "$task_rtk_dir/rtk"
"$task_rtk_dir/rtk" --version
