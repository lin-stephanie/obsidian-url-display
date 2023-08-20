/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Referenced and modified from:
 * https://github.com/Seraphli/obsidian-link-embed/blob/main/parser.ts 
 * https://github.com/joethei/obsidian-link-favicon/blob/master/src/IconAdder.ts
 */

import { requestUrl, arrayBufferToBase64 } from "obsidian";
import Mustache from 'mustache';

import type { ResponseData } from './constants'

abstract class Parser {
	public api: string;
	public readonly cacheMode: string;

	constructor(cacheMode: string) {
		this.cacheMode = cacheMode;
	}

	public abstract process(data: ResponseData, url: string): Promise<{ title: string; icon: string}>;

	public async parse(url: string): Promise<{ title: string; icon: string }> {
		console.log('fetching', url);
		const requestAPI = Mustache.render(this.api, { url });
		const res = await requestUrl({ url: requestAPI });
		const data = res.json;
		console.log('res', data);

		return { ...await this.process(data, url) };
	}

	public static async encodedIcon(icon: string): Promise<string> {
		const request = await requestUrl({ url: icon });
		const iconBase64 = "data:image/png;base64," + arrayBufferToBase64(request.arrayBuffer);

		return iconBase64;
	}
}

export class JSONLinkParser extends Parser {
	constructor(cacheMode: string) {
		super(cacheMode);
		this.api = 'https://jsonlink.io/api/extract?url={{{url}}}';
	}

	public override async process(data: any, url: string): Promise<{ title: string; icon: string}> {
		const title = (data.title || '');
		let icon = data.images[0] || '';

		console.log('icon', icon);
		if (this.cacheMode === "memoryCache") {
			console.log("start memoryCache");
			const iconBase64 = await Parser.encodedIcon(icon);
			icon = iconBase64;
		}

		return { title, icon };
	}
}

export class MicroLinkParser extends Parser {
	constructor(cacheMode: string) {
		super(cacheMode);
		this.api = 'https://api.microlink.io?url={{{url}}}&palette=true&audio=true&video=true&iframe=true';
	}

	public override async process(data: any, url: string): Promise<{ title: string; icon: string}> {
		const title = data.data.title || '';
		let icon = data.data.logo?.url || data.data.image?.url || '';

		console.log('icon', icon);
		if (this.cacheMode === "memoryCache") {
			console.log("start memoryCache");
			const iconBase64 = await Parser.encodedIcon(icon);
			icon = iconBase64;
		}

		return { title, icon };
	}
}

export class LocalParser extends Parser {
	public process(data: ResponseData): Promise<{ title: string; icon: string; }> {
		throw new Error("Method not implemented.");
	}

	private getTitle(doc: Document): string {
		let element = doc.querySelector('head meta[property="og:title"]');
		if (element instanceof HTMLMetaElement) {
			return element.content;
		}

		element = doc.querySelector('head title');
		if (element instanceof HTMLTitleElement) {
			return element.textContent ? element.textContent : '';
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
		const html = await requestUrl({ url: url });
		const text = html.text;
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'text/html');
		console.log('htmldoc', doc);

		const title = this.getTitle(doc);
		const icon = this.getIcon(doc);

		return { title, icon };
	}
}

export function parsers(parseType: string, cacheMode: string) {
	switch (parseType) {
		case 'jsonlink':
			return new JSONLinkParser(cacheMode);
		case 'microlink':
			return new MicroLinkParser(cacheMode);
		case 'local':
			return new LocalParser(cacheMode);
		default:
			return new JSONLinkParser(cacheMode);
	}
}