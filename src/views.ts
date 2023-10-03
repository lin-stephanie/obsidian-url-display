import { WorkspaceLeaf, ItemView, Menu, getIcon, MarkdownView, TFile } from "obsidian";

import UrlDisplayPlugin from "./main";
import { markdownProcessor } from "./processor"
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
		if (currentMarkdownView) {
			this.processor.process(currentMarkdownView);
		}
	}

	public readonly update = (markdownView?: MarkdownView) => {
		if (markdownView) {
			this.activeMarkdownView = markdownView;
		}
		this.updateDisplay();
	}

	public readonly updateDisplay = () => {
		const container = this.containerEl.children[1];
		container.empty();

		if (this.plugin.processor.isExtracting) {
			// container.createEl("p", { text: "Extractiing..." });
			this.parsing(container);
		}

		if (!this.plugin.processor.isExtracting && !this.plugin.processor.activeNotehaveUrl) {
			console.log("none");
			container.createEl("p", { text: "No valid URL found in this note 😄" });
		}

		if (this.plugin.processor.isParsing) {
			// container.createEl("p", { text: "Parsing..." });
			this.parsing(container);
		}

		if (!this.plugin.processor.isParsing && this.plugin.processor.activeNoteUrlParse && !(this.plugin.processor.activeNoteUrlParse.length === 0)) {
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
				navUrlItem.setAttr('draggable', 'false');

				const navUrlItemlink = navUrlItem.createEl("a", { cls: 'tree-item-inner nav-file-title-content url-display-link' });
				navUrlItemlink.setAttribute("href", currentUrl.link);

				if (this.plugin.settings.showFavicon) {
					if (currentUrl.icon) {
						const navUrlItemlinkImg = navUrlItemlink.createEl('img', { cls: 'url-display-img' });
						navUrlItemlinkImg.setAttribute("src", currentUrl.icon);
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
				const navUrlItemAnchor = navUrlItem.createDiv({ cls: 'url-display-optiion' });
				// navUrlItemAnchor.appendChild(getIcon("flag-triangle-right") as Node);
				// navUrlItemAnchor.appendChild(getIcon("locate-fixed") as Node);
				navUrlItemAnchor.appendChild(getIcon("navigation") as Node);

				navUrlItemAnchor.addEventListener('click', () => this.locateToUrl(currentUrl));


				const navUrlItemAnchor2 = navUrlItem.createDiv({ cls: 'url-display-optiion' });
				navUrlItemAnchor2.appendChild(getIcon("search") as Node);

				const navUrlItemAnchor1 = navUrlItem.createDiv({ cls: 'url-display-optiion' });
				navUrlItemAnchor1.appendChild(getIcon("copy") as Node);


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
		console.log("locateToUrl");

		// 返回为当前打开的文件TFlie无view
		// const activeLeafView = this.plugin.app.workspace.getActiveFile();
		// 返回为null（因为在pane中点击的当前活跃视图不是MarkdownView而是UrlDisplayView）
		// const activeLeafView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// const activeLeafView = this.plugin.app.workspace.getLeavesOfType("markdown")[0].view;

		console.log(this.activeMarkdownView);

		// const cmEditor = activeLeafView.sourceMode.cmEditor;
		const cmEditor = this.activeMarkdownView.editor;
		// console.log(cmEditor);

		// const doc = cmEditor.getDoc();
		// const content = doc.getValue();
		const content = cmEditor.getValue();
		// console.log(text);

		// 获取光标位置（用于验证）
		// const cursorPosition = doc.getCursor();  
		// const lineText = doc.getLine(cursorPosition.line);
		// console.log('Line:', cursorPosition.line, 'Column:', cursorPosition.ch);
		// console.log('Line Text:', lineText);

		const position = this.searchContent(content, url.link);
		if (position) {
			const startLocation = this.getLineAndColumn(content, position.start);
			const endLocation = this.getLineAndColumn(content, position.end);

			// console.log(startLocation);
			// console.log(endLocation);

			// Scroll the view to the specified location (just in edit mode)
			// const from = { line: startLocation.line, ch: 0 };
			// const to = { line: endLine.line, ch: 0 };
			// cmEditor.scrollIntoView({ from, to }, true);

			this.activeMarkdownView.setEphemeralState({ line: startLocation.line });
		}
	}

	public readonly searchContent = (content: string, searchUrl: string) => {
		const start = content.indexOf(searchUrl);
		if (start === -1) return null;
		const end = start + searchUrl.length;

		return { start, end };
	}

	public readonly getLineAndColumn = (content: string, index: number) => {
		let line = 0;
		let ch = index;
		for (let i = 0; i < index; i++) {
			if (content[i] === '\n') {
				line++;
				ch = index - i - 1;
			}
		}
		return { line, ch };
	}


	public override async onClose() {
		// Nothing to clean up.
	}


	/* public readonly locateToUrl = (url: UrlParse): void => {
		const linkElement = document.querySelector(`a[href="${url.link}"].external-link`);

		console.log(url.alias);
		console.log(linkElement);

		if (linkElement) {
			const isInViewport = (element: Element) => {
				const bounding = element.getBoundingClientRect();
				return (
					bounding.top >= 0 &&
					bounding.left >= 0 &&
					bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
					bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
				);
			};

			if (!isInViewport(linkElement)) {
				linkElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}

			linkElement.classList.add('is-flashing');

			setTimeout(() => {
				linkElement.classList.remove('is-flashing');
			}, 1000);  
		}
	} */
}
