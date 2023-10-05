import { WorkspaceLeaf, ItemView, Menu, getIcon, MarkdownView, TFile } from "obsidian";

import UrlDisplayPlugin from "./main";
import { markdownProcessor } from "./processor"
import { VIEW_TYPE } from "./constants";

export class UrlDisplayView extends ItemView {
	private plugin: UrlDisplayPlugin;
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
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		this.processor.process(markdownView);
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

	public readonly updateDisplay = () => {
		const container = this.containerEl.children[1];
		container.empty();

		if (!this.processor.isExtracting && !this.processor.activeNotehaveUrl) {
			container.createEl("p", { text: "No valid URL found 😄" });
		}

		if (this.processor.isExtracting || this.processor.isParsing) {
			this.isParsing(container);
		}

		if (!this.processor.isParsing && this.processor.activeNoteUrlParse) {
			this.updateList(container);
		}
	}

	public readonly updateList = (container: Element): void => {

		const rootEl = createDiv({ cls: 'nav-folder mod-root' });
		const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

		if (this.processor.activeNoteUrlParse) {
			this.processor.activeNoteUrlParse.forEach((currentUrl) => {
				// console.log("updateList");
				const navUrl = childrenEl.createDiv({ cls: 'tree-item nav-file url-display' });
				const navUrlItem = navUrl.createDiv({ cls: 'tree-item-self is-clickable nav-file-title url-display-item' });

				navUrlItem.setAttribute('data-alias', String(currentUrl.alias));
				navUrlItem.setAttribute('data-link', String(currentUrl.link));
				navUrlItem.setAttribute('data-title', String(currentUrl.title));
				navUrlItem.setAttribute('data-line', String(currentUrl.line));

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


				// click then scroll the view based on the URL line
				const navUrlItemNavigation = navUrlItem.createDiv({ cls: 'url-display-navigation' });
				navUrlItemNavigation.appendChild(getIcon("navigation") as Node);

				navUrlItem.addEventListener('click', (event) => this.locateToUrl(event));
			})
		}
		container.appendChild(rootEl);
	}

	private readonly isParsing = (container: Element): void => {
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

	public readonly locateToUrl = (event: MouseEvent): void => {
		const delegateElement = event.currentTarget as HTMLElement;;
		const line = Number(delegateElement.getAttribute('data-line'));
		// console.log("line", line);
		this.processor.activeMarkdownView?.setEphemeralState({ line });
	}

	public override async onClose() {
		// Nothing to clean up.
	}
}


/* const navUrlItemSearch = navUrlItem.createDiv({ cls: 'url-display-optiion' });
navUrlItemSearch.appendChild(getIcon("search") as Node);

const navUrlItemCopy = navUrlItem.createDiv({ cls: 'url-display-optiion' });
navUrlItemCopy.appendChild(getIcon("copy") as Node); */
