import { MarkdownView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";

import { UrlDisplaySettingTab } from './settings'
import { UrlDisplayView } from "./views"
import { IndexedDBCache } from "./cache";
import { MicroLinkParser } from "./parser";
import type { UrlDisplaySettings, UrlParse } from "./constants"
import { VIEW_TYPE, DEFAULT_SETTINGS, EXTERNAL_LINK, PARTITION, SPECIAL, EXCLUDE } from "./constants"

export default class UrlDisplayPlugin extends Plugin {
	public settings: UrlDisplaySettings;
	public view: UrlDisplayView;

	public isExtracting: boolean | undefined;
	public isParsing: boolean | undefined;
	public activeNotehaveUrl: boolean | undefined;
	public activeNoteUrlParse: UrlParse[] | null;

	private cache: IndexedDBCache;
	private parser: MicroLinkParser;

	public override async onload() {
		console.clear();
		console.log("loading obsidian-url-display plugin v" + this.manifest.version);

		await this.loadSettings();
		this.addSettingTab(new UrlDisplaySettingTab(this.app, this));

		this.registerView(
			VIEW_TYPE,
			(leaf) => (this.view = new UrlDisplayView(leaf, this)),
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
						this.updateUrl();
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
			this.updateUrl();
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
		this.activeNotehaveUrl = undefined;
		this.activeNoteUrlParse = null;
	}

	private readonly activateView = async () => {
		console.log("start activateView");

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]
		);

		console.log("end activateView");
	}

	public readonly updateUrl = UrlDisplayPlugin.debounce(async () => {
		console.log("start updateUrl")
		const activeNoteUrl = await this.extractUrl(this.app.workspace.getActiveFile());
		console.log("end extractUrl")
		this.isExtracting = false;

		if (!activeNoteUrl) {
			this.activeNotehaveUrl = false;
			this.view.updateDisplay();
		} else {
			this.activeNotehaveUrl = true;
			this.activeNoteUrlParse = await this.parseUrl(activeNoteUrl);
			this.view.updateDisplay();
		}

		console.log("end updateUrl")
	})

	private readonly extractUrl = async (activeFile: TFile | null): Promise<string[] | null | undefined> => {
		console.log("start extractUrl")
		this.isExtracting = true;

		if (activeFile && (String(activeFile.extension).toLowerCase() === "md")) {
			// const md = await this.app.vault.read(activeFile);
			const activeFilContent = await this.app.vault.cachedRead(activeFile);
			return activeFilContent.match(EXTERNAL_LINK);
		}
	}

	private readonly parseUrl = async (activeNoteUrl: string[]): Promise<UrlParse[]> => {
		console.log("start parseUrl")
		this.isParsing = true;
		this.view.updateDisplay();

		const cleanedUrls = this.convertToObject(activeNoteUrl);

		if (this.settings.useAlias && !this.settings.showFavicon) {
			if (this.settings.noticeMode === "successful" || this.settings.noticeMode === "both") {
				new Notice("Successfully parsed all URLs 🎉");
			}
			this.isParsing = false;
			return cleanedUrls;
		} else {
			let failedCount = 0;
			console.log('cacheMode', this.settings.cacheMode);

			for (const cleanedUrl of cleanedUrls) {
				try {
					const data = await this.parser.parse(cleanedUrl.link);
					cleanedUrl.title = data.title;
					cleanedUrl.icon = data.icon;
				} catch (error) {
					console.log('error', error);
					failedCount += 1;
				}
			}

			if (failedCount === 0 && (this.settings.noticeMode === "successful" || this.settings.noticeMode === "both")) {
				new Notice("Successfully parsed all URLs 🎉");
			} else if (failedCount !== 0 && (this.settings.noticeMode === "failed" || this.settings.noticeMode === "both")) {
				new Notice(`Failed to parse ${failedCount} URLs 😥`);
			}

			this.isParsing = false;
			console.log("end parseUrl");
			return cleanedUrls;
		}
	}

	private readonly convertToObject = (activeNoteUrl: string[]): UrlParse[] => {
		console.log("start convertToObject");
		let UrlObject = [];

		for (const url of activeNoteUrl) {
			const unmatch = [...url.matchAll(PARTITION)]
			// case1："https://obsidian.md/"（unmatch is an empty array）
			if (unmatch.length === 0 && !EXCLUDE.test(url)) {
				UrlObject.push({ alias: "", link: url });
				continue;
			}
			// case2："[]()"
			for (const match of url.matchAll(PARTITION)) {
				if (match.groups && !EXCLUDE.test(match.groups.link)) {
					UrlObject.push({ alias: match.groups.alias, link: match.groups.link });
				}
			}
		}

		UrlObject = this.cleanUrl(UrlObject);
		console.log("end cleanUrl", UrlObject);
		return UrlObject;
	}

	private readonly cleanUrl = (UrlObject: UrlParse[]): UrlParse[] => {
		console.log("start cleanUrl", UrlObject);

		if (this.settings.deduplicateUrls) {
			UrlObject = UrlDisplayPlugin.deduplicateObjArrByUniId(UrlObject, "link");
		}

		// handle url like: "https://link.zhihu.com/?target=https%3A//conventionalcommits.org/"
		for (const url of UrlObject) {
			for (const match of url.link.matchAll(SPECIAL)) {
				if (match.groups) {
					url.link = decodeURIComponent(match.groups.target);
					console.log("cleaned", url.link);
				}
			}
		}

		console.log("end cleanUrl");
		return UrlObject;
	}

	private static deduplicateObjArrByUniId = (arr: UrlParse[], uniId: string): UrlParse[] => {
		const res = new Map();
		return arr.filter((item) => !res.has(item[uniId as keyof UrlParse]) && res.set(item[uniId as keyof UrlParse], 1));
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