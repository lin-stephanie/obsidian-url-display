import { MarkdownView, Notice, Plugin, WorkspaceLeaf } from 'obsidian';

import { VIEW_TYPE, EXTERNAL_URL_PATTERN, EXTERNAL_URL_OBJECT_PATTERN, DEFAULT_SETTINGS } from './constants'
import type { URLDisplaySettings, URLParse } from './constants'
import { URLDisplaySettingTab } from './settings'
import { URLDisplayView } from './views'
import { deduplicateObjArrByUniId } from "./utils";
import { parsers } from "./parser";


export default class URLDisplayPlugin extends Plugin {

	public settings: URLDisplaySettings;
	public view: URLDisplayView;
	public activeNotehaveURL: boolean | undefined;
	public activeNoteURLParse: URLParse[];

	public isExtracting: boolean | undefined;
	public isParsing: boolean | undefined;

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

	public override async onload() {
		console.clear();
		console.log("loading obsidian-url-display plugin v" + this.manifest.version);

		await this.loadSettings();
		this.addSettingTab(new URLDisplaySettingTab(this.app, this));

		this.registerView(
			VIEW_TYPE,
			(leaf) => (this.view = new URLDisplayView(leaf, this)),
		);

		this.addRibbonIcon('external-link', 'Open URL Panel', (evt: MouseEvent) => {
			this.isOpen();
		});

		this.addCommand({
			id: 'open-url-panel',
			name: 'Open URL Panel',
			callback: () => {
			}
		});

		this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
			// console.log("active-leaf-change");
			// this.updateView(leaf);
		}));
	}

	public async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	public async saveSettings() {
		await this.saveData(this.settings);
	}

	private readonly isOpen = () => {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
			this.app.workspace.detachLeavesOfType(VIEW_TYPE)
		} else {
			this.isMarkdownView();
		}
	}

	private readonly isMarkdownView = async () => {
		// const activeFile = this.app.workspace.getActiveFile();
		// if (activeFile && activeFile.extension && (String(activeFile.extension).toLowerCase() === "md")) {
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			console.log("is MarkdownView");
			this.initState();
			this.activateView();
			
		} else {
			// this.app.workspace.detachLeavesOfType(VIEW_TYPE);
			console.log("no MarkdownView");
			new Notice("It needs to work in active markdown view 😅");
		}
	}

	private readonly initState = () => {
		this.activeNotehaveURL = undefined;
		this.isExtracting = undefined;
		this.isParsing = undefined;
		this.activeNoteURLParse = [];
	}

	private readonly activateView = async () => {
		console.log("start activateView");

		const leaf = this.app.workspace.getRightLeaf(false);
		await leaf.setViewState({ type: VIEW_TYPE });
		this.app.workspace.revealLeaf(leaf);
		/* await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE,
			active: true,
		});
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]
		);
		 */

		console.log("end activateView");
	}

	public readonly updateURL = async () => {
		console.log("start updateURL")
		const activeNoteURL = await this.extractURL();
		console.log("end extractURL")
		this.isExtracting = false;

		if (activeNoteURL.length === 0) {
			this.activeNotehaveURL = false;
			this.view.updateDisplay();
		} else {
			this.activeNotehaveURL = true;
			await this.parseURL(activeNoteURL);
			this.view.updateDisplay();
		}

		console.log("end updateURL")
	}

	private readonly extractURL = async (): Promise<string[]> => {
		console.log("start extractURL")
		this.isExtracting = true;
		const activeFile = this.app.workspace.getActiveFile();

		if (activeFile && (String(activeFile.extension).toLowerCase() === "md")) {
			// const md = await this.app.vault.read(activeFile);
			const activeFilContent = await this.app.vault.cachedRead(activeFile);
			return activeFilContent.match(EXTERNAL_URL_PATTERN) || [];
		} else {
			return []
		}
	}

	private readonly parseURL = async (activeNoteURL: string[]) => {
		console.log("start parseURL")
		this.isParsing = true;
		this.view.updateDisplay();

		this.activeNoteURLParse = this.convertToObject(activeNoteURL);
		const parser = parsers["microlink"];

		for (const URLObject of this.activeNoteURLParse) {
			try {
				console.log('parseURL');
				const data = await parser.parse(URLObject.link);
				URLObject.title = data.title.replace(/"/g, '\\"');
				URLObject.logo = data.logo;
				URLObject.description = data.description.replace(/"/g, '\\"');
			} catch (error) {
				console.log('error', error);
				new Notice(`Failed to fetch data`);
			}
		}
		this.isParsing = false;
		console.log("end parseURL")
	}

	private readonly convertToObject = (activeNoteURL: string[]): URLParse[] => {
		let urlObject = [];
		for (const url of activeNoteURL) {
			// console.log(url);
			const unmatch = [...url.matchAll(EXTERNAL_URL_OBJECT_PATTERN)]

			// case1："https://obsidian.md/"（unmatch is an empty array）
			if (unmatch.length === 0) {
				urlObject.push({ alias: "", link: url,  });
				continue;
			}
			// case1："[]()"
			for (const match of url.matchAll(EXTERNAL_URL_OBJECT_PATTERN)) {
				if (match.groups) {
					urlObject.push({ alias: match.groups.alias, link: match.groups.link });
				}
			}
		}
		if (this.settings.removeDuplicateURLs) {
			urlObject = deduplicateObjArrByUniId(urlObject, "link");
		}
		return urlObject;
	}


	override onunload() {
	}
}
