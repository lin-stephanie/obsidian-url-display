import { MarkdownView, Notice, Plugin, WorkspaceLeaf } from 'obsidian';

import { VIEW_TYPE, EXTERNAL_URL_PATTERN, EXTERNAL_URL_OBJECT_PATTERN, DEFAULT_SETTINGS } from './constants'
import type { URLDisplaySettings, URLExtract, URLParse } from './constants'
import { URLDisplaySettingTab } from './settings'
import { URLDisplayView } from './views'
import { deduplicateObjectArrByuniId } from "./utils";
import { parsers } from "./parser";


export default class URLDisplayPlugin extends Plugin {
	settings: URLDisplaySettings;
	view: URLDisplayView;
	activeNoteContent: string;
	activeNoteURL: string[];
	activeNoteURLExtract: URLExtract[];
	activeNoteURLParse: URLParse[];


	/* 设置 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


	/* 视图 */
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

	updateView = (avtiveLeaf: WorkspaceLeaf | null): void => {
		/* if (avtiveLeaf) {
			console.log(avtiveLeaf.getViewState().type);
		} */

		if (avtiveLeaf && this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
			// console.log(this.app.workspace.getLeavesOfType(VIEW_TYPE)[0].view);
			this.view.updateDisplay();
		}
		// 当激活页不是md时，控制是否要关闭视图
		/* if (avtiveLeaf && avtiveLeaf.getViewState().type !== "markdown" && avtiveLeaf.getViewState().type !== "url-display" && this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
			this.app.workspace.detachLeavesOfType(VIEW_TYPE);
			new Notice("It needs to work in active markdown view 😄");
		} */
	}


	/* 处理 */
	extraceActiveNoteURL = async () :Promise<void> => {
		this.activeNoteURLExtract = [];
		const activeFile = this.app.workspace.getActiveFile();

		if (activeFile && (String(activeFile.extension).toLowerCase() === "md")) {
			// 获取笔记内容
			// const md = await this.app.vault.read(activeFile);
			this.activeNoteContent = await this.app.vault.cachedRead(activeFile);

			// 获取URL字符串数组
			this.activeNoteURL = this.activeNoteContent.match(EXTERNAL_URL_PATTERN) || [];

			// 获取URL对象数组
			for (const url of this.activeNoteURL) {
				// console.log(url);
				const unmatch = [...url.matchAll(EXTERNAL_URL_OBJECT_PATTERN)]

				// 处理情况1："https://obsidian.md/"（当不匹配时unmatch是一个空数组）
				if (unmatch.length === 0) {
					this.activeNoteURLExtract.push({ text: "", link: url });
					continue;
				}

				// 处理情况2："[]()"
				for (const match of url.matchAll(EXTERNAL_URL_OBJECT_PATTERN)) {
					if (match.groups) {
						this.activeNoteURLExtract.push({ text: match.groups.text, link: match.groups.link });
					}
				}
			}

			// 去重URL（插件设置）
			if (this.settings.removeDuplicateURLs) {
				this.activeNoteURLExtract = deduplicateObjectArrByuniId(this.activeNoteURLExtract, "link");
			}
		}
	}

	parseActiveNoteURL = async(URLExtract: URLExtract[]): Promise<void> => {
		// 确定解析器
		const parser = parsers["microlink"];
		this.activeNoteURLParse = [];

		// 获取元数据
		for (const extractObject of URLExtract){
			const parseObject = {...extractObject} as URLParse;
			try {
				console.log('parseURL');
				const data = await parser.parse(extractObject.link);
				parseObject.title = data.title.replace(/"/g, '\\"');
				parseObject.logo = data.logo;
				parseObject.description = data.description.replace(/"/g, '\\"');
				this.activeNoteURLParse.push(parseObject)
			} catch (error) {
				console.log('error', error);
				new Notice(`Failed to fetch data`);
			}
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
			(leaf) => (this.view = new URLDisplayView(leaf, this)),
		);

		/* 功能区 */
		this.addRibbonIcon('external-link', 'Open URL Panel', (evt: MouseEvent) => {

			/* this.app.workspace.iterateAllLeaves((leaf) => {
				console.log(leaf.getViewState().type);
			}); */

			// 判断是否为.md，true则提取URL，false则不打开视图发出提示
			// const activeFile = this.app.workspace.getActiveFile();
			// if (activeFile && activeFile.extension && (String(activeFile.extension).toLowerCase() === "md")) {
			if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
				this.activateView();
			} else {
				this.app.workspace.detachLeavesOfType(VIEW_TYPE);
				new Notice("It needs to work in active markdown view 😄");
			}
		});

		/* 事件 */
		this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
			// console.log("active-leaf-change");
			this.updateView(leaf);
		}));
	}

	onunload() {
	}

}
