import { MarkdownView, Notice, Plugin, WorkspaceLeaf } from 'obsidian';

import { URLDisplaySettingTab } from './settings'
import { URLDisplayView } from './views'
import { VIEW_TYPE, EXTERNAL_URL_PATTERN, EXTERNAL_URL_OBJECT_PATTERN, DEFAULT_SETTINGS, URLDisplaySettings, URLObject } from './constants'
import { deduplicateObjectArrByuniId } from "./utils";


export default class URLDisplayPlugin extends Plugin {

	/* 设置 */
	settings: URLDisplaySettings;

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


	/* 视图 */
	// 判断视图是否已经打开，true则添加，false则删除
	/* isOpen = async () => {
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
	} */

	// 不管视图是否打开
	activateView = async () => {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE);
		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]
		);
	}


	/* 功能区 */
	#activeNoteContent: string;
	activeNoteURL: Array<string>;
	activeNoteURLObject: Array<URLObject>;

	extraceActiveNoteURL = async () => {
		console.log("extraceActiveNoteURL");
		this.activeNoteURLObject = [];
		const activeFile = this.app.workspace.getActiveFile();

		if (activeFile && (String(activeFile.extension).toLowerCase() === "md")) {
			// 获取笔记内容
			// const md = await this.app.vault.read(activeFile);
			this.#activeNoteContent = await this.app.vault.cachedRead(activeFile);

			// 获取URL字符串数组
			this.activeNoteURL = this.#activeNoteContent.match(EXTERNAL_URL_PATTERN) || [];

			// 获取URL对象数组
			for (const url of this.activeNoteURL) {
				// console.log(url);
				const unmatch = [...url.matchAll(EXTERNAL_URL_OBJECT_PATTERN)]

				// 处理情况1："https://obsidian.md/"（当不匹配时解构为数组时是一个空数组）
				if (unmatch.length === 0) {
					this.activeNoteURLObject.push({ text: "", link: url });
					continue;
				}

				// 处理情况2："[]()"
				for (const match of url.matchAll(EXTERNAL_URL_OBJECT_PATTERN)) {
					if (match.groups) {
						this.activeNoteURLObject.push({ text: match.groups.text, link: match.groups.link });
					}
				}
			}

			// 去重URL（插件设置）
			if (this.settings.removeDuplicateURLs) {
				this.activeNoteURLObject = deduplicateObjectArrByuniId(this.activeNoteURLObject, "link");
			}
		}
	};

	updateView = async (avtiveLeaf: WorkspaceLeaf | null) => {
		if (avtiveLeaf && avtiveLeaf.getViewState().type == "markdown" && this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
			console.log(avtiveLeaf);
			console.log(this.app.workspace.getLeavesOfType(VIEW_TYPE)[0].view);
			// const urlDisplayView = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0].view
		} 
	}


	async onload() {
		console.clear();
		console.log("loading obsidian-url-display");

		/* 设置 */
		await this.loadSettings();
		this.addSettingTab(new URLDisplaySettingTab(this.app, this));

		/* 命令 */
		this.addCommand({
			id: 'open-url-panel',
			name: 'Open URL Panel',
			callback: () => {
				this.activateView();
			}
		});

		/* 视图 */
		this.registerView(
			VIEW_TYPE,
			(leaf) => new URLDisplayView(leaf, this)
		);

		/* 功能区 */
		this.addRibbonIcon('external-link', 'Open URL Panel', (evt: MouseEvent) => {

			this.app.workspace.iterateAllLeaves((leaf) => {
				console.log(leaf.getViewState().type);
			});

			// 判断是否为.md，true则提取URL，false则不打开视图发出提示
			// const activeFile = this.app.workspace.getActiveFile();
			// if (activeFile && activeFile.extension && (String(activeFile.extension).toLowerCase() === "md")) {
			if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
				this.activateView();
			} else {
				this.app.workspace.detachLeavesOfType(VIEW_TYPE);
				new Notice("It needs to work in active markdown view 😄")
			}
		});
		
		/* 事件 */
		// needed for multi-pane support when users change between them
		this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
			console.log("active-leaf-change");
			this.updateView(leaf);
		}));
	}

	onunload() {
	}

}
