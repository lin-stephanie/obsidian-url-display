import type { UrlDisplaySettings } from "./types"

export const VIEW_TYPE = "url-display";
export const URLREGEX = /\[([^\]]*?)\]\((http[s]?:\/\/[^)]+)\)|(http[s]?:\/\/[^\s]+)/g;
export const EXTERNAL_LINK = /(\[([^\[\]]+?)?\]\()?https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/='" ]*)\)?/g;
export const EXCLUDE = ['.avif', '.apng','.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.bmp', '.webp', '.mp4', '.avi', '.mkv', '.mov', '.flv', '.webm','.awebp', '.awebp?'];
export const SPECIAL = /\?target=([^&\s]+)/;

export const DEFAULT_SETTINGS: UrlDisplaySettings = {
    deduplicateUrls: false,
	ignoreFileProperty: true,
    useAlias: true,
    showFavicon: false,
    cacheMode: 'diskCache',
    noticeMode: 'none',
}

