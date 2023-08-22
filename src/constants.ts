/* eslint-disable no-useless-escape */

export const VIEW_TYPE = "url-display";

export const EXTERNAL_LINK = /(\[([^\[\]]+?)?\]\()?https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)\)?/g;
export const PARTITION = /\[(?<alias>.*?)\]\((?<link>.+?)\)/g;
export const SPECIAL = /(\?target=){1}(?<target>https?.*)/g;
export const EXCLUDE = /https?:\/\/.*?(apng|avif|bmp|gif|ico|jpeg|jpg|png|svg|tif|tiff|webp)/g;

export interface URLDisplaySettings {
    useAlias: boolean;
    showFavicon: boolean;
    DeduplicateURLs: boolean;
    cacheMode: string;
}

export const DEFAULT_SETTINGS: URLDisplaySettings = {
    useAlias: false,
    showFavicon: true,
    DeduplicateURLs: true,
    cacheMode: 'diskCache',
}

export interface URLParse {
    alias: string;
    link: string;
    title?: string;
    icon?: string;
}

export interface ResponseData {
    [key: string]: object | string | number,
}

export interface CacheData {
    title: string;
    icon: string;
}