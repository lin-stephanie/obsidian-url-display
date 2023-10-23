import { MarkdownView, Notice, TFile, debounce } from "obsidian";

import UrlDisplayPlugin from "./main";
import { UrlDisplayView } from "./views"
import { IndexedDBCache } from "./cache";
import { MicroLinkParser } from "./parser";
import { deduplicateObjArrByUniId } from "./utils"
import type { UrlParse } from "./types"
import { VIEW_TYPE, EXTERNAL_LINK, URLREGEX, SPECIAL, EXCLUDE } from "./constants"


export class markdownProcessor {
	public plugin: UrlDisplayPlugin;
	private cache: IndexedDBCache;
	private parser: MicroLinkParser;

	public isExtracting: boolean;
	public isParsing: boolean;
	public activeMarkdownView: MarkdownView | null;
	public activeNotehaveUrl: boolean;
	public activeNoteUrlParse: UrlParse[] | null | undefined;
	

	constructor(plugin: UrlDisplayPlugin) {
		this.plugin = plugin;
		this.cache = new IndexedDBCache();
		this.parser = new MicroLinkParser(this.plugin, this.cache);
	}

	public readonly process = debounce(async (markdownView: MarkdownView | null) => {
		this.initState();
		this.activeMarkdownView = markdownView;

		if (this.activeMarkdownView) {
			const activeNoteUrl = await this.extractUrl(this.activeMarkdownView.file);
			this.isExtracting = false;
			if (!activeNoteUrl) {
				this.updateView();
			} else {
				this.activeNotehaveUrl = true;
				this.activeNoteUrlParse = await this.parseUrl(this.activeMarkdownView);
				// console.log(this.activeNoteUrlParse);
				// if currentMarkdownView is not null, it means that the user is switching md, need to judged to avoid race conditions
				// if currentMarkdownView is null, it means that the user is clicking ribbon icon
				// WARN: cannot use this.activeMarkdownView(the reference has changed) but markdownView(the reference in the closure)
				const currentMarkdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (currentMarkdownView) {
					if (currentMarkdownView.file?.path === markdownView?.file?.path) {
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
			return activeFilContent.match(EXTERNAL_LINK);
		}
	}

	private readonly parseUrl = async (markdownView: MarkdownView): Promise<UrlParse[] | undefined>  => {
		this.isParsing = true;
		this.updateView();

		// the same: const activeFilContent = await this.plugin.app.vault.cachedRead(markdownView.file as TFile);
		const activeFilContent = markdownView.editor.getValue();
		const cleanedUrls = this.locateUrl(activeFilContent);

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
		let yamlStartIndex = -1;
        let yamlEndIndex = -1;

		// check if the URL is within the YAML section and should be ignored
		if (this.plugin.settings.ignoreFileProperty) {
            const yamlStartMatch = content.match(/---/);
            const yamlEndMatch = content.match(/---/g);
            if (yamlStartMatch && yamlStartMatch.index) {
				yamlStartIndex = yamlStartMatch.index;
			}
            if (yamlEndMatch && yamlEndMatch.length > 1) {
				yamlEndIndex = content.lastIndexOf('---');
			}
        }

		while (match = URLREGEX.exec(content)) {
			const index = match.index;

			// check if the URL is within the YAML section and should be ignored
            if (this.plugin.settings.ignoreFileProperty && index > yamlStartIndex && index < yamlEndIndex) {
                continue;
            }

			// get capturing group from match
			const alias = match[1] || '';
			const link = match[2] || match[3];
			
			// check if the URL has an excluded extension
			if (EXCLUDE.some(ext => link.endsWith(ext))) {
				continue;
			}

			// calculate the line where the URL is located
			const lines = content.substring(0, index).split('\n');
			const line = lines.length-1;
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
