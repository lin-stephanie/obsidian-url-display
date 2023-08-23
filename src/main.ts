import { MarkdownView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";

import { URLDisplaySettingTab } from './settings'
import { URLDisplayView } from "./views"
import { IndexedDBCache } from "./cache";
import { MicroLinkParser } from "./parser";
import type { URLDisplaySettings, URLParse } from "./constants"
import { VIEW_TYPE, DEFAULT_SETTINGS, EXTERNAL_LINK, PARTITION, SPECIAL, EXCLUDE } from "./constants"

export default class URLDisplayPlugin extends Plugin {
	public settings: URLDisplaySettings;
	public view: URLDisplayView;

	public isExtracting: boolean | undefined;
	public isParsing: boolean | undefined;
	public activeNotehaveURL: boolean | undefined;
	public activeNoteURLParse: URLParse[] | null;

	private cache: IndexedDBCache;
	private parser: MicroLinkParser;

	public override async onload() {
		console.clear();
		console.log("loading obsidian-url-display plugin v" + this.manifest.version);

		await this.loadSettings();
		this.addSettingTab(new URLDisplaySettingTab(this.app, this));

		this.registerView(
			VIEW_TYPE,
			(leaf) => (this.view = new URLDisplayView(leaf, this)),
		);

		this.addRibbonIcon('external-link', 'Open URL Dispaly', (evt: MouseEvent) => {
			this.isOpen();
		});

		this.addCommand({
			id: 'url-display-open',
			name: 'Open or close Pane',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						this.isOpen();
					}
					return true;
				}
			}
		});

		this.addCommand({
			id: 'url-display-refresh',
			name: 'Refresh URL list',
			checkCallback: (checking: boolean) => {
				console.log("checking", checking);
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				const urlDisplayView = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
				if (markdownView && urlDisplayView) {
					if (!checking) {
						this.initState();
						this.updateURL();
					}
					return true;
				}
			}
		});

		this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
			console.log("start active-leaf-change");
			this.isActive(leaf);
			console.log("end active-leaf-change");
		}));

		this.cache = new IndexedDBCache();
		this.parser = new MicroLinkParser(this, this.cache);
	}

	public async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	public async saveSettings() {
		await this.saveData(this.settings);
	}

	private readonly isActive = (leaf?: WorkspaceLeaf | null) => {
		if (leaf && leaf.getViewState().type === "markdown" && this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
			console.log("start isActive");
			this.initState();
			this.updateURL();
			console.log("end isActive");
		} else {
			return;
		}
	}

	private readonly isOpen = () => {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
			this.app.workspace.detachLeavesOfType(VIEW_TYPE);
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
			new Notice("Move focus into a markdown file 😉");
		}
	}

	public readonly initState = () => {
		this.isExtracting = undefined;
		this.isParsing = undefined;
		this.activeNotehaveURL = undefined;
		this.activeNoteURLParse = null;
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

	public readonly updateURL = URLDisplayPlugin.debounce(async () => {
		console.log("start updateURL")
		const activeNoteURL = await this.extractURL(this.app.workspace.getActiveFile());
		console.log("end extractURL")
		this.isExtracting = false;

		if (!activeNoteURL) {
			this.activeNotehaveURL = false;
			this.view.updateDisplay();
		} else {
			this.activeNotehaveURL = true;
			this.activeNoteURLParse = await this.parseURL(activeNoteURL);
			this.view.updateDisplay();
		}

		console.log("end updateURL")
	})

	private readonly extractURL = async (activeFile: TFile | null): Promise<string[] | null | undefined> => {
		console.log("start extractURL")
		this.isExtracting = true;

		if (activeFile && (String(activeFile.extension).toLowerCase() === "md")) {
			// const md = await this.app.vault.read(activeFile);
			const activeFilContent = await this.app.vault.cachedRead(activeFile);
			return activeFilContent.match(EXTERNAL_LINK);
		}
	}

	private readonly parseURL = async (activeNoteURL: string[]): Promise<URLParse[]> => {
		console.log("start parseURL")
		this.isParsing = true;
		this.view.updateDisplay();

		const cleanedURLs = this.convertToObject(activeNoteURL);
		if (this.settings.useAlias && !this.settings.showFavicon) {
			this.isParsing = false;
			return cleanedURLs;
		} else {
			let failedCount = 0;
			console.log('cacheMode', this.settings.cacheMode);

			for (const cleanedURL of cleanedURLs) {
				try {
					const data = await this.parser.parse(cleanedURL.link);
					cleanedURL.title = data.title;
					cleanedURL.icon = data.icon;
				} catch (error) {
					console.log('error', error);
					failedCount += 1;
				}
			}

			if (failedCount === 0) {
				new Notice("Successfully parsed all URLs 🎉");
			} else {
				new Notice(`Failed to parse ${failedCount} URLs 😥`);
			}

			this.isParsing = false;
			console.log("end parseURL");
			return cleanedURLs;
		}
	}

	private readonly convertToObject = (activeNoteURL: string[]): URLParse[] => {
		console.log("start convertToObject");
		let URLObject = [];

		for (const url of activeNoteURL) {
			const unmatch = [...url.matchAll(PARTITION)]
			// case1："https://obsidian.md/"（unmatch is an empty array）
			if (unmatch.length === 0 && !EXCLUDE.test(url)) {
				URLObject.push({ alias: "", link: url });
				continue;
			}
			// case2："[]()"
			for (const match of url.matchAll(PARTITION)) {
				if (match.groups && !EXCLUDE.test(match.groups.link)) {
					URLObject.push({ alias: match.groups.alias, link: match.groups.link });
				}
			}
		}

		URLObject = this.cleanURL(URLObject);
		console.log("end cleanURL", URLObject);
		return URLObject;
	}

	private readonly cleanURL = (URLObject: URLParse[]): URLParse[] => {
		console.log("start cleanURL", URLObject);

		if (this.settings.DeduplicateURLs) {
			URLObject = URLDisplayPlugin.deduplicateObjArrByUniId(URLObject, "link");
		}

		// handle url like: "https://link.zhihu.com/?target=https%3A//conventionalcommits.org/"
		for (const url of URLObject) {
			for (const match of url.link.matchAll(SPECIAL)) {
				if (match.groups) {
					url.link = decodeURIComponent(match.groups.target);
					console.log("cleaned", url.link);
				}
			}
		}

		console.log("end cleanURL");
		return URLObject;
	}

	private static deduplicateObjArrByUniId(arr: URLParse[], uniId: string): URLParse[] {
		const res = new Map();
		return arr.filter((item) => !res.has(item[uniId as keyof URLParse]) && res.set(item[uniId as keyof URLParse], 1));
	}

	private static debounce = (fn: () => void, ms = 1000) => {
		let timeoutId: ReturnType<typeof setTimeout>;
		return function () {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => fn.apply(this), ms);
		};
	};

	public override onunload() {
		console.log("unloading obsidian-url-display plugin v" + this.manifest.version);
	}
}