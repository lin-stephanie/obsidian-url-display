export const VIEW_TYPE = "url-display-view";

/* eslint-disable no-useless-escape */

export const EXTERNAL_URL_PATTERN =/(\[([^\[\]]+?)?\]\()?https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)\)?/g

export const EXTERNAL_URL_OBJECT_PATTERN = /\[(?<text>.*?)\]\((?<link>.+?)\)/g


export interface URLDisplaySettings {
    removeDuplicateURLs: boolean;
    useTextInBracket: boolean;
    showFavicon: boolean;
}

export const DEFAULT_SETTINGS: URLDisplaySettings = {
    removeDuplicateURLs: true,
    useTextInBracket: false,
    showFavicon: true,
}

export interface URLObject {
    text: string;
    link: string;
}