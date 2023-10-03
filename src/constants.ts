/* eslint-disable no-useless-escape */
import type { UrlDisplaySettings } from "./types"

export const VIEW_TYPE = "url-display";
export const EXTERNAL_LINK = /(\[([^\[\]]+?)?\]\()?https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/='" ]*)\)?/g;
export const PARTITION = /\[(?<alias>.*?)\]\((?<link>.+?)\)/g;
export const SPECIAL = /\?target=([^&\s]+)/;
export const EXCLUDE = /\.(apng|avif|bmp|gif|ico|jpeg|jpg|png|svg|tif|tiff|webp)$/;

export const DEFAULT_SETTINGS: UrlDisplaySettings = {
    deduplicateUrls: true,
    useAlias: false,
    showFavicon: true,
    cacheMode: 'diskCache',
    noticeMode: 'both',
}

