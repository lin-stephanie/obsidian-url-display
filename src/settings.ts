import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
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
            .setName('Remove duplicate URLs')
            .setDesc('***')
            .addToggle(value => value
                .setValue(this.plugin.settings.removeDuplicateURLs)
                .onChange((value) => {
                    this.plugin.settings.removeDuplicateURLs = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Use text in bracket')
            .setDesc('***')
            .addToggle(value => value
                .setValue(this.plugin.settings.useTextInBracket)
                .onChange((value) => {
                    this.plugin.settings.useTextInBracket = value;
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
    }
}