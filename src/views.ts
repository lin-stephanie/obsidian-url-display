import { WorkspaceLeaf, ItemView, Menu } from "obsidian";

import UrlDisplayPlugin from "./main";
import { VIEW_TYPE } from "./constants";

export class UrlDisplayView extends ItemView {
	private plugin: UrlDisplayPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: UrlDisplayPlugin) {
		super(leaf);
		this.plugin = plugin;
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
		this.plugin.updateUrl();
	}

	public readonly updateDisplay = () => {
		console.log("start updateDisplay")
		const container = this.containerEl.children[1];
		container.empty();

		if (this.plugin.isExtracting) {
			// container.createEl("p", { text: "Extractiing..." });
			this.parsing(container);
		}

		if (!this.plugin.isExtracting && !this.plugin.activeNotehaveUrl) {
			console.log("null activeNotehaveUrl")
			container.createEl("p", { text: "No legal URL found in this note 😄" });
		}

		if (this.plugin.isParsing) {
			console.log("isParsing");
			// container.createEl("p", { text: "Parsing..." });
			this.parsing(container);
		}

		if (!this.plugin.isParsing && this.plugin.activeNoteUrlParse && !(this.plugin.activeNoteUrlParse.length === 0)) {
			this.updateList(container);
		}
	}

	public readonly updateList = (container: Element): void => {
		console.log("start updateList")
		const rootEl = createDiv({ cls: 'nav-folder mod-root' });
		const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

		if (this.plugin.activeNoteUrlParse) {
			this.plugin.activeNoteUrlParse.forEach((currentUrl) => {
				const navUrl = childrenEl.createEl("div", { cls: 'tree-item nav-file url-display' });
				const navUrlItem = navUrl.createEl('div', { cls: 'tree-item-self is-clickable nav-file-title url-display-item' });
				const navUrlItemlink = navUrlItem.createEl("a", { cls: 'tree-item-inner nav-file-title-content url-display-link' });
				navUrlItemlink.setAttribute("href", currentUrl.link);

				if (this.plugin.settings.showFavicon) {
					const navUrlItemlinkImg = navUrlItemlink.createEl('img', { cls: 'url-display-img' });
					if (currentUrl.icon) {
						navUrlItemlinkImg.setAttribute("src", currentUrl.icon);
					}
				}

				navUrlItemlink.createSpan({
					cls: 'url-display-text',
					text: this.plugin.settings.useAlias && currentUrl.alias.trim() !== "" ? currentUrl.alias : (currentUrl.title ? currentUrl.title : "Untitled"),
				});
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
					.setTitle('Refresh Url')
					.setIcon('refresh-cw')
					.onClick(async () => {
						console.log("start refresh");
						this.plugin.initState();
						this.plugin.updateUrl();
						console.log("end refresh");
					});
			})
	}

	public override async onClose() {
		// Nothing to clean up.
	}
}