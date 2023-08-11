import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import type { URLDisplaySettings } from './settings';
import { DEFAULT_SETTINGS, URLDisplaySettingTab } from './settings'
import { URLDisplayView } from './views'
import { VIEW_TYPE } from './constants'


export default class URLDisplayPlugin extends Plugin {

	settings: URLDisplaySettings;

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// 判断视图是否已经打开，true则添加，false则删除
	async iSOpen() {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
			this.app.workspace.detachLeavesOfType(VIEW_TYPE)
		} else {
			// 添加叶子节点到工作区
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: VIEW_TYPE,
				active: true,
			});
			// 显示叶子节点
			this.app.workspace.revealLeaf(
				this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]
			);
		}
	}

	async onload() {
		// console.clear();
		// console.log(”onload“);

		/* 视图 */
		this.registerView(
			VIEW_TYPE,
			(leaf) => new URLDisplayView(leaf)
		);

		/* 功能区 */
		this.addRibbonIcon('external-link', 'Open URL Panel', (evt: MouseEvent) => {
			this.iSOpen();
		});

		/* 命令 */
		this.addCommand({
			id: 'open-url-panel',
			name: 'Open URL Panel',
			callback: () => {
				this.iSOpen();
			}
		});

		/* 事件 */
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('click', evt);
		});

		/* 设置 */
		await this.loadSettings();
		this.addSettingTab(new URLDisplaySettingTab(this.app, this));
	}

	onunload() {
	}

}
