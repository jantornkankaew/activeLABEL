#!/usr/bin/env bash
set -euo pipefail
export PATH="${RTK_INSTALL_DIR:-/workspace/toolchains/rtk/bin}:/workspace/toolchains/go/bin:$PATH"
export XDG_DATA_HOME="${XDG_DATA_HOME:-/workspace/.cache/rtk/data}"
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-/workspace/.cache/rtk/config}"
export GOCACHE="${GOCACHE:-/workspace/.cache/go-build}"
export GOPATH="${GOPATH:-/workspace/.cache/go}"
if ! command -v rtk >/dev/null; then
  echo 'RTK is missing. Run bash scripts/install-rtk.sh first.' >&2
  exit 127
fi
exec rtk "$@"
