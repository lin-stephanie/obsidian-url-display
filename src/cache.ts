import localforage from "localforage";
import { CacheData } from "./constants";

export class IndexedDBCache {
    private store: LocalForage;

    public constructor() {
        console.log("start IndexedDBCache")
        this.store = localforage.createInstance({
            name: "urldispaly-cache",
            storeName: "urlMetadata",
            driver: [localforage.INDEXEDDB],
            description: "Cache URL metadata."
        });
        console.log("end IndexedDBCache")
    }

	public async getUrlMetadata(url: string): Promise<CacheData | null | undefined> {
        try {
            console.log('start getcache');
            const data = await this.store.getItem(url) as CacheData;
            console.log('cacheData', data);
            console.log('end getcache');
            return data;
        } catch (err) {
            console.log(err);
        }
	}

	public async saveUrlMetadata(url: string, data: CacheData): Promise<void> {
        console.log('start savecache');
        await this.store.setItem(url, {
            title: data.title,
            icon: data.icon,
        });
        console.log('saveData', data);
        console.log('end savecache');
	}
}
