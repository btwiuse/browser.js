#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${BROWSER_GEAR_DIR:-"$ROOT_DIR/../browser.gear.sh"}"
DIST_DIR="$ROOT_DIR/packages/chrome/dist"
WISP_URL="wss://browserjs-production.up.railway.app/wisp/"

if [[ ! -d "$TARGET_DIR/.git" ]]; then
	echo "Browser.gear.sh checkout not found: $TARGET_DIR" >&2
	exit 1
fi

ORIGIN_URL="$(git -C "$TARGET_DIR" remote get-url origin)"
if [[ "$ORIGIN_URL" != *"btwiuse/browser.gear.sh"* ]]; then
	echo "Refusing to sync to unexpected Git remote: $ORIGIN_URL" >&2
	exit 1
fi

if [[ -n "$(git -C "$TARGET_DIR" status --porcelain)" ]]; then
	echo "Refusing to overwrite uncommitted changes in $TARGET_DIR" >&2
	exit 1
fi

cd "$ROOT_DIR"
pnpm build
VITE_ISOLATION_ORIGIN=none VITE_WISP_URL="$WISP_URL" pnpm build:dreamland
VITE_ISOLATION_ORIGIN=none VITE_WISP_URL="$WISP_URL" pnpm build:chrome

rsync -a --delete --exclude='.git' "$DIST_DIR/" "$TARGET_DIR/"

node --input-type=module --eval '
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(process.argv[1], "utf8"));
if (
  manifest.display !== "standalone" ||
  manifest.theme_color !== "#000000" ||
  JSON.stringify(manifest.display_override) !==
    JSON.stringify(["window-controls-overlay", "standalone"])
) {
  throw new Error("The synced manifest is missing the expected PWA display modes.");
}
' "$TARGET_DIR/manifest.json"

echo "Synced Chrome UI to $TARGET_DIR"
echo "Review, commit, and push the changes from that repository when ready."
