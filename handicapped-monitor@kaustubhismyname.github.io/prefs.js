import Adw from 'gi://Adw';
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
        this._signalIds = [];

        this._addBlackoutGroup();
        this._addNightLightGroup();
    }

    _addBlackoutGroup() {
        const group = new Adw.PreferencesGroup({
            title: 'Blackout Areas',
            description: 'Percentages apply to the primary monitor.',
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
            description: 'GNOME Night Light is global and affects all monitors.',
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
        this._signalIds.push([
            spin,
            spin.connect('value-changed', () => {
                this._nightLightSettings.set_uint(
                    'night-light-temperature',
                    Math.round(spin.get_value())
                );
            }),
        ]);
        this._signalIds.push([
            this._nightLightSettings,
            this._nightLightSettings.connect('changed::night-light-temperature', () => {
                const value = this._nightLightSettings.get_uint('night-light-temperature');
                if (spin.get_value() !== value)
                    spin.set_value(value);
            }),
        ]);

        const temperature = new Adw.ActionRow({
            title: 'Temperature',
            subtitle: 'Lower values are warmer; higher values are cooler',
            activatable_widget: spin,
        });
        temperature.add_suffix(spin);
        group.add(temperature);
    }

    cleanup() {
        for (const [object, id] of this._signalIds)
            object.disconnect(id);

        this._signalIds = [];
    }
}

export default class HandicappedMonitorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new HandicappedMonitorPrefsPage(this.getSettings());
        window.add(page);
        window.connect('close-request', () => {
            page.cleanup();
        });
    }
}
