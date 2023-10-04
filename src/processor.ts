import { MarkdownView, Notice, TFile, debounce } from "obsidian";

import UrlDisplayPlugin from "./main";
import { UrlDisplayView } from "./views"
import { IndexedDBCache } from "./cache";
import { MicroLinkParser } from "./parser";
import { deduplicateObjArrByUniId } from "./utils"
import type { UrlParse } from "./types"
import { VIEW_TYPE, EXTERNAL_LINK, PARTITION, SPECIAL, EXCLUDE } from "./constants"


export class markdownProcessor {
	public plugin: UrlDisplayPlugin;
	private cache: IndexedDBCache;
	private parser: MicroLinkParser;

	public isExtracting: boolean;
	public isParsing: boolean;
	public activeNotehaveUrl: boolean;
	public activeNoteUrlParse: UrlParse[] | null;

	constructor(plugin: UrlDisplayPlugin) {
		this.plugin = plugin;
		this.cache = new IndexedDBCache();
		this.parser = new MicroLinkParser(this.plugin, this.cache);
	}

	public readonly process = debounce(async (markdownView: MarkdownView | null) => {
		this.initState();
		if (markdownView) {
			const activeNoteUrl = await this.extractUrl(markdownView.file);
			this.isExtracting = false;
			if (!activeNoteUrl) {
				this.updateView();
			} else {
				this.activeNotehaveUrl = true;
				this.activeNoteUrlParse = await this.parseUrl(activeNoteUrl);
				// avoid race condition
				const currentMarkdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (currentMarkdownView?.file?.path === markdownView.file?.path) {
					this.updateView(markdownView);
				}
			}
		} else {
			this.updateView();
		}
	}, 1000, true)

	public readonly initState = () => {
		this.isExtracting = false;
		this.isParsing = false;
		this.activeNotehaveUrl = false;
		this.activeNoteUrlParse = null;
	}

	private readonly extractUrl = async (activeFile: TFile | null): Promise<string[] | null | undefined> => {
		this.isExtracting = true;
		this.updateView();
		if (activeFile) {
			const activeFilContent = await this.plugin.app.vault.cachedRead(activeFile);
			return activeFilContent.match(EXTERNAL_LINK);
		}
	}

	private readonly parseUrl = async (activeNoteUrl: string[]): Promise<UrlParse[]> => {
		this.isParsing = true;
		this.updateView();
		const cleanedUrls = this.convertToObject(activeNoteUrl);

		if (this.plugin.settings.useAlias && !this.plugin.settings.showFavicon) {
			if (this.plugin.settings.noticeMode === "successful" || this.plugin.settings.noticeMode === "both") {
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
			if (failedCount === 0 && (this.plugin.settings.noticeMode === "successful" || this.plugin.settings.noticeMode === "both")) {
				new Notice("Successfully parsed all URLs 🎉");
			} else if (failedCount !== 0 && (this.plugin.settings.noticeMode === "failed" || this.plugin.settings.noticeMode === "both")) {
				new Notice(`Failed to parse ${failedCount} URLs 😥`);
			}
			this.isParsing = false;
			return cleanedUrls;
		}
	}

	private readonly convertToObject = (activeNoteUrl: string[]): UrlParse[] => {
		let UrlObject: { alias: string; link: string; }[] = [];

		for (const url of activeNoteUrl) {
			const unmatch = [...url.matchAll(PARTITION)];

			// exclude .jpg etc
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
		if (this.plugin.settings.deduplicateUrls) {
			UrlObject = deduplicateObjArrByUniId(UrlObject, "link");
		}

		// handle url like: "https://link.zhihu.com/?target=https%3A//conventionalcommits.org/"
		for (const url of UrlObject) {
			const result = url.link.match(SPECIAL);
			if (result) {
				url.link = decodeURIComponent(result[1]);
			}
		}

		return UrlObject;
	}

	// https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Avoid+managing+references+to+custom+views
	private readonly updateView = (markdownView?: MarkdownView): void => {
		for (const leaf of this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			const view = leaf.view;
			if (view instanceof UrlDisplayView) {
				view.update(markdownView);
			}
		}
	}
}
