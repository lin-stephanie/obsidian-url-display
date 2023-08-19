/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Modified from https://github.com/Seraphli/obsidian-link-embed/blob/main/parser.ts
 */

import { requestUrl } from "obsidian";
import Mustache from 'mustache';
import type { ResponseData } from './constants'
import { getEncodedIcon, saveEncodedIcon } from "./utils";

export abstract class Parser {
	public api: string;

	public abstract process(data: ResponseData): {
		title: string;
		icon: string;
	};

	public async parse(url: string): Promise<{ title: string; icon: string }> {
		console.log('fetching', url);

		const requestAPI = Mustache.render(this.api, { url });
		const res = await requestUrl({ url: requestAPI });
		const data = res.json;
		console.log('res', data);

		return { ...this.process(data) };
	}
}

class JSONLinkParser extends Parser {
	constructor() {
		super();
		this.api = 'https://jsonlink.io/api/extract?url={{{url}}}';
	}
	public override process(data: any): { title: string; icon: string } {
		const title = data.title || '';
		const icon = data.images[0] || '';
		console.log('icon', icon);
		return { title, icon };
	}
}

class MicroLinkParser extends Parser {
	constructor() {
		super();
		this.api = 'https://api.microlink.io?url={{{url}}}&palette=true&audio=true&video=true&iframe=true';
	}
	public override process(data: any): { title: string; icon: string } {
		const title = data.data.title || '';
		const icon = data.data.logo?.url || data.data.image?.url || '';
		console.log('icon', icon);
		return { title, icon };
	}
}

class LocalParser extends Parser {
	public process(data: ResponseData): { title: string; icon: string; } {
		throw new Error("Method not implemented.");
	}

	private getTitle(doc: Document): string {
		let element = doc.querySelector('head meta[property="og:title"]');
		if (element instanceof HTMLMetaElement) {
			return element.content;
		}
		element = doc.querySelector('head title');
		if (element instanceof HTMLTitleElement) {
			return element.textContent ? element.textContent: '';
		} 
		return ''
	}

	private getIcon(doc: Document): string {
		let element = doc.querySelector('head link[rel="icon"]');
		if (element instanceof HTMLLinkElement) {
			return element.href;
		}
		element = doc.querySelector('head link[rel="shortcut icon"]');
		if (element instanceof HTMLLinkElement) {
			return element.href;
		}
		return '';
	}

	public override async parse(url: string): Promise<{ title: string; icon: string }> {
		console.log("localurl", url);

		const html = await requestUrl({ url: url });
		const text = html.text;
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'text/html');
		console.log('htmldoc', doc);

		const title = this.getTitle(doc);

		let icon = await getEncodedIcon(url);
		if (icon.trim() === "") {
			icon = await saveEncodedIcon(url)
		}

		return { title, icon };
	}
}

export const parsers: { [key: string]: Parser } = {
	jsonlink: new JSONLinkParser(),
	microlink: new MicroLinkParser(),
	local: new LocalParser(),
};
