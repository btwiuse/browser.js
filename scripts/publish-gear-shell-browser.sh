#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${GEAR_BROWSER_DIR:-"$ROOT_DIR/../gear-browser"}"

exec "$ROOT_DIR/scripts/publish-static-chrome.sh" \
	--target-dir "$TARGET_DIR" \
	--base-path /browser/ \
	--isolation-origin https://greggang.com \
	--wisp-url "${WISP_URL:-wss://browserjs-production.up.railway.app/wisp/}" \
	--preserve README.md \
	--require-clean-git \
	--expected-remote btwiuse/gear-browser \
	"$@"
