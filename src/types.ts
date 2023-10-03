export interface UrlDisplaySettings {
    deduplicateUrls: boolean;
    useAlias: boolean;
    showFavicon: boolean;
    cacheMode: string;
    noticeMode: string;
}

export interface UrlParse {
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
