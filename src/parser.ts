/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Referenced and modified from:
 * https://github.com/Seraphli/obsidian-link-embed/blob/main/parser.ts 
 */

import { requestUrl, arrayBufferToBase64 } from "obsidian";
import Mustache from "mustache";

import URLDisplayPlugin from "./main";
import { IndexedDBCache } from "./cache";
import type { ResponseData, CacheData } from "./constants";

abstract class Parser {
	public api: string;
	public plugin: URLDisplayPlugin;
	public cache: IndexedDBCache

	constructor(plugin: URLDisplayPlugin, cache: IndexedDBCache) {
		this.plugin = plugin;
		this.cache = cache;
	}

	public async parse(url: string): Promise<CacheData> {
		console.log('parse', url);

		const cacheData = await this.cache.getUrlMetadata(url);
		if (cacheData) {
			if (this.plugin.settings.cacheMode === "memoryCache") {
				console.log("start memoryCache");
				return { title: cacheData.title, icon: await Parser.encodedIcon(cacheData.icon) };
			} 
			return { ...cacheData };
		} 

		console.log('start api');
		const requestAPI = Mustache.render(this.api, { url });
		const res = await requestUrl({ url: requestAPI });
		const resData = res.json;
		const processData = await this.process(resData);
		console.log('end api');
		
		await this.cache.saveUrlMetadata(url, processData);

		if (this.plugin.settings.cacheMode === "memoryCache") {
			console.log("start memoryCache");
			return { title: processData.title, icon: await Parser.encodedIcon(processData.icon) };
		}

		return { ...processData };
	}

	public abstract process(data: ResponseData): Promise<CacheData>;

	public static async encodedIcon(icon: string): Promise<string> {
		const request = await requestUrl({ url: icon });
		const iconBase64 = "data:image/png;base64," + arrayBufferToBase64(request.arrayBuffer);

		return iconBase64;
	}
}

export class MicroLinkParser extends Parser {
	constructor(plugin: URLDisplayPlugin, cache: IndexedDBCache) {
		super(plugin, cache);
		this.api = 'https://api.microlink.io?url={{{url}}}&palette=true&audio=true&video=true&iframe=true';
	}

	public override async process(data: any): Promise<CacheData> {
		const title = data.data.title || "Untitled";
		const icon = data.data.logo?.url || data.data.image?.url || "";
		console.log('title', title);
		console.log('icon', icon);

		return { title, icon };
	}
}

export class JSONLinkParser extends Parser {
	constructor(plugin: URLDisplayPlugin, cache: IndexedDBCache) {
		super(plugin, cache);
		this.api = 'https://jsonlink.io/api/extract?url={{{url}}}';
	}

	public override async process(data: any): Promise<{ title: string; icon: string}> {
		const title = data.title || "Untitled";
		const icon = data.images[0] || "";
		console.log('title', title);
		console.log('icon', icon);

		return { title, icon };
	}
}