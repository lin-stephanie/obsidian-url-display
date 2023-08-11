import { App, Editor, MarkdownView, Modal, Notice, Plugin, WorkspaceLeaf, ItemView } from 'obsidian';

import { VIEW_TYPE } from './constants'


export class URLDisplayView extends ItemView {

    singleNoteURL = [];

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}
    
    updateDisplay() {
        const container = this.containerEl.children[1];
		container.empty();
        
		container.createEl("h4", { text: "Example view" });
    }

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "URL Display view";
	}

	async onOpen() {
		this.updateDisplay();
	}

	async onClose() {
		// Nothing to clean up.
	}
}