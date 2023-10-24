import { MarkdownView, FileView, Notice, TFile, debounce } from "obsidian";

import UrlDisplayPlugin from "./main";
import { UrlDisplayView } from "./views"
import { IndexedDBCache } from "./cache";
import { MicroLinkParser } from "./parser";
import { deduplicateObjArrByUniId } from "./utils"
import type { UrlParse } from "./types"
import { VIEW_TYPE, URLREGEX, SPECIAL, EXCLUDE, SUPPORTED_VIEW_TYPE } from "./constants"

export class markdownProcessor {
	public plugin: UrlDisplayPlugin;
	private cache: IndexedDBCache;
	private parser: MicroLinkParser;

	public isExtracting: boolean;
	public isParsing: boolean;
	public activeView: FileView;
	public activeViewType: string;
	public activeNotehaveUrl: boolean;
	public activeNoteUrlParse: UrlParse[] | null | undefined;

	constructor(plugin: UrlDisplayPlugin) {
		this.plugin = plugin;
		this.cache = new IndexedDBCache();
		this.parser = new MicroLinkParser(this.plugin, this.cache);
	}

	public readonly process = debounce(async (view: FileView) => {
		this.initState();
		this.activeView = view;
		this.activeViewType = view?.getViewType();

		if (this.activeView && SUPPORTED_VIEW_TYPE[this.activeViewType]) {
			const activeNoteUrl = await this.extractUrl(this.activeView.file);
			this.isExtracting = false;
			if (!activeNoteUrl) {
				this.updateView();
			} else {
				this.activeNotehaveUrl = true;
				this.activeNoteUrlParse = await this.parseUrl(this.activeView);
				// if currentMarkdownView is not null, it means that the user is switching md, need to judged to avoid race conditions
				// if currentMarkdownView is null, it means that the user is clicking ribbon icon
				// WARN: cannot use this.activeView(the reference has changed) but view(the reference in the closure)
				const currentMarkdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (currentMarkdownView) {
					if (currentMarkdownView.file?.path === view?.file?.path) {
						this.updateView();
					}
				} else {
					this.updateView();
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
			return activeFilContent.match(URLREGEX);
		}
	}

	private readonly parseUrl = async (activeView: FileView): Promise<UrlParse[] | undefined> => {
		this.isParsing = true;
		this.updateView();

		const activeContent = await this.plugin.app.vault.cachedRead(activeView.file as TFile);
		// const activeContent = markdownView.editor.getValue();
		const cleanedUrls = this.locateUrl(activeContent);

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

	private readonly locateUrl = (content: string): UrlParse[] => {
		let match;
		let UrlObject: UrlParse[] = [];
		let yamlEndIndex = -1;

		// check if the URL is within the YAML section and should be ignored
		if (this.plugin.settings.ignoreFileProperty) {
			yamlEndIndex = content.indexOf('---', 3); 
		}

		/* eslint no-cond-assign: "off" */
		while (match = URLREGEX.exec(content)) {
			const index = match.index;
			const charBefore = content[index - 1];
			const charAfter = content[index + match[0].length];
			const precedingText = content.substring(0, index);
			const backtickCount = (precedingText.match(/```/g) || []).length;

			// check if the URL is within the YAML section and should be ignored
			if (this.plugin.settings.ignoreFileProperty && index < yamlEndIndex) {
				continue;
			}

			// Skip URLs within inline code
			if (charBefore === '`' && charAfter === '`') {
				continue;
			}

			// Skip URLs within code blocks
			if (backtickCount % 2 === 1) {
				continue;
			}

			// get capturing group from match & remove markdown syntax
			const alias = match[1]?.replace(/(\*\*|__|~~|\*|==|`)/g, '').trim() || '';
			const link = match[2] || match[3];

			// check if the URL has an excluded extension
			if (EXCLUDE.some(ext => link.endsWith(ext))) {
				continue;
			}

			// calculate the line where the URL is located
			const lines = content.substring(0, index).split('\n');
			const line = lines.length - 1;
			// const ch = lines[line - 1].length;

			UrlObject.push({ alias, link, line });
		}

		UrlObject = this.cleanUrl(UrlObject);
		return UrlObject;
	}

	// remove duplicates & handle special formatted URLs 
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

		return UrlObject
	}

	// https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Avoid+managing+references+to+custom+views
	private readonly updateView = (): void => {
		for (const leaf of this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			const view = leaf.view;
			if (view instanceof UrlDisplayView) {
				view.updateDisplay();
			}
		}
	}
}
