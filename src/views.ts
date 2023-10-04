import { WorkspaceLeaf, ItemView, Menu, getIcon, MarkdownView, TFile } from "obsidian";

import UrlDisplayPlugin from "./main";
import { markdownProcessor } from "./processor"
import { searchContent, getLineAndColumn } from "./utils"
import type { UrlParse } from "./types";
import { VIEW_TYPE } from "./constants";

export class UrlDisplayView extends ItemView {
	private plugin: UrlDisplayPlugin;
	public activeMarkdownView: MarkdownView;
	public processor: markdownProcessor;

	constructor(leaf: WorkspaceLeaf, plugin: UrlDisplayPlugin, processor: markdownProcessor) {
		super(leaf);
		this.plugin = plugin;
		this.processor = processor;
	}

	public getIcon(): string {
		return 'external-link';
	}

	public getViewType() {
		return VIEW_TYPE;
	}

	public getDisplayText() {
		return "URL Display";
	}

	public override async onOpen() {
		const currentMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		this.processor.process(currentMarkdownView);
	}

	public readonly update = (markdownView?: MarkdownView) => {
		if (markdownView) {
			this.activeMarkdownView = markdownView;
			this.updateDisplay();
		}
		this.updateDisplay();
	}

	public readonly updateDisplay = () => {
		const container = this.containerEl.children[1];
		container.empty();

		if (this.processor.isExtracting) {
			this.parsing(container);
		}

		if (!this.processor.isExtracting && !this.processor.activeNotehaveUrl) {
			container.createEl("p", { text: "No valid URL found 😄" });
		}

		if (this.processor.isParsing) {
			this.parsing(container);
		}

		if (!this.processor.isParsing && this.processor.activeNoteUrlParse && !(this.processor.activeNoteUrlParse.length === 0)) {
			this.updateList(container);
		}
	}

	public readonly updateList = (container: Element): void => {
		const rootEl = createDiv({ cls: 'nav-folder mod-root' });
		const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

		if (this.processor.activeNoteUrlParse) {
			this.processor.activeNoteUrlParse.forEach((currentUrl) => {
				const navUrl = childrenEl.createDiv({ cls: 'tree-item nav-file url-display' });
				const navUrlItem = navUrl.createDiv({ cls: 'tree-item-self is-clickable nav-file-title url-display-item' });
		
				const navUrlItemlink = navUrlItem.createEl("a", { cls: 'tree-item-inner nav-file-title-content url-display-link' });
				navUrlItemlink.setAttribute("href", currentUrl.link);
				navUrlItemlink.setAttr('draggable', 'false');

				if (this.plugin.settings.showFavicon) {
					if (currentUrl.icon) {
						const navUrlItemlinkImg = navUrlItemlink.createEl('img', { cls: 'url-display-img' });
						navUrlItemlinkImg.setAttribute("src", currentUrl.icon);
						navUrlItemlinkImg.setAttr('draggable', 'false');
					} else {
						// TS：Type 'null' is not assignable to type 'Node'.
						navUrlItemlink.appendChild(getIcon("globe") as Node);
					}
				}

				navUrlItemlink.createSpan({
					cls: 'url-display-text nav-file-title-content',
					text: this.plugin.settings.useAlias && currentUrl.alias.trim() !== "" ? currentUrl.alias : (currentUrl.title ? currentUrl.title : "Untitled"),
				});


				// 当用户点击图标则触发URL定位事件（根据URL先确定line、ch后滚动视图）
				const navUrlItemNavigation = navUrlItem.createDiv({ cls: 'url-display-optiion' });
				navUrlItemNavigation.appendChild(getIcon("navigation") as Node);
				navUrlItemNavigation.addEventListener('click', () => this.locateToUrl(currentUrl));


				/* const navUrlItemSearch = navUrlItem.createDiv({ cls: 'url-display-optiion' });
				navUrlItemSearch.appendChild(getIcon("search") as Node);

				const navUrlItemCopy = navUrlItem.createDiv({ cls: 'url-display-optiion' });
				navUrlItemCopy.appendChild(getIcon("copy") as Node); */


				/* navUrlItem.addEventListener('mouseover', (event: MouseEvent) => {
					this.app.workspace.trigger('hover-link', {
						event,
						source: UrlDisplayView,
						hoverParent: rootEl,
						targetEl: navFile,
						linktext: this.activeMarkdownView.file.path,
						state:{scroll: data[i][j].position.start.line}
					});
				}); */
			})

		}
		container.appendChild(rootEl);
	}


	private readonly parsing = (container: Element): void => {
		const rootEl = createDiv({ cls: 'nav-folder mod-root' });
		const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

		for (let index = 0; index < 3; index++) {
			const navUrl = childrenEl.createEl("div", { cls: 'tree-item nav-file url-display' });
			const navUrlItem = navUrl.createEl('div', { cls: 'tree-item-self is-clickable nav-file-title url-display-item' });
			const item = navUrlItem.createDiv({ cls: 'tree-item-inner nav-file-title-content url-display-link skeleton' });
			item.createDiv({ cls: 'url-display-content-img skeleton-square' });
			item.createDiv({ cls: 'url-display-content-text skeleton-line' });
		}

		container.appendChild(rootEl);
	}

	public readonly onHeaderMenu = (menu: Menu): void => {
		menu
			.addItem((item) => {
				item
					.setTitle('Refresh list')
					.setIcon('refresh-cw')
					.onClick(async () => {
						const currentMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (currentMarkdownView) {
							this.processor.process(currentMarkdownView);
						}
					});
			})
	}

	public readonly locateToUrl = (url: UrlParse): void => {
		// console.log("locateToUrl");
		// console.log(this.activeMarkdownView);

		// const cmEditor = activeLeafView.sourceMode.cmEditor;
		const cmEditor = this.activeMarkdownView.editor;
		const content = cmEditor.getValue();

		// 获取光标位置（用于验证）
		/* const doc = cmEditor.getDoc();
		const cursorPosition = doc.getCursor();  
		const lineText = doc.getLine(cursorPosition.line);
		console.log('Line:', cursorPosition.line, 'Column:', cursorPosition.ch);
		console.log('Line Text:', lineText); */

		const position = searchContent(content, url.link);
		if (position) {
			const startLocation = getLineAndColumn(content, position.start);
			const endLocation = getLineAndColumn(content, position.end);

			// Scroll the view to the specified location (just in edit mode)
			/* const from = { line: startLocation.line, ch: 0 };
			const to = { line: endLocation.line, ch: 0 };
			cmEditor.scrollIntoView({ from, to }, true); */

			this.activeMarkdownView.setEphemeralState({ line: startLocation.line });
		}
	}

	public override async onClose() {
		// Nothing to clean up.
	}
}
