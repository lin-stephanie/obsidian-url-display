import type { UrlDisplaySettings } from "./types"

export const VIEW_TYPE = "url-display";
export const URLREGEX = /\[([^\]]*?)\]\((http[s]?:\/\/[^)]+)\)|(http[s]?:\/\/[^\s<`]+)/g;
export const EXCLUDE = ['.avif', '.apng', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.bmp', '.webp', '.mp4', '.avi', '.mkv', '.mov', '.flv', '.webm', '.awebp', '.awebp?'];
export const SPECIAL = /\?target=([^&\s]+)/;

export const DEFAULT_SETTINGS: UrlDisplaySettings = {
	deduplicateUrls: false,
	ignoreFileProperty: true,
	useAlias: true,
	showFavicon: false,
	showIndicatorIcon: true,
	hoverLinkPreview: true,
	copyFormat: 'inlineLink',
	cacheMode: 'diskCache',
	noticeMode: 'none',
}

export const SUPPORTED_VIEW_TYPE: { [key: string]: boolean } = {
	markdown: true,
	kanban: true,
	// canvas: true,
}
