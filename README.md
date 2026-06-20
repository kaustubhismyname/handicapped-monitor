# Handicapped Monitor

A GNOME Shell extension for working around physically damaged monitor edges.

It draws configurable black masks on the left, right, top, and bottom edges of the primary display, reserves that masked area so normal windows avoid it, and lets the top panel be narrowed with an extra margin.

This is useful when part of a laptop panel or monitor is cracked, discolored, flickering, or otherwise unusable, but the rest of the display still works.

## Features

- Configurable blackout percentages for all four screen edges.
- Top panel resizing so status icons can stay inside the usable area.
- Global GNOME Night Light controls in the preferences window.
- Preferences UI in GNOME Extensions.
- Safety clamp that keeps at least 10% of the display visible.
- Emergency reset shortcut: `Super` + `Shift` + `Backspace`.
- Defaults to no blackout, so emergency reset always restores a fully visible display.

## Compatibility

Tested with:

- GNOME Shell 50
- GNOME Wayland session
- Arch Linux

Expected to work on:

- Linux distributions running GNOME Shell 50
- Wayland or X11 GNOME sessions, although Wayland was the main target

Not currently declared compatible with older GNOME Shell versions. GNOME extensions are version-sensitive, so GNOME 45/46/47/48/49 may need metadata and API testing before use.

## Requirements

Runtime:

- GNOME Shell 50
- GNOME Extensions app or `gnome-extensions` CLI

Build/install tools:

- `glib-compile-schemas`
- `git`, if installing from GitHub

On Arch Linux:

```sh
sudo pacman -S gnome-shell gnome-shell-extensions glib2 git
```

On Fedora:

```sh
sudo dnf install gnome-shell gnome-extensions-app glib2 git
```

On Ubuntu/Debian:

```sh
sudo apt install gnome-shell gnome-shell-extension-prefs libglib2.0-bin git
```

## Install

Clone the repo:

```sh
git clone https://github.com/kaustubhismyname/handicapped-monitor.git
cd handicapped-monitor
```

Install the extension:

```sh
./install.sh
```

If GNOME does not load the extension immediately, log out and log back in.

Then enable it if needed:

```sh
gnome-extensions enable handicapped-monitor@kaustubhismyname.github.io
```

## Manual Install

If you do not want to use `install.sh`:

```sh
UUID=handicapped-monitor@kaustubhismyname.github.io
mkdir -p ~/.local/share/gnome-shell/extensions
cp -R "$UUID" ~/.local/share/gnome-shell/extensions/
glib-compile-schemas ~/.local/share/gnome-shell/extensions/"$UUID"/schemas
gnome-extensions enable "$UUID"
```

Log out and back in if GNOME does not notice the new extension.

## Configure

Open GNOME Extensions, find **Handicapped Monitor**, and open its preferences.

Available settings:

- Right blackout
- Left blackout
- Top blackout
- Bottom blackout
- Top panel extra margin
- Night Light enabled
- Night Light temperature

The default settings are:

- Right blackout: 0%
- Left blackout: 0%
- Top blackout: 0%
- Bottom blackout: 0%
- Top panel extra margin: 0%

Changes should apply live while the extension is enabled.

Night Light note: GNOME Night Light is a global display setting. The controls in this extension affect GNOME Night Light for the session.

## Emergency Reset

If you accidentally make the visible area too small, press:

```text
Super + Shift + Backspace
```

That resets all mask percentages to their defaults.

There is also a hard safety clamp: the extension will always leave at least 10% of the primary display visible horizontally and vertically, even if the configured percentages would cover more.

You can also reset from a terminal:

```sh
SCHEMA=org.gnome.shell.extensions.handicapped-monitor.kaustubhismyname
SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/handicapped-monitor@kaustubhismyname.github.io/schemas"
GSETTINGS_SCHEMA_DIR="$SCHEMA_DIR" \
gsettings reset-recursively "$SCHEMA"
```

## Update

```sh
cd handicapped-monitor
git pull
./install.sh
```

Log out and back in if GNOME keeps using the old extension code.

## Uninstall

```sh
gnome-extensions disable handicapped-monitor@kaustubhismyname.github.io
rm -rf ~/.local/share/gnome-shell/extensions/handicapped-monitor@kaustubhismyname.github.io
```

## Limitations

- Black masks apply to the primary monitor only.
- GNOME Night Light is controlled globally, not per monitor.
- The extension masks and reserves screen regions; it does not repair panel color damage.
- Fullscreen apps may still behave differently depending on how they interact with GNOME Shell.
- GNOME Shell APIs can change between GNOME releases, so compatibility should be tested before adding more Shell versions to `metadata.json`.
