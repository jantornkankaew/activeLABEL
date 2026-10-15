#!/usr/bin/env bash
set -euo pipefail

if [[ -d "/workspace" ]]; then
  default_cache="/workspace/.cache"
  default_rtk_dir="/workspace/toolchains/rtk/bin"
  default_go_dir="/workspace/toolchains/go/bin"
else
  default_cache="$(pwd)/.cache"
  default_rtk_dir="/opt/homebrew/bin"
  default_go_dir="/usr/local/go/bin"
fi

export PATH="${RTK_INSTALL_DIR:-$default_rtk_dir}:${default_go_dir}:$PATH"
export XDG_DATA_HOME="${XDG_DATA_HOME:-$default_cache/rtk/data}"
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$default_cache/rtk/config}"
export GOCACHE="${GOCACHE:-$default_cache/go-build}"
export GOPATH="${GOPATH:-$default_cache/go}"

mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME" "$GOCACHE" "$GOPATH" 2>/dev/null || true

if ! command -v rtk >/dev/null; then
  echo 'RTK is missing. Run bash scripts/install-rtk.sh first.' >&2
  exit 127
fi
exec rtk "$@"
