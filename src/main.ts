import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import type { URLDisplaySettings } from './settings';
import { DEFAULT_SETTINGS, URLDisplaySettingTab } from './settings'


export default class URLDisplay extends Plugin {
	settings: URLDisplaySettings;

	async onload() {
		// console.clear();
		// console.log(”onload“);

		await this.loadSettings();

		this.addRibbonIcon('external-link', 'Open URL Panel', (evt: MouseEvent) => {
			new Notice("Open URL Panel");
			this.openView();
		});

		this.addCommand({
			id: 'open-url-panel',
			name: 'Open URL Panel',
			callback: () => {
				this.openView();
			}
		});

		this.addSettingTab(new URLDisplaySettingTab(this.app, this));

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async openView() {

	}
}
