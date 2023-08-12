import { App, Editor, MarkdownView, Modal, Notice, Plugin, WorkspaceLeaf, ItemView } from 'obsidian';

import URLDisplayPlugin from "./main";
import { VIEW_TYPE } from './constants'

export class URLDisplayView extends ItemView {

    singleNoteURL: string[];

	plugin: URLDisplayPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: URLDisplayPlugin) {
		super(leaf);
		this.plugin = plugin;
	}
    
    async updateDisplay() {
		// console.log(this.plugin);

		/* 添加spin视图 */

		// 获取数据
		await this.plugin.extraceActiveNoteURL()
		console.log(this.plugin.activeNoteURL);
		console.log(this.plugin.activeNoteURLObject);

		// 形成视图
		const container = this.containerEl.children[1];
		container.empty();

		// 无URL提示
		if (this.plugin.activeNoteURLObject.length === 0) {
			container.createEl("p", { text: "No legal URLs found on this note 😄" });
		// 有URL显示
		} else {
			container.createEl("p", { text: String(this.plugin.activeNoteURL) });
		}
    }

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "URL Display view";
	}

	async onOpen() {
		this.updateDisplay();
	}

	async onClose() {
		// Nothing to clean up.
	}
}