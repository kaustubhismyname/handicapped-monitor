import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const SETTINGS = [
    ['right-mask-percent', 'Right blackout', 'Width percentage to black out from the right edge'],
    ['left-mask-percent', 'Left blackout', 'Width percentage to black out from the left edge'],
    ['top-mask-percent', 'Top blackout', 'Height percentage to black out from the top edge'],
    ['bottom-mask-percent', 'Bottom blackout', 'Height percentage to black out from the bottom edge'],
    ['panel-extra-margin-percent', 'Top panel extra margin', 'Additional width percentage removed from the right side of the top panel'],
];
const NIGHT_LIGHT_SCHEMA = 'org.gnome.settings-daemon.plugins.color';

class HandicappedMonitorPrefsPage extends Adw.PreferencesPage {
    static {
        GObject.registerClass(this);
    }

    constructor(settings) {
        super({
            title: 'Handicapped Monitor',
            icon_name: 'video-display-symbolic',
        });

        this._settings = settings;
        this._nightLightSettings = new Gio.Settings({
            schema_id: NIGHT_LIGHT_SCHEMA,
        });

        this._addMonitorGroup();
        this._addBlackoutGroup();
        this._addNightLightGroup();
    }

    _addMonitorGroup() {
        const group = new Adw.PreferencesGroup({
            title: 'Monitor',
            description: 'Select which display receives the black masks.',
        });
        this.add(group);

        const labels = this._getMonitorLabels();
        const row = new Adw.ComboRow({
            title: 'Affected monitor',
            subtitle: 'Top panel resizing only applies when the selected monitor is primary',
            model: Gtk.StringList.new(labels),
            selected: this._monitorIndexToSelection(this._settings.get_int('selected-monitor')),
        });

        row.connect('notify::selected', () => {
            this._settings.set_int(
                'selected-monitor',
                this._selectionToMonitorIndex(row.selected)
            );
        });

        this._settings.connect('changed::selected-monitor', () => {
            const selected = this._monitorIndexToSelection(
                this._settings.get_int('selected-monitor')
            );
            if (row.selected !== selected)
                row.selected = selected;
        });

        group.add(row);
    }

    _addBlackoutGroup() {
        const group = new Adw.PreferencesGroup({
            title: 'Blackout Areas',
            description: 'Percentages apply to the selected monitor.',
        });
        this.add(group);

        for (const [key, title, subtitle] of SETTINGS) {
            const adjustment = new Gtk.Adjustment({
                lower: 0,
                upper: key === 'panel-extra-margin-percent' ? 50 : 90,
                step_increment: 1,
                page_increment: 5,
            });

            const spin = new Gtk.SpinButton({
                adjustment,
                digits: 1,
                numeric: true,
                valign: Gtk.Align.CENTER,
            });
            spin.set_size_request(96, -1);

            this._settings.bind(
                key,
                spin,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            const row = new Adw.ActionRow({
                title,
                subtitle,
                activatable_widget: spin,
            });
            row.add_suffix(spin);
            group.add(row);
        }
    }

    _addNightLightGroup() {
        const group = new Adw.PreferencesGroup({
            title: 'Night Light',
            description: 'GNOME Night Light is global and affects all monitors, not only the selected monitor.',
        });
        this.add(group);

        const enabled = new Adw.SwitchRow({
            title: 'Enable Night Light',
            subtitle: 'Uses GNOME Settings > Displays > Night Light',
        });
        this._nightLightSettings.bind(
            'night-light-enabled',
            enabled,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        group.add(enabled);

        const adjustment = new Gtk.Adjustment({
            lower: 1000,
            upper: 10000,
            step_increment: 100,
            page_increment: 500,
        });
        const spin = new Gtk.SpinButton({
            adjustment,
            digits: 0,
            numeric: true,
            valign: Gtk.Align.CENTER,
        });
        spin.set_size_request(120, -1);
        spin.set_value(this._nightLightSettings.get_uint('night-light-temperature'));
        spin.connect('value-changed', () => {
            this._nightLightSettings.set_uint(
                'night-light-temperature',
                Math.round(spin.get_value())
            );
        });
        this._nightLightSettings.connect('changed::night-light-temperature', () => {
            const value = this._nightLightSettings.get_uint('night-light-temperature');
            if (spin.get_value() !== value)
                spin.set_value(value);
        });

        const temperature = new Adw.ActionRow({
            title: 'Temperature',
            subtitle: 'Lower values are warmer; higher values are cooler',
            activatable_widget: spin,
        });
        temperature.add_suffix(spin);
        group.add(temperature);
    }

    _getMonitorLabels() {
        const labels = ['Primary monitor'];
        const monitors = this._getSortedMonitors();

        for (let i = 0; i < monitors.length; i++) {
            const monitor = monitors[i];
            const connector = monitor?.get_connector?.();
            const model = monitor?.get_model?.();
            const geometry = monitor?.get_geometry?.();
            const position = geometry ? `${geometry.x},${geometry.y}` : '';
            const details = [connector, model, position].filter(Boolean).join(' ');
            labels.push(details ? `Monitor ${i + 1}: ${details}` : `Monitor ${i + 1}`);
        }

        if (labels.length === 1) {
            for (let i = 0; i < 4; i++)
                labels.push(`Monitor ${i + 1}`);
        }

        return labels;
    }

    _getSortedMonitors() {
        const display = Gdk.Display.get_default();
        const monitors = display?.get_monitors?.();
        const count = monitors?.get_n_items?.() || 0;
        const result = [];

        for (let i = 0; i < count; i++)
            result.push(monitors.get_item(i));

        return result.sort((first, second) => {
            const firstGeometry = first?.get_geometry?.();
            const secondGeometry = second?.get_geometry?.();
            if (!firstGeometry || !secondGeometry)
                return 0;
            if (firstGeometry.x !== secondGeometry.x)
                return firstGeometry.x - secondGeometry.x;

            return firstGeometry.y - secondGeometry.y;
        });
    }

    _monitorIndexToSelection(index) {
        return index < 0 ? 0 : index + 1;
    }

    _selectionToMonitorIndex(selection) {
        return selection === 0 ? -1 : selection - 1;
    }
}

export default class HandicappedMonitorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.add(new HandicappedMonitorPrefsPage(this.getSettings()));
    }
}
