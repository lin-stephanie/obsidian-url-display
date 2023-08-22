import { App, PluginSettingTab, Setting } from "obsidian";
import URLDisplayPlugin from "./main";

export class URLDisplaySettingTab extends PluginSettingTab {
    private plugin: URLDisplayPlugin;

    constructor(app: App, plugin: URLDisplayPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    public override display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Use alias')
            .setDesc('By default, the website title is used as the display text. If enabled, the external link text in brackets ([]) will be used.')
            .addToggle(value => value
                .setValue(this.plugin.settings.useAlias)
                .onChange((value) => {
                    this.plugin.settings.useAlias = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Show favicon')
            .setDesc('If enabled, the view will not show the favicon, but only the text.')
            .addToggle(value => value
                .setValue(this.plugin.settings.showFavicon)
                .onChange((value) => {
                    this.plugin.settings.showFavicon = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Deduplicate URLs')
            .setDesc('If enabled, the view will display twice if there are 2 same urls in the note.')
            .addToggle(value => value
                .setValue(this.plugin.settings.DeduplicateURLs)
                .onChange((value) => {
                    this.plugin.settings.DeduplicateURLs = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Cache mode')
            .setDesc('Choose cache mode for saving favicons.')
            .addDropdown((value) => {
                value
                    .addOptions({diskCache: 'disk cache', memoryCache: 'memory cache' })
                    .setValue(this.plugin.settings.cacheMode)
                    .onChange((value) => {
                        this.plugin.settings.cacheMode = value;
                        this.plugin.saveSettings();
                    });
            });
    }
}