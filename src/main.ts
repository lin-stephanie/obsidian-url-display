import { MarkdownView, Notice, Plugin, TFile } from 'obsidian';

import { VIEW_TYPE, EXTERNAL_URL_PATTERN, EXTERNAL_URL_OBJECT_PATTERN, DEFAULT_SETTINGS, IDENTIFY_TARGET_URL } from './constants'
import type { URLDisplaySettings, URLExtract, URLParse } from './constants'
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
		this.isExtracting = undefined;
		this.isParsing = undefined;
		this.activeNotehaveURL = undefined;
		this.activeNoteURLParse = [];
	}

	private readonly activateView = async () => {
		console.log("start activateView");

		/* const leaf = this.app.workspace.getRightLeaf(false);
		await leaf.setViewState({ type: VIEW_TYPE });
		this.app.workspace.revealLeaf(leaf); */
		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE,
			active: true,
		});
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]
		);
		
		console.log("end activateView");
	}

	public readonly updateURL = async () => {
		console.log("start updateURL")
		const activeNoteURL = await this.extractURL(this.app.workspace.getActiveFile());
		console.log("end extractURL")
		this.isExtracting = false;

		if (activeNoteURL.length === 0) {
			this.activeNotehaveURL = false;
			this.view.updateDisplay();
		} else {
			this.activeNotehaveURL = true;
			this.activeNoteURLParse = await this.parseURL(activeNoteURL);
			this.view.updateDisplay();
		}

		console.log("end updateURL")
	}

	private readonly extractURL = async (activeFile: TFile | null): Promise<string[]> => {
		console.log("start extractURL")
		this.isExtracting = true;

		if (activeFile && (String(activeFile.extension).toLowerCase() === "md")) {
			// const md = await this.app.vault.read(activeFile);
			const activeFilContent = await this.app.vault.cachedRead(activeFile);
			return activeFilContent.match(EXTERNAL_URL_PATTERN) || [];
		} else {
			return []
		}
	}

	private readonly parseURL = async (activeNoteURL: string[]): Promise<URLParse[]>  => {
		console.log("start parseURL")
		this.isParsing = true;
		this.view.updateDisplay();
		
		const parser = parsers["microlink"];
		const cleanedURLs = this.convertToObject(activeNoteURL);
		const parsedURLs = [];
		
		for (const cleanedURL of cleanedURLs) {
			const parsedURL = {...cleanedURL} as URLParse;
			try {
				console.log('parseURL');
				const data = await parser.parse(cleanedURL.link);
				parsedURL.title = data.title.replace(/"/g, '\\"');
				parsedURL.logo = data.logo;
				parsedURLs.push(parsedURL)
			} catch (error) {
				console.log('error', error);
				new Notice(`Failed to fetch data`);
			}
		}
		this.isParsing = false;
		console.log("end parseURL")
		return parsedURLs;
	}

	private readonly convertToObject = (activeNoteURL: string[]): URLExtract[] => {
		console.log("start convertToObject")
		let URLObject = [];
		for (const url of activeNoteURL) {
			// console.log(url);
			const unmatch = [...url.matchAll(EXTERNAL_URL_OBJECT_PATTERN)]
			// case1："https://obsidian.md/"（unmatch is an empty array）
			if (unmatch.length === 0) {
				URLObject.push({ alias: "", link: url });
				continue;
			}
			// case2："[]()"
			for (const match of url.matchAll(EXTERNAL_URL_OBJECT_PATTERN)) {
				if (match.groups) {
					URLObject.push({ alias: match.groups.alias, link: match.groups.link });
				}
			}
		}
		URLObject = this.cleanURL(URLObject);
		console.log("end convertToObject")
		return URLObject;
	}

	private readonly cleanURL = (URLObject: URLExtract[]): URLExtract[] => {
		console.log("start cleanURL")
		if (this.settings.removeDuplicateURLs) {
			URLObject = deduplicateObjArrByUniId(URLObject, "link");
		}

		// handle url like: "https://link.zhihu.com/?target=https%3A//conventionalcommits.org/"
		for (const url of URLObject) {
			for (const match of url.link.matchAll(IDENTIFY_TARGET_URL)) {
				if (match.groups) {
					url.link = decodeURIComponent(match.groups.target);
					console.log(url.link);
				}
			}
		}
		console.log("end cleanURL")
		return URLObject;
	}


	override onunload() {
	}
}

// updateView = (avtiveLeaf: WorkspaceLeaf | null): void => {
// 	/* if (avtiveLeaf) {
// 		console.log(avtiveLeaf.getViewState().type);
// 	} */

// 	if (avtiveLeaf && this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
// 		// console.log(this.app.workspace.getLeavesOfType(VIEW_TYPE)[0].view);
// 		this.view.updateDisplay();
// 	}
// 	// 当激活页不是md时，控制是否要关闭视图
// 	/* if (avtiveLeaf && avtiveLeaf.getViewState().type !== "markdown" && avtiveLeaf.getViewState().type !== "url-display" && this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
// 		this.app.workspace.detachLeavesOfType(VIEW_TYPE);
// 		new Notice("It needs to work in active markdown view 😄");
// 	} */
// }