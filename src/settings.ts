import { App, PluginSettingTab, Setting } from "obsidian";

import UrlDisplayPlugin from "./main";

export class UrlDisplaySettingTab extends PluginSettingTab {
	private plugin: UrlDisplayPlugin;

	constructor(app: App, plugin: UrlDisplayPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	public override display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Deduplicate URLs')
			.setDesc('If enabled, 2 same URLs in the note will only display once.')
			.addToggle(value => value
				.setValue(this.plugin.settings.deduplicateUrls)
				.onChange((value) => {
					this.plugin.settings.deduplicateUrls = value;
					this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Ignore file property')
			.setDesc('If enabled, URLs in file properties will not be extracted and displayed.')
			.addToggle(value => value
				.setValue(this.plugin.settings.ignoreFileProperty)
				.onChange((value) => {
					this.plugin.settings.ignoreFileProperty = value;
					this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Use alias')
			.setDesc('If enabled, the text in brackets ([]) will be used to display, otherwise the website title from URL metadata will be used.')
			.addToggle(value => value
				.setValue(this.plugin.settings.useAlias)
				.onChange((value) => {
					this.plugin.settings.useAlias = value;
					this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Show favicon')
			.setDesc('If enabled, the pane will show the favicons of URLs.')
			.addToggle(value => value
				.setValue(this.plugin.settings.showFavicon)
				.onChange((value) => {
					this.plugin.settings.showFavicon = value;
					this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Cache mode')
			.setDesc('Choose cache mode for saving favicons. This will only take effect when show favicon is set to true.')
			.addDropdown((value) => {
				value
					.addOptions({ diskCache: 'disk cache', memoryCache: 'memory cache' })
					.setValue(this.plugin.settings.cacheMode)
					.onChange((value) => {
						this.plugin.settings.cacheMode = value;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Notice mode')
			.setDesc('You can customize the type of notifications when URL parsing finishes.')
			.addDropdown((value) => {
				value
					.addOptions({ none: 'none', successful: 'successful', failed: 'failed', both: 'both' })
					.setValue(this.plugin.settings.noticeMode)
					.onChange((value) => {
						this.plugin.settings.noticeMode = value;
						this.plugin.saveSettings();
					});
			});
	}
}
