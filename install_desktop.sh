#!/usr/bin/env bash
set -e
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
DESKTOP_FILE="$APP_DIR/ouvidoria-ecosystem.desktop"
TARGET="$HOME/.local/share/applications/ouvidoria-ecosystem.desktop"
ICON_SRC="$APP_DIR/icons/ouvidoria_icon.png"
ICON_DEST="$HOME/.local/share/icons/ouvidoria-ecosystem.png"

mkdir -p "$(dirname "$TARGET")"
cp "$DESKTOP_FILE" "$TARGET"

# copy icon if available
if [ -f "$ICON_SRC" ]; then
  mkdir -p "$(dirname "$ICON_DEST")"
  cp "$ICON_SRC" "$ICON_DEST"
fi

# ensure permissions
chmod 644 "$TARGET"
chmod 644 "$ICON_DEST" >/dev/null 2>&1 || true

# Update desktop file to point to user icon
if [ -f "$TARGET" ]; then
  sed -i "/^Icon=/d" "$TARGET" || true
  echo "Icon=$ICON_DEST" >> "$TARGET"
fi

# Update desktop database if available
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
fi

echo "Instalado: $TARGET"
echo "Abra o menu de aplicativos e procure por 'Ouvidoria Ecosystem' ou execute: gtk-launch ouvidoria-ecosystem" 
