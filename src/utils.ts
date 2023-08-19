import ls from "localstorage-slim";
import { requestUrl, arrayBufferToBase64 } from "obsidian";
import type { URLExtract } from './constants'

export function deduplicateObjArrByUniId(arr: URLExtract[], uniId: string): URLExtract[] {
    const res = new Map();
    return arr.filter((item: object) => !res.has(item[uniId]) && res.set(item[uniId], 1));
}

export async function getEncodedIcon(url: string): Promise<string>  {
    const hostname = new URL(url).hostname;
    const name = "icon-" + hostname;
    const icon = ls.get<string>(name);
    if (icon) {
        return icon;
    }
    return '';
}

export async function saveEncodedIcon(url: string): Promise<string>  {
    const hostname = new URL(url).hostname;
    const name = "icon-" + hostname;
    // const iconURL = "https://favicon.splitbee.io/?url=" + hostname;
    const iconURL = "https://icons.duckduckgo.com/ip3/" + hostname + ".ico";
    const request = await requestUrl({url: iconURL});
    const icon = "data:image/png;base64," + arrayBufferToBase64(request.arrayBuffer);
    ls.set<string>(name, icon, {ttl: 30 * 24 * 60 * 60});

    return icon;
}