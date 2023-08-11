import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import URLDisplayPlugin from './main';

export interface URLDisplaySettings {
    myBool: boolean;
    mySetting: string;
}

export const DEFAULT_SETTINGS: URLDisplaySettings = {
    myBool: false,
    mySetting: 'default',
}

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
            .setName('Heading')
            .setDesc('Some description')
            .addToggle(value => value
                .setValue(this.plugin.settings.myBool)
                .onChange((value) => {
                    this.plugin.settings.myBool = value;
                    this.plugin.saveSettings();
                })
            );
                
        new Setting(containerEl)
            .setName('Heading')
            .setDesc('Some description')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.mySetting)
                .onChange(async (value) => {
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}