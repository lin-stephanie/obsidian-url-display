/* eslint-disable no-useless-escape */

export const VIEW_TYPE = "url-display";
export const EXTERNAL_URL_PATTERN = /(\[([^\[\]]+?)?\]\()?https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)\)?/g;
export const EXTERNAL_URL_OBJECT_PATTERN = /\[(?<alias>.*?)\]\((?<link>.+?)\)/g;
export const IDENTIFY_TARGET_URL = /(\?target=){1}(?<target>https?.*)/g;

export interface URLDisplaySettings {
    removeDuplicateURLs: boolean;
    useAliasInBracket: boolean;
    showFavicon: boolean;
}

export const DEFAULT_SETTINGS: URLDisplaySettings = {
    removeDuplicateURLs: true,
    useAliasInBracket: false,
    showFavicon: true,
}

export interface URLExtract {
    alias: string;
    link: string;
}

export interface URLParse {
    alias: string;
    link: string;
    title: string;
    logo: string;
}