import { MarkdownView, Notice, Plugin } from "obsidian";

import { UrlDisplaySettingTab } from './settings'
import { UrlDisplayView } from "./views"
import { markdownProcessor } from "./processor"
import type { UrlDisplaySettings } from "./types"
import { VIEW_TYPE, DEFAULT_SETTINGS } from "./constants"

export default class UrlDisplayPlugin extends Plugin {
	public settings: UrlDisplaySettings;
	public processor: markdownProcessor;

	public override async onload() {
		console.clear();
		console.log("loading obsidian-url-display plugin v" + this.manifest.version);

		await this.loadSettings();
		this.addSettingTab(new UrlDisplaySettingTab(this.app, this));
		this.addRibbonIcon('external-link', 'Open or close url display', (evt: MouseEvent) => {
			this.openOrClosePane();
		});
		this.registerView(VIEW_TYPE, (leaf) => new UrlDisplayView(leaf, this, this.processor));
		this.registerCommand();
		this.registerListener();
		
		this.processor = new markdownProcessor(this);
	}

	public async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	public async saveSettings() {
		await this.saveData(this.settings);
	}

	private registerCommand() {
		this.addCommand({
			id: 'open-or-close-pane',
			name: 'Open or close pane',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						this.openOrClosePane();
					}
					return true;
				}
			}
		});

		this.addCommand({
			id: 'refresh-list',
			name: 'Refresh list',
			checkCallback: (checking: boolean) => {
				const currentMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				const urlDisplayView = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
				if (currentMarkdownView && urlDisplayView) {
					if (!checking) {
						this.processor.process(currentMarkdownView);
					}
					return true;
				}
			}
		});
	}

	private registerListener() {
		this.registerEvent(this.app.workspace.on('file-open', (file) => {
			const currentMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			this.processor.process(currentMarkdownView);
		}));
	}
	

	private openOrClosePane() {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length) {
			this.app.workspace.detachLeavesOfType(VIEW_TYPE);
		} else {
			this.activateView();
		}
	}

	private async activateView () {
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			let leaf = this.app.workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE, active: true });
			this.app.workspace.revealLeaf(leaf);
		} else {
			new Notice("Move focus into markdown 😉");
		}
	}

	public override onunload() {
		console.log("unloading obsidian-url-display plugin v" + this.manifest.version);
	}
}
