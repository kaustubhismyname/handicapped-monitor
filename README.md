# Handicapped Monitor

A GNOME Shell extension for working around physically damaged monitor edges.

It draws configurable black masks on the left, right, top, and bottom edges of the primary display, reserves that masked area so normal windows avoid it, and lets the top panel be narrowed with an extra margin.

## Features

- Configurable blackout percentages for all four screen edges.
- Top panel resizing so status icons can stay inside the usable area.
- Preferences UI in GNOME Extensions.
- Defaults to a right-side 35% mask and 6% extra panel margin.

## Requirements

- GNOME Shell 50
- `glib-compile-schemas`

## Install

```sh
./install.sh
```

Then log out and log back in if GNOME does not load the extension immediately.

## Configure

Open GNOME Extensions, find **Handicapped Monitor**, and open its preferences.

Available settings:

- Right blackout
- Left blackout
- Top blackout
- Bottom blackout
- Top panel extra margin

## Uninstall

```sh
gnome-extensions disable handicapped-monitor@local
rm -rf ~/.local/share/gnome-shell/extensions/handicapped-monitor@local
```
