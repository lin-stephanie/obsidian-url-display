import localforage from "localforage";
import { CacheData } from "./constants";

export class IndexedDBCache {
    private store: LocalForage;

    public constructor() {
        this.store = localforage.createInstance({
            name: "urldisplay-cache",
            storeName: "urlMetadata",
            driver: [localforage.INDEXEDDB],
            description: "Cache URL metadata."
        });
    }

	public async getUrlMetadata(url: string): Promise<CacheData | null | undefined> {
        try {
            const data = await this.store.getItem(url) as CacheData;
            // console.log('cacheData', data);
            return data;
        } catch (err) {
            console.log('getUrlMetadataErr', err);
        }
	}

	public async saveUrlMetadata(url: string, data: CacheData): Promise<void> {
        await this.store.setItem(url, {
            title: data.title,
            icon: data.icon,
        });
        // console.log('saveData', data);
	}
}
