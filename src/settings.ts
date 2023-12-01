import { App, PluginSettingTab, Setting } from "obsidian";

import UrlDisplayPlugin from "./main";
import { t } from "./lang/helper";

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
			.setName(t('Deduplicate URLs'))
			.setDesc(t('Deduplicate URLs Desc'))
			.addToggle(value => value
				.setValue(this.plugin.settings.deduplicateUrls)
				.onChange((value) => {
					this.plugin.settings.deduplicateUrls = value;
					this.plugin.saveSettings();
					this.plugin.app.workspace.trigger("file-open");
				})
			);

		new Setting(containerEl)
			.setName(t('Ignore file property'))
			.setDesc(t('Ignore file property Desc'))
			.addToggle(value => value
				.setValue(this.plugin.settings.ignoreFileProperty)
				.onChange((value) => {
					this.plugin.settings.ignoreFileProperty = value;
					this.plugin.saveSettings();
					this.plugin.app.workspace.trigger("file-open");
				})
			);

		new Setting(containerEl)
			.setName(t('Use alias'))
			.setDesc(t('Use alias Desc'))
			.addToggle(value => value
				.setValue(this.plugin.settings.useAlias)
				.onChange((value) => {
					this.plugin.settings.useAlias = value;
					this.plugin.saveSettings();
					this.plugin.app.workspace.trigger("file-open");
				})
			);

		new Setting(containerEl)
			.setName(t('Show favicon'))
			.setDesc(t('Show favicon Desc'))
			.addToggle(value => value
				.setValue(this.plugin.settings.showFavicon)
				.onChange((value) => {
					this.plugin.settings.showFavicon = value;
					this.plugin.saveSettings();
					this.plugin.app.workspace.trigger("file-open");
				})
			);

		new Setting(containerEl)
			.setName(t('Show indicator icon'))
			.setDesc(t('Show indicator icon Desc'))
			.addToggle(value => value
				.setValue(this.plugin.settings.showIndicatorIcon)
				.onChange((value) => {
					this.plugin.settings.showIndicatorIcon = value;
					this.plugin.saveSettings();
					this.plugin.app.workspace.trigger("file-open");
				})
			);
		
		new Setting(containerEl)
		.setName(t('Hover link preview'))
		.setDesc(t('Hover link preview Desc'))
		.addToggle(value => value
			.setValue(this.plugin.settings.hoverLinkPreview)
			.onChange((value) => {
				this.plugin.settings.hoverLinkPreview = value;
				this.plugin.saveSettings();
				this.plugin.app.workspace.trigger("file-open");
			})
		);
		
		new Setting(containerEl)
		.setName(t('Copy format'))
		.setDesc(t('Copy format Desc'))
		.addDropdown((value) => {
			value
				.addOptions({ justLink: t('link'), inlineLink: t('[alias/title](link)') })
				.setValue(this.plugin.settings.copyFormat)
				.onChange((value) => {
					this.plugin.settings.copyFormat = value;
					this.plugin.saveSettings();
				});
		});

		new Setting(containerEl)
			.setName(t('Cache mode'))
			.setDesc(t('Cache mode Desc'))
			.addDropdown((value) => {
				value
					.addOptions({ diskCache: t('disk cache'), memoryCache: t('memory cache') })
					.setValue(this.plugin.settings.cacheMode)
					.onChange((value) => {
						this.plugin.settings.cacheMode = value;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t('Notice type'))
			.setDesc(t('Notice type Desc'))
			.addDropdown((value) => {
				value
					.addOptions({ none: t('none'), successful: t('successful'), failed: t('failed'), both: t('both') })
					.setValue(this.plugin.settings.noticeMode)
					.onChange((value) => {
						this.plugin.settings.noticeMode = value;
						this.plugin.saveSettings();
					});
			});
	}
}
