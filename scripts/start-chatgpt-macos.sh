#!/usr/bin/env bash
set -euo pipefail
task_launcher_dir="$(cd "$(dirname "$0")" && pwd)"
for task_command in node npm mkcert; do
  command -v "$task_command" >/dev/null || { echo "Missing $task_command. Follow AI_CONNECTIONS.md first." >&2; exit 1; }
done
export LABELCRAFT_CODEX_BIN="$(node "$task_launcher_dir/resolve-codex.mjs" "$(npm root -g)")"
"$LABELCRAFT_CODEX_BIN" --version
# Interactive official login keeps credentials in Codex's own credential store.
"$LABELCRAFT_CODEX_BIN" login
task_cert_dir="$HOME/Library/Application Support/LabelCraft/tls"
mkdir -p "$task_cert_dir"
chmod 700 "$task_cert_dir"
mkcert -install
if [[ ! -f "$task_cert_dir/localhost.pem" || ! -f "$task_cert_dir/localhost-key.pem" ]]; then
  mkcert -cert-file "$task_cert_dir/localhost.pem" -key-file "$task_cert_dir/localhost-key.pem" localhost 127.0.0.1 ::1
fi
chmod 600 "$task_cert_dir/localhost-key.pem"
export API_TLS_CERT="$task_cert_dir/localhost.pem" API_TLS_KEY="$task_cert_dir/localhost-key.pem"
export API_LISTEN="127.0.0.1:28172"
echo 'Connector URL: https://localhost:28172'
exec "$task_launcher_dir/labelcraft-connector" -local
