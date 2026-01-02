#!/bin/bash
set -e

BROWSER="${1:-chrome}"
VERSION="${2:-$(jq -r '.version' package.json)}"

if [[ "$BROWSER" != "chrome" && "$BROWSER" != "firefox" && "$BROWSER" != "all" ]]; then
  echo "Usage: ./build.sh [chrome|firefox|all] [version]"
  echo ""
  echo "  chrome   Build for Chrome (default)"
  echo "  firefox  Build for Firefox"
  echo "  all      Build for both browsers"
  echo "  version  Version number (default: from package.json)"
  echo ""
  echo "Environment: VITE_API_ENDPOINT for production builds"
  exit 1
fi

# Update version if changed
CURRENT_VERSION=$(jq -r '.version' package.json)
if [[ "$VERSION" != "$CURRENT_VERSION" ]]; then
  echo "Updating version: $CURRENT_VERSION → $VERSION"
  jq --arg v "$VERSION" '.version = $v' package.json > tmp && mv tmp package.json
  jq --arg v "$VERSION" '.version = $v' manifest.json > tmp && mv tmp manifest.json
fi

# Build once
echo "Building Enriched HN v$VERSION..."
npm run build

# Package function
package_for() {
  local browser=$1
  local zip_name="enriched-hn-${browser}-v${VERSION}.zip"

  if [[ "$browser" == "firefox" ]]; then
    # Merge base manifest with Firefox overrides
    jq -s '.[0] * .[1] | del(.background.service_worker)' \
      dist/manifest.json manifest.firefox.overrides.json > dist/manifest.tmp
    mv dist/manifest.tmp dist/manifest.json
  fi

  rm -f "$zip_name"
  (cd dist && zip -qr "../$zip_name" .)
  echo "✓ $zip_name"

  # Restore Chrome manifest for next package
  if [[ "$browser" == "firefox" ]]; then
    jq --arg v "$VERSION" '.version = $v' manifest.json > dist/manifest.json
  fi
}

# Package
if [[ "$BROWSER" == "all" ]]; then
  package_for chrome
  package_for firefox
else
  package_for "$BROWSER"
fi
