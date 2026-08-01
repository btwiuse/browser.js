#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR=""
BASE_PATH="/"
ISOLATION_ORIGIN=""
WISP_URL=""
REQUIRE_CLEAN_GIT=false
EXPECTED_REMOTE=""
PRESERVE=()

usage() {
	cat <<'EOF'
Usage: publish-static-chrome.sh --target-dir DIR [options]

Build the Chrome UI and synchronize its static distribution into DIR.

Options:
  --target-dir DIR        Existing directory to receive the build
  --base-path PATH        Vite base path (default: /)
  --isolation-origin URL  Default isolation origin, or none
  --wisp-url URL          Wisp endpoint used by the built UI
  --preserve PATH         Keep a target-relative path during synchronization
  --require-clean-git     Require TARGET_DIR to be a clean Git checkout
  --expected-remote TEXT  Require the Git origin URL to contain TEXT
  -h, --help              Show this help
EOF
}

while (($#)); do
	case "$1" in
		--target-dir)
			[[ $# -ge 2 ]] || { echo "--target-dir requires a value" >&2; exit 2; }
			TARGET_DIR="$2"
			shift 2
			;;
		--base-path)
			[[ $# -ge 2 ]] || { echo "--base-path requires a value" >&2; exit 2; }
			BASE_PATH="$2"
			shift 2
			;;
		--isolation-origin)
			[[ $# -ge 2 ]] || { echo "--isolation-origin requires a value" >&2; exit 2; }
			ISOLATION_ORIGIN="$2"
			shift 2
			;;
		--wisp-url)
			[[ $# -ge 2 ]] || { echo "--wisp-url requires a value" >&2; exit 2; }
			WISP_URL="$2"
			shift 2
			;;
		--preserve)
			[[ $# -ge 2 ]] || { echo "--preserve requires a value" >&2; exit 2; }
			case "$2" in
				/*|../*|*/../*|..)
					echo "--preserve must be target-relative: $2" >&2
					exit 2
					;;
			esac
			PRESERVE+=("$2")
			shift 2
			;;
		--require-clean-git)
			REQUIRE_CLEAN_GIT=true
			shift
			;;
		--expected-remote)
			[[ $# -ge 2 ]] || { echo "--expected-remote requires a value" >&2; exit 2; }
			EXPECTED_REMOTE="$2"
			shift 2
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			echo "Unknown option: $1" >&2
			usage >&2
			exit 2
			;;
	esac
done

if [[ -z "$TARGET_DIR" ]]; then
	echo "--target-dir is required" >&2
	usage >&2
	exit 2
fi

TARGET_DIR="$(cd -- "$ROOT_DIR" && cd -- "$TARGET_DIR" && pwd)"
if [[ "$REQUIRE_CLEAN_GIT" == true || -n "$EXPECTED_REMOTE" ]]; then
	if [[ ! -d "$TARGET_DIR/.git" && ! -f "$TARGET_DIR/.git" ]]; then
		echo "Target is not a Git checkout: $TARGET_DIR" >&2
		exit 1
	fi

	if [[ -n "$(git -C "$TARGET_DIR" status --porcelain)" ]]; then
		echo "Refusing to overwrite uncommitted changes in $TARGET_DIR" >&2
		exit 1
	fi

	if [[ -n "$EXPECTED_REMOTE" ]]; then
		ORIGIN_URL="$(git -C "$TARGET_DIR" remote get-url origin)"
		if [[ "$ORIGIN_URL" != *"$EXPECTED_REMOTE"* ]]; then
			echo "Refusing to sync to unexpected Git remote: $ORIGIN_URL" >&2
			exit 1
		fi
	fi
fi

if [[ -z "$WISP_URL" ]]; then
	echo "--wisp-url is required" >&2
	exit 2
fi

cd "$ROOT_DIR"
pnpm build
VITE_ISOLATION_ORIGIN="$ISOLATION_ORIGIN" VITE_WISP_URL="$WISP_URL" pnpm build:dreamland
VITE_BASE_PATH="$BASE_PATH" VITE_ISOLATION_ORIGIN="$ISOLATION_ORIGIN" VITE_WISP_URL="$WISP_URL" pnpm build:chrome

RSYNC_ARGS=(-a --delete --exclude=.git)
for path in "${PRESERVE[@]}"; do
	RSYNC_ARGS+=("--exclude=$path")
done
rsync "${RSYNC_ARGS[@]}" "$ROOT_DIR/packages/chrome/dist/" "$TARGET_DIR/"

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
