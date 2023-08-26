import { MarkdownView, Notice, Plugin, TFile, debounce } from "obsidian";

import { UrlDisplaySettingTab } from './settings'
import { UrlDisplayView } from "./views"
import { IndexedDBCache } from "./cache";
import { MicroLinkParser } from "./parser";
import type { UrlDisplaySettings, UrlParse } from "./constants"
import { VIEW_TYPE, DEFAULT_SETTINGS, EXTERNAL_LINK, PARTITION, SPECIAL, EXCLUDE } from "./constants"

export default class UrlDisplayPlugin extends Plugin {
	public settings: UrlDisplaySettings;
	public isExtracting: boolean | undefined;
	public isParsing: boolean | undefined;
	public activeNotehaveUrl: boolean | undefined;
	public activeNoteUrlParse: UrlParse[] | null;

	private cache: IndexedDBCache;
	private parser: MicroLinkParser;

	public override async onload() {
		// console.clear();
		console.log("loading obsidian-url-display plugin v" + this.manifest.version);

		await this.loadSettings();

		this.addSettingTab(new UrlDisplaySettingTab(this.app, this));

		this.registerView(VIEW_TYPE, (leaf) => new UrlDisplayView(leaf, this));

		this.addRibbonIcon('external-link', 'Open URL Dispaly', (evt: MouseEvent) => {
			this.openOrClosePane();
		});

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
			if (leaf && leaf.getViewState().type === "markdown" && this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
				this.initState();
				this.updateUrl();
			} else {
				return;
			}
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

	private readonly openOrClosePane = () => {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) {
			this.app.workspace.detachLeavesOfType(VIEW_TYPE);
		} else {
			this.activateView();
		}
	}

	private readonly activateView = async () => {
		// const activeFile = this.app.workspace.getActiveFile();
		// if (activeFile && activeFile.extension && (String(activeFile.extension).toLowerCase() === "md")) {
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			this.initState();
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: VIEW_TYPE,
				active: true,
			});
			this.app.workspace.revealLeaf(
				this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]
			);
		} else {
			// this.app.workspace.detachLeavesOfType(VIEW_TYPE);
			new Notice("Move focus into a note 😉");
		}
	}

	public readonly initState = () => {
		this.isExtracting = undefined;
		this.isParsing = undefined;
		this.activeNotehaveUrl = undefined;
		this.activeNoteUrlParse = null;
	}

	public readonly updateUrl = debounce(async () => {
		const activeNoteUrl = await this.extractUrl(this.app.workspace.getActiveFile());
		this.isExtracting = false;

		if (!activeNoteUrl) {
			this.activeNotehaveUrl = false;
			this.updateView();
		} else {
			this.activeNotehaveUrl = true;
			this.activeNoteUrlParse = await this.parseUrl(activeNoteUrl);
			this.updateView();
		}
	}, 1000, true)

	private readonly extractUrl = async (activeFile: TFile | null): Promise<string[] | null | undefined> => {
		this.isExtracting = true;
		this.updateView();

		if (activeFile && (String(activeFile.extension).toLowerCase() === "md")) {
			// const md = await this.app.vault.read(activeFile);
			const activeFilContent = await this.app.vault.cachedRead(activeFile);
			return activeFilContent.match(EXTERNAL_LINK);
		}
	}

	private readonly parseUrl = async (activeNoteUrl: string[]): Promise<UrlParse[]> => {
		this.isParsing = true;
		this.updateView();
		const cleanedUrls = this.convertToObject(activeNoteUrl);

		if (this.settings.useAlias && !this.settings.showFavicon) {
			if (this.settings.noticeMode === "successful" || this.settings.noticeMode === "both") {
				new Notice("Successfully parsed all URLs 🎉");
			}
			this.isParsing = false;
			return cleanedUrls;
		} else {
			let failedCount = 0;
			for (const cleanedUrl of cleanedUrls) {
				try {
					const data = await this.parser.parse(cleanedUrl.link);
					cleanedUrl.title = data.title;
					cleanedUrl.icon = data.icon;
				} catch (error) {
					failedCount += 1;
				}
			}
			if (failedCount === 0 && (this.settings.noticeMode === "successful" || this.settings.noticeMode === "both")) {
				new Notice("Successfully parsed all URLs 🎉");
			} else if (failedCount !== 0 && (this.settings.noticeMode === "failed" || this.settings.noticeMode === "both")) {
				new Notice(`Failed to parse ${failedCount} URLs 😥`);
			}
			this.isParsing = false;
			return cleanedUrls;
		}
	}

	private readonly convertToObject = (activeNoteUrl: string[]): UrlParse[] => {
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
		return UrlObject;
	}

	private readonly cleanUrl = (UrlObject: UrlParse[]): UrlParse[] => {
		if (this.settings.deduplicateUrls) {
			UrlObject = UrlDisplayPlugin.deduplicateObjArrByUniId(UrlObject, "link");
		}

		// handle url like: "https://link.zhihu.com/?target=https%3A//conventionalcommits.org/"
		for (const url of UrlObject) {
			for (const match of url.link.matchAll(SPECIAL)) {
				if (match.groups) {
					url.link = decodeURIComponent(match.groups.target);
				}
			}
		}

		return UrlObject;
	}

	private readonly updateView = (): void => {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			const view = leaf.view;
			if (view instanceof UrlDisplayView) {
				view.updateDisplay();
			}
		}
	}

	private static deduplicateObjArrByUniId = (arr: UrlParse[], uniId: string): UrlParse[] => {
		const res = new Map();
		return arr.filter((item) => !res.has(item[uniId as keyof UrlParse]) && res.set(item[uniId as keyof UrlParse], 1));
	}

	// private static debounce = (fn: () => void, ms = 1000) => {
	// 	let timeoutId: ReturnType<typeof setTimeout>;
	// 	return function () {
	// 		clearTimeout(timeoutId);
	// 		timeoutId = setTimeout(() => fn.apply(this), ms);
	// 	};
	// };

	public override onunload() {
		console.log("unloading obsidian-url-display plugin v" + this.manifest.version);
	}
}