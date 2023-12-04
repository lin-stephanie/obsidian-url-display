import { FileView, Notice, TFile, debounce } from "obsidian";

import UrlDisplayPlugin from "./main";
import { UrlDisplayView } from "./views"
import { IndexedDBCache } from "./cache";
import { MicroLinkParser } from "./parser";
import { deduplicateObjArrByUniId } from "./utils"
import type { UrlParse } from "./types"
import { VIEW_TYPE, URLREGEX, SPECIAL, EXCLUDE, SUPPORTED_VIEW_TYPE } from "./constants"
import { t } from "./lang/helper";

export class markdownProcessor {
	public plugin: UrlDisplayPlugin;
	private cache: IndexedDBCache;
	private parser: MicroLinkParser;

	public isExtracting: boolean;
	public isParsing: boolean;
	public activeView: FileView;
	public activeViewType: string;
	public activeNotehaveUrl: boolean | undefined;
	public activeNoteUrlParse: UrlParse[] | null;

	constructor(plugin: UrlDisplayPlugin) {
		this.plugin = plugin;
		this.cache = new IndexedDBCache();
		this.parser = new MicroLinkParser(this.plugin, this.cache);
	}

	public readonly process = debounce(async (view: FileView) => {
		// console.log("view", view)
		// console.log("view type", view.getViewType())
		// console.log("view file", view.file)
		// console.log("path", view.file?.path);
		// console.log("lockUrl", this.plugin.settings.lockUrl)

		this.initState();
		this.activeView = view;
		this.activeViewType = view.getViewType();

		if (this.plugin.settings.lockUrl) return;

		if (this.activeView && SUPPORTED_VIEW_TYPE.includes(this.activeViewType)) {
			// start extracting
			this.isExtracting = true;
			this.updateView();
			const activeNoteUrl = await this.extractUrl(this.activeView.file);
			this.isExtracting = false;

			if (!activeNoteUrl) {
				this.activeNotehaveUrl = false;
				this.updateView();
			} else {
				this.activeNotehaveUrl = true;
				// start parsing
				this.isParsing = true;
				this.updateView();
				this.activeNoteUrlParse = await this.parseUrl(this.activeView);
				this.isParsing = false;
				// console.log(this.activeNoteUrlParse)

				// if currentView is not null, it means that the user is switching md, need to judged to avoid race conditions
				// WARN: cannot use this.activeView(the reference has changed) but view(the reference in the closure)
				const currentView = this.plugin.app.workspace.getActiveFileView();
				// console.log("new", currentView.file?.path)
				// console.log("old", view.file?.path)
				if (currentView.file?.path === view.file?.path) {
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
		this.activeNotehaveUrl = undefined;
		this.activeNoteUrlParse = null;
	}

	private readonly extractUrl = async (file: TFile | null): Promise<string[] | null> => {
		if (file) {
			const activeFilContent = await this.plugin.app.vault.cachedRead(file);
			return activeFilContent.match(URLREGEX);
		} else {
			return null
		}
	}

	private readonly parseUrl = async (activeView: FileView): Promise<UrlParse[]> => {
		const activeContent = await this.plugin.app.vault.cachedRead(activeView.file as TFile);
		// const activeContent = markdownView.editor.getValue();
		const cleanedUrls = this.locateUrl(activeContent);

		if (this.plugin.settings.useAlias && !this.plugin.settings.showFavicon) {
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
			const currentView = this.plugin.app.workspace.getActiveFileView();
			if (currentView.file?.path === activeView.file?.path) {
				if (failedCount === 0 && (this.plugin.settings.noticeMode === "successful" || this.plugin.settings.noticeMode === "both")) {
					new Notice(t('Successful'));
				} else if (failedCount !== 0 && (this.plugin.settings.noticeMode === "failed" || this.plugin.settings.noticeMode === "both")) {
					new Notice(t('Failed', {failedCount}));
				}
			}
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
			const alias = match[1]?.replace(/(\*\*|__|\*|_|~~|==|`)/g, '').trim() || '';
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
	public readonly updateView = (): void => {
		for (const leaf of this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			const view = leaf.view;
			if (view instanceof UrlDisplayView) {
				view.updateDisplay();
			}
		}
	}
}
