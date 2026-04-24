#!/usr/bin/env bash
set -e
TARGET="$HOME/.local/share/applications/ouvidoria-ecosystem.desktop"
if [ -f "$TARGET" ]; then
  rm -f "$TARGET"
  echo "Removido: $TARGET"
else
  echo "Arquivo não encontrado: $TARGET"
fi
