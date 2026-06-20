import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const EDGE_KEYS = [
    'right-mask-percent',
    'left-mask-percent',
    'top-mask-percent',
    'bottom-mask-percent',
    'panel-extra-margin-percent',
];
const RESET_KEYBINDING = 'reset-shortcut';
const MIN_VISIBLE_FRACTION = 0.10;

export default class HandicappedMonitor extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._settingsChangedIds = EDGE_KEYS.map(key =>
            this._settings.connect(`changed::${key}`, () => this._syncMask()));
        Main.wm.addKeybinding(
            RESET_KEYBINDING,
            this._settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => this._resetSettings()
        );

        this._masks = new Map();
        for (const edge of ['right', 'left', 'top', 'bottom']) {
            const mask = new St.Widget({
                name: `handicappedMonitor${edge[0].toUpperCase()}${edge.slice(1)}Mask`,
                reactive: true,
                style: 'background-color: #000;',
            });

            Main.layoutManager.addChrome(mask, {
                affectsStruts: true,
                trackFullscreen: true,
            });

            this._masks.set(edge, mask);
        }

        this._monitorsChangedId = Main.layoutManager.connect(
            'monitors-changed',
            () => this._syncMask()
        );

        this._syncMask();
    }

    disable() {
        if (this._monitorsChangedId) {
            Main.layoutManager.disconnect(this._monitorsChangedId);
            this._monitorsChangedId = null;
        }

        if (this._settings && this._settingsChangedIds) {
            Main.wm.removeKeybinding(RESET_KEYBINDING);
            for (const id of this._settingsChangedIds)
                this._settings.disconnect(id);
            this._settingsChangedIds = null;
            this._settings = null;
        }

        if (this._masks) {
            for (const mask of this._masks.values()) {
                Main.layoutManager.removeChrome(mask);
                mask.destroy();
            }
            this._masks = null;
        }

        this._restorePanel();
    }

    _syncMask() {
        const monitor = this._getPrimaryMonitor();
        if (!monitor || !this._masks || !this._settings)
            return;

        const maxHorizontalMaskWidth = Math.round(monitor.width * (1 - MIN_VISIBLE_FRACTION));
        const maxVerticalMaskHeight = Math.round(monitor.height * (1 - MIN_VISIBLE_FRACTION));
        const [leftWidth, rightWidth] = this._clampPair(
            this._widthFromPercent('left-mask-percent', monitor),
            this._widthFromPercent('right-mask-percent', monitor),
            maxHorizontalMaskWidth
        );
        const [topHeight, bottomHeight] = this._clampPair(
            this._heightFromPercent('top-mask-percent', monitor),
            this._heightFromPercent('bottom-mask-percent', monitor),
            maxVerticalMaskHeight
        );
        const visibleWidth = Math.max(1, monitor.width - leftWidth - rightWidth);
        const panelExtraMargin = this._widthFromPercent('panel-extra-margin-percent', monitor);
        const panelWidth = Math.max(1, visibleWidth - panelExtraMargin);

        this._setMask('left', monitor.x, monitor.y, leftWidth, monitor.height);
        this._setMask('right', monitor.x + monitor.width - rightWidth, monitor.y, rightWidth, monitor.height);
        this._setMask('top', monitor.x + leftWidth, monitor.y, visibleWidth, topHeight);
        this._setMask('bottom', monitor.x + leftWidth, monitor.y + monitor.height - bottomHeight, visibleWidth, bottomHeight);

        this._resizePanel(monitor, leftWidth, topHeight, panelWidth);
    }

    _setMask(edge, x, y, width, height) {
        const mask = this._masks.get(edge);
        if (!mask)
            return;

        mask.set_position(x, y);
        mask.set_size(Math.max(0, width), Math.max(0, height));
    }

    _widthFromPercent(key, monitor) {
        return Math.round(monitor.width * this._settings.get_double(key) / 100);
    }

    _heightFromPercent(key, monitor) {
        return Math.round(monitor.height * this._settings.get_double(key) / 100);
    }

    _resetSettings() {
        for (const key of EDGE_KEYS)
            this._settings.reset(key);

        this._syncMask();
    }

    _clampPair(first, second, maxTotal) {
        const total = first + second;
        if (total <= maxTotal)
            return [first, second];

        const scale = maxTotal / total;
        return [
            Math.floor(first * scale),
            Math.floor(second * scale),
        ];
    }

    _resizePanel(monitor, leftWidth, topHeight, usableWidth) {
        const panelBox = Main.layoutManager.panelBox;
        const panel = Main.panel;
        const panelHeight = panelBox?.height || panel?.height || 0;

        if (panelBox) {
            panelBox.set_position(monitor.x + leftWidth, monitor.y + topHeight);
            panelBox.set_size(usableWidth, panelHeight);
        }

        if (panel) {
            panel.set_position(0, 0);
            panel.set_size(usableWidth, panelHeight);
        }
    }

    _restorePanel() {
        const monitor = this._getPrimaryMonitor();
        const panelBox = Main.layoutManager.panelBox;
        const panel = Main.panel;
        const panelHeight = panelBox?.height || panel?.height || 0;

        if (monitor && panelBox) {
            panelBox.set_position(monitor.x, monitor.y);
            panelBox.set_size(monitor.width, panelHeight);
        }

        if (monitor && panel) {
            panel.set_position(0, 0);
            panel.set_size(monitor.width, panelHeight);
        }
    }

    _getPrimaryMonitor() {
        return Main.layoutManager.primaryMonitor || Main.layoutManager.monitors?.[0] || null;
    }
}
