/* eslint-disable no-useless-escape */

export const VIEW_TYPE = "url-display";
export const EXTERNAL_URL_PATTERN = /(\[([^\[\]]+?)?\]\()?https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)\)?/g;
export const EXTERNAL_URL_OBJECT_PATTERN = /\[(?<alias>.*?)\]\((?<link>.+?)\)/g;
export const IDENTIFY_TARGET_URL = /(\?target=){1}(?<target>https?.*)/g;

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

export interface URLExtract {
    alias: string;
    link: string;
}

export interface URLParse {
    alias: string;
    link: string;
    title: string;
    icon: string;
}

export interface ResponseData {
    [key: string]: object | string | number,
}