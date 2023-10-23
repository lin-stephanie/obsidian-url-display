export interface UrlDisplaySettings {
	deduplicateUrls: boolean;
	ignoreFileProperty: boolean;
	useAlias: boolean;
	showFavicon: boolean;
	showIndicatorIcon: boolean;
	cacheMode: string;
	noticeMode: string;
}

export interface UrlParse {
	alias: string;
	link: string;
	title?: string;
	icon?: string;
	line: number;
	ch?: number;
}

export interface ResponseData {
	[key: string]: object | string | number,
}

export interface CacheData {
	title: string;
	icon: string;
}
