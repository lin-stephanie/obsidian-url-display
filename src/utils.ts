import type { URLExtract } from './constants'

export function deduplicateObjArrByUniId(arr: URLExtract[], uniId: string): URLExtract[] {
    const res = new Map();
    return arr.filter((item: object) => !res.has(item[uniId]) && res.set(item[uniId], 1));
}


