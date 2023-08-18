/* interface Props {
    data: { [key: string]: number | string }[]
    changeCollapse: (args: string[]) => void
} */

import type { URLExtract } from './constants'

export function deduplicateObjArrByUniId(arr: Array<URLExtract>, uniId: string): Array<URLExtract> {
    const res = new Map();
    return arr.filter((item: object) => !res.has(item[uniId]) && res.set(item[uniId], 1));
}


