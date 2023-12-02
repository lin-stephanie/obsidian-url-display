import { WorkspaceLeaf, ItemView, Menu, getIcon, Notice, setIcon } from "obsidian";

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
		this.drawNavHead(this.contentEl); 
		console.log("open", this.processor.lockView)
		if (this.processor.lockView) {
			this.processor.process(this.processor.lockView, true);
		} else {
			const fileView = this.app.workspace.getActiveFileView();
			this.processor.process(fileView, false);
		}
	}

	/* public readonly onHeaderMenu = (menu: Menu): void => {
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
	} */

	public readonly onPaneMenu = (menu: Menu): void => {
		// source: sidebar-context-menu
		menu
			.addItem((item) => {
				item
					.setTitle(t('Close'))
					.setIcon('x')
					.onClick(() => this.plugin.app.workspace.detachLeavesOfType(VIEW_TYPE));
			})
	}

	public readonly drawNavHead = (viewContent: Element): void => {
		const navHeader = createDiv("nav-header");
		const navButtonContainer = navHeader.createDiv("nav-buttons-container");

		// add icon for refresh
		const navActionButtonRefresh = navButtonContainer.createDiv("clickable-icon nav-action-button");
		navActionButtonRefresh.ariaLabel = t('Refresh URL pane');
		// navActionButtonRefresh.appendChild(getIcon("refresh-cw")!);
		setIcon(navActionButtonRefresh, "refresh-cw");

		navActionButtonRefresh.addEventListener("click", (event: MouseEvent) => {
			const isSameView = this.processor.lockView === this.processor.activeView;
			console.log(this.processor.lockView)
			console.log(this.processor.activeView)
			if (!this.processor.lockView) {
				const fileView = this.app.workspace.getActiveFileView();
				this.processor.process(fileView, false);
			} 
			else if (isSameView) {
				this.processor.process(this.processor.lockView, true);
			} else {
				new Notice(t('Unable to refresh'));
			}
		});

		// add icon to lock the view (remains unchanged)
		const navActionButtonLock = navButtonContainer.createDiv("clickable-icon nav-action-button url-dispaly-lock");
		navActionButtonLock.ariaLabel = t('Lock URL pane');

		if (this.processor.lockView) {
			setIcon(navActionButtonLock, "lock");	
			navActionButtonLock.classList.add('is-active');
		} else {
			setIcon(navActionButtonLock, "unlock");	
		}

		navActionButtonLock.addEventListener("click", (event: MouseEvent) => {
			if (!this.processor.lockView){
				setIcon(navActionButtonLock, "lock");	
				navActionButtonLock.classList.add('is-active');
				this.processor.lockView = this.processor.activeView;
			} else {
				setIcon(navActionButtonLock, "unlock");	
				navActionButtonLock.classList.remove('is-active');
				this.processor.lockView = null;
				const fileView = this.plugin.app.workspace.getActiveFileView(); 
				this.processor.process(fileView, false);
			}
		});
		
		viewContent.appendChild(navHeader);

		const navContent = createDiv("nav-folder mod-root");
		viewContent.appendChild(navContent);
	}

	public readonly updateDisplay = (): void => {
		const navContent = this.contentEl.children[1];
		navContent.empty();
		console.log(SUPPORTED_VIEW_TYPE.includes(this.processor.activeViewType))
		console.log(this.processor.activeViewType)
		if (!SUPPORTED_VIEW_TYPE.includes(this.processor.activeViewType)) {
			console.log(1)
			navContent.createDiv({ cls: 'pane-empty',  text: t('No support')});
		}
		else if (!this.processor.isExtracting && !this.processor.activeNotehaveUrl) {
			console.log(2)
			navContent.createDiv({ cls: 'pane-empty',  text: t('No found')});
		}
		else if (this.processor.isExtracting || this.processor.isParsing) {
			console.log(3)
			this.isParsing(navContent);
		}
		else if (!this.processor.isParsing && this.processor.activeNoteUrlParse?.length !== 0) {
			console.log(4)
			this.updateList(navContent);
		}
		else {
			console.log(0)
			navContent.createDiv({ cls: 'pane-empty',  text: t('No found')});
		}
	}

	private readonly isParsing = (navContent: Element): void => {
		const navChildren = navContent.createDiv('nav-folder-children');

		for (let index = 0; index < 3; index++) {
			const navUrl = navChildren.createDiv('tree-item nav-file');
			const navUrlItem = navUrl.createDiv('nav-file-title url-display-item');
			const item = navUrlItem.createDiv('skeleton');
			item.createDiv('skeleton-square');
			item.createDiv('skeleton-line');
		}

		navContent.appendChild(navChildren);
	}

	public readonly updateList = (navContent: Element): void => {
		this.removeEventListeners();
		const navChildren = navContent.createDiv('nav-folder-children');

		if (this.processor.activeNoteUrlParse) {
			this.processor.activeNoteUrlParse.forEach((currentUrl) => {
				const navUrl = navChildren.createDiv({ cls: 'tree-item nav-file' });
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

		navContent.appendChild(navChildren);
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
