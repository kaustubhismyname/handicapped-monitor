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

        const group = new Adw.PreferencesGroup({
            title: 'Blackout Areas',
            description: 'Percentages apply to the primary display.',
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
}

export default class HandicappedMonitorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.add(new HandicappedMonitorPrefsPage(this.getSettings()));
    }
}
