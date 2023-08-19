import { App, PluginSettingTab, Setting } from 'obsidian';
import URLDisplayPlugin from './main';

export class URLDisplaySettingTab extends PluginSettingTab {
    plugin: URLDisplayPlugin;

    constructor(app: App, plugin: URLDisplayPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Use alias')
            .setDesc('***')
            .addToggle(value => value
                .setValue(this.plugin.settings.useAlias)
                .onChange((value) => {
                    this.plugin.settings.useAlias = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Show favicon')
            .setDesc('***')
            .addToggle(value => value
                .setValue(this.plugin.settings.showFavicon)
                .onChange((value) => {
                    this.plugin.settings.showFavicon = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Deduplicate URLs')
            .setDesc('***')
            .addToggle(value => value
                .setValue(this.plugin.settings.DeduplicateURLs)
                .onChange((value) => {
                    this.plugin.settings.DeduplicateURLs = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Cache mode')
            .setDesc('Select cache mode to save for favicon.')
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