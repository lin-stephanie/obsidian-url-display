import { WorkspaceLeaf, ItemView } from 'obsidian';
import URLDisplayPlugin from "./main";
import { VIEW_TYPE } from './constants'

export class URLDisplayView extends ItemView {
	private readonly plugin: URLDisplayPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: URLDisplayPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	public getIcon(): string {
		return 'external-link';
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "URL Display view";
	}

	async onOpen() {
		this.plugin.updateURL();
	}

	public readonly updateDisplay = () => {
		console.log("start updateDisplay")
		const container = this.containerEl.children[1];
		container.empty();

		if (this.plugin.isExtracting) {
			console.log("isExtracting")
			container.createEl("p", { text: "isExtracting..." });
		}

		if (!this.plugin.isExtracting && !this.plugin.activeNotehaveURL) {
			console.log("null activeNotehaveURL")
			container.createEl("p", { text: "No legal URLs found on this note 😄" });
		}

		if (this.plugin.isParsing) {
			console.log("isParsing")
			container.empty();
			container.createEl("p", { text: "isParsing..." });
		}

		if (!this.plugin.isParsing && this.plugin.activeNoteURLParse && !(this.plugin.activeNoteURLParse.length === 0)) {
			this.updateList();
		}
	}

	public readonly updateList = async (): Promise<void> => {
		console.log("start updateList")

		const rootEl = createDiv({ cls: 'nav-folder mod-root' });
		const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

		this.plugin.activeNoteURLParse.forEach((currentURL) => {
			// const navFile = childrenEl.createDiv({ cls: 'tree-item nav-file recent-files-file' });
			const navURL = childrenEl.createEl("div", { cls: 'tree-item nav-file url-display' });

			// const navFileTitle = navFile.createDiv({ cls: 'tree-item-self is-clickable nav-file-title recent-files-title' });
			const navURLItem = navURL.createEl('div', { cls: 'tree-item-self is-clickable nav-file-title url-display-item' });

			// const navFileTitleContent = navFileTitle.createDiv({ cls: 'tree-item-inner nav-file-title-content recent-files-title-content' });
			const navURLHrefContent = navURLItem.createEl("a", { cls: 'tree-item-inner nav-file-title-content url-display-content' });
			navURLHrefContent.setAttribute("href", currentURL.link);

			const navURLHrefContentImg = navURLHrefContent.createEl('img', { cls: 'url-display-content-img' });
			navURLHrefContentImg.setAttribute("src", currentURL.icon);

			navURLHrefContent.createEl("span", {
				text: this.plugin.settings.useAlias && currentURL.alias.trim() !== "" ? currentURL.alias : currentURL.title,
				cls: 'url-display-content-text',
			});
		})

		const container = this.containerEl.children[1];
		container.empty();
		container.appendChild(rootEl);
	}

	async onClose() {
		// Nothing to clean up.
	}
}

// 	async updateDisplay() {
// 		if (!this.plugin.activeNotehaveURL) {
// 			const container = this.containerEl.children[1];
// 			container.empty();
// 			container.createEl("p", { text: "No legal URLs found on this note 😄" });
// 		}

// 		// 显示进度

// 		// 更新UI
// 		// await this.plugin.parseActiveNoteURL(this.plugin.activeNoteURLExtract);
// 		// console.log(this.plugin.activeNoteURLParse);

// 		// this.update();


// 		// 形成视图
// 		const container = this.containerEl.children[1];
// 		container.empty();
// 		// 无URL提示
// 		if (this.plugin.activeNoteURLParse.length === 0) {
// 			container.createEl("p", { text: "No legal URLs found on this note 😄" });
// 		// 有URL显示
// 		} else {
// 			container.createEl("p", { text: String(this.plugin.activeNoteURLParse) });
// 		}
// }