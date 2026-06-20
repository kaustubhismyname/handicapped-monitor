#!/usr/bin/env sh
set -eu

UUID="handicapped-monitor@local"
SRC_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/$UUID"
DEST_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

mkdir -p "$(dirname "$DEST_DIR")"
rm -rf "$DEST_DIR"
cp -R "$SRC_DIR" "$DEST_DIR"

glib-compile-schemas "$DEST_DIR/schemas"
gsettings set org.gnome.shell disable-user-extensions false
gnome-extensions enable "$UUID" || true

printf '%s\n' "Installed $UUID."
printf '%s\n' "If it does not appear immediately, log out and log back in."
