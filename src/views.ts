import { WorkspaceLeaf, ItemView, Menu, getIcon } from "obsidian";

import UrlDisplayPlugin from "./main";
import { markdownProcessor } from "./processor"
import { VIEW_TYPE, SUPPORTED_VIEW_TYPE } from "./constants";

export class UrlDisplayView extends ItemView {
	private plugin: UrlDisplayPlugin;
	private processor: markdownProcessor;
	private eventListeners: Array<{ element: HTMLElement; handler: (event: MouseEvent) => void }> = [];

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
		const fileView = this.app.workspace.getActiveFileView();
		this.processor.process(fileView);
	}

	public readonly onHeaderMenu = (menu: Menu): void => {
		menu
			.addItem((item) => {
				item
					.setTitle('Refresh list')
					.setIcon('refresh-cw')
					.onClick(async () => {
						const fileView = this.app.workspace.getActiveFileView();
						this.processor.process(fileView);
					});
			})
	}

	public readonly updateDisplay = (): void => {
		const container = this.containerEl.children[1];
		container.empty();

		if (!SUPPORTED_VIEW_TYPE[this.processor.activeViewType]) {
			container.createDiv({ cls: 'pane-empty',  text: "The view type is currently not supported."});
			return;
		}

		if (!this.processor.isExtracting && !this.processor.activeNotehaveUrl) {
			container.createDiv({ cls: 'pane-empty',  text: "No valid URLs found."});
		}

		if (this.processor.isExtracting || this.processor.isParsing) {
			this.isParsing(container);
		}

		if (!this.processor.isParsing && this.processor.activeNoteUrlParse) {
			this.updateList(container);
		}
	}

	private readonly isParsing = (container: Element): void => {
		const rootEl = createDiv({ cls: 'nav-folder mod-root' });
		const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

		for (let index = 0; index < 3; index++) {
			const navUrl = childrenEl.createEl("div", { cls: 'tree-item nav-file' });
			const navUrlItem = navUrl.createEl('div', { cls: 'nav-file-title url-display-item' });
			const item = navUrlItem.createDiv({ cls: 'skeleton' });
			item.createDiv({ cls: 'skeleton-square' });
			item.createDiv({ cls: 'skeleton-line' });
		}

		container.appendChild(rootEl);
	}

	public readonly updateList = (container: Element): void => {
		this.removeEventListeners();

		const rootEl = createDiv({ cls: 'nav-folder mod-root' });
		const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

		if (this.processor.activeNoteUrlParse) {
			this.processor.activeNoteUrlParse.forEach((currentUrl) => {
				const navUrl = childrenEl.createDiv({ cls: 'tree-item nav-file' });
				const navUrlItem = navUrl.createDiv({ cls: 'nav-file-title url-display-item' });

				navUrlItem.setAttribute('data-alias', currentUrl.alias);
				navUrlItem.setAttribute('data-link', currentUrl.link);
				navUrlItem.setAttribute('data-title', String(currentUrl.title));
				navUrlItem.setAttribute('data-line', String(currentUrl.line));

				const handler = (event: MouseEvent) => this.handleMousedown(event);
				navUrlItem.addEventListener('mousedown', handler);
				this.eventListeners.push({ element: navUrlItem, handler });

				if (this.plugin.settings.showFavicon) {
					if (currentUrl.icon) {
						const navUrlItemImg = navUrlItem.createEl('img');
						navUrlItemImg.setAttribute("src", currentUrl.icon);
						navUrlItemImg.setAttr('draggable', 'false');
					} else {
						navUrlItem.appendChild(getIcon("globe") as Element);
					}
				} else {
					// navUrlItem.appendChild(getIcon("globe") as Element);
				}

				navUrlItem.createSpan({
					text: this.plugin.settings.useAlias && currentUrl.alias.trim() !== "" ? currentUrl.alias :
						(currentUrl.title ? currentUrl.title : "Untitled"),
				});

				const navUrlItemNavigation = getIcon("navigation") as Element;
				navUrlItem.appendChild(navUrlItemNavigation);
				navUrlItemNavigation.classList.add('url-display-navigation');
			})
		}
		container.appendChild(rootEl);
	}

	private readonly handleMousedown = (event: MouseEvent): void => {
		let currentElement = event.target as HTMLElement;
		const delegatedElement = event.currentTarget as HTMLElement;

		// scroll the view based on the URL line
		if (event.button === 0) {
			while (currentElement !== delegatedElement) {
				if (currentElement.classList.contains("url-display-navigation")) {
					window.open(delegatedElement.getAttribute('data-link') as string);
					return;
				}
				currentElement = currentElement.parentElement as HTMLElement;
			}
			if (this.processor.activeViewType === "markdown") {
				const line = Number(delegatedElement.getAttribute('data-line'));
				this.processor.activeView.setEphemeralState({ line });
			} 
			else if (this.processor.activeViewType === "kanban") {
				const linkElement = document.querySelector(`a[href="${delegatedElement.getAttribute('data-link')}"].external-link`);
				if (linkElement) { 
					linkElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: "center" });
					linkElement.classList.add('is-flashing');
					setTimeout(() => {
						linkElement.classList.remove('is-flashing');
					}, 1000);  
				}				
			}
			// else if (this.processor.activeViewType === "canvas") {
			// 	return;
			// }
		}

		// open link in browser
		else if (event.button === 1) {
			event.preventDefault();
			window.open(delegatedElement.getAttribute('data-link') as string);
		}
	}

	private readonly removeEventListeners = (): void => {
		this.eventListeners.forEach(({ element, handler }) => {
			element.removeEventListener('mousedown', handler);
		});
		this.eventListeners = [];
	}

	public override async onClose() {
		this.removeEventListeners();
	}
}

/* const navUrlItemSearch = getIcon("search") as Element;
navUrlItem.appendChild(navUrlItemSearch);
navUrlItemSearch.classList.add('url-display-search'); */
