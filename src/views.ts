import { WorkspaceLeaf, ItemView, Menu, getIcon, Notice } from "obsidian";

import UrlDisplayPlugin from "./main";
import { markdownProcessor } from "./processor"
import { VIEW_TYPE, SUPPORTED_VIEW_TYPE } from "./constants";
import { t } from "./lang/helper"

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
					.setTitle(t('Refresh URL pane'))
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
			container.createDiv({ cls: 'pane-empty',  text: t('No support')});
		}
		else if (!this.processor.isExtracting && !this.processor.activeNotehaveUrl) {
			container.createDiv({ cls: 'pane-empty',  text: t('No found')});
		}
		else if (this.processor.isExtracting || this.processor.isParsing) {
			this.isParsing(container);
		}
		else if (!this.processor.isParsing && this.processor.activeNoteUrlParse?.length !== 0) {
			this.updateList(container);
		}
		else {
			container.createDiv({ cls: 'pane-empty',  text: t('No found')});
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
				navUrlItem.setAttribute('data-title', currentUrl.title ? currentUrl.title : '');
				navUrlItem.setAttribute('data-line', String(currentUrl.line));
				
				// hover link preview
				if (this.plugin.settings.hoverLinkPreview) {
					// navUrlItem.ariaLabel = currentUrl.link;
					navUrlItem.setAttribute('aria-label', currentUrl.link);
				}

				// listen for locating and opening
				const handlerMousedown = (event: MouseEvent) => this.handleMousedown(event);
				navUrlItem.addEventListener('mousedown', handlerMousedown);
				this.eventListeners.push({ element: navUrlItem, handler: handlerMousedown });

				// listen for copying and global searching
				const handlerContextmenu = (event: MouseEvent) => this.handlerContextmenu(event);
				navUrlItem.addEventListener('contextmenu', handlerContextmenu);
				this.eventListeners.push({ element: navUrlItem, handler: handlerContextmenu });				

				// show favicon or indicator icon or none
				if (this.plugin.settings.showFavicon) {
					if (currentUrl.icon) {
						const navUrlItemImg = navUrlItem.createEl('img');
						navUrlItemImg.setAttribute("src", currentUrl.icon);
						navUrlItemImg.setAttr('draggable', 'false');
					} else {
						navUrlItem.appendChild(getIcon("globe") as Element);
					}
				} else if (this.plugin.settings.showIndicatorIcon) {
					navUrlItem.appendChild(getIcon("globe") as Element);
				}

				navUrlItem.createSpan({
					text: this.plugin.settings.useAlias && currentUrl.alias.trim() !== "" ? currentUrl.alias :
						(currentUrl.title ? currentUrl.title : t('Untitled')),
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

		// scroll the view based on the line of URL & open link in new browser tab (click icon)
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

		// open link in new browser tab (middle click)
		else if (event.button === 1) {
			event.preventDefault();
			window.open(delegatedElement.getAttribute('data-link') as string);
		}
	}

	private readonly handlerContextmenu = (event: MouseEvent): void => {
		const menu = new Menu();
		const delegatedElement = event.currentTarget as HTMLElement;

		menu.addItem((item) =>
			item
				.setTitle(t('Copy item'))
				.setIcon("copy")
				.onClick((event: PointerEvent) => {
					const copyLink = delegatedElement.getAttribute('data-link');
					if (this.plugin.settings.copyFormat === "inlineLink") {
						if (this.plugin.settings.useAlias) {
							const copyLink = delegatedElement.getAttribute('data-link');
							const copyAlias = delegatedElement.getAttribute('data-alias');
							navigator.clipboard.writeText(`[${copyAlias}](${copyLink})`);
						} else {
							const copyTitle = delegatedElement.getAttribute('data-title');
							navigator.clipboard.writeText(`[${copyTitle}](${copyLink})`);
						}
					} else {
						navigator.clipboard.writeText(copyLink!);
					}
					new Notice(t('Copy notice'));
				})
		);

		menu.addItem((item) =>
			item
				.setTitle(t('Search item'))
				.setIcon("search")
				.onClick((event: PointerEvent) => {
					const leaf = this.plugin.app.workspace.getLeavesOfType("search")[0];
					if (leaf) {
						const searchUrl = delegatedElement.getAttribute('data-link') as string;
						const searchText = searchUrl.replace(/https?:\/\//, '');
						// this.plugin.app.workspace.setActiveLeaf(leaf); use this can't reveal pane if the pane hided
						this.app.workspace.revealLeaf(leaf);
						let inputSearch = document.querySelector('input[type="search"]') as HTMLInputElement;
						if (inputSearch) {
							inputSearch.value = searchText;
							let searchEvent = new Event('input');
							inputSearch.dispatchEvent(searchEvent);
						}
					} else {
						new Notice(t('Search notice'));
					}
				})
		);

		menu.showAtMouseEvent(event);
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
