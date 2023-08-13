/* interface Props {
    data: { [key: string]: number | string }[]
    changeCollapse: (args: string[]) => void
} */

import type { URLObject } from './constants'

export function deduplicateObjectArrByuniId(arr: Array<URLObject>, uniId: string): Array<URLObject> {
    const res = new Map();
    return arr.filter((item: object) => !res.has(item[uniId]) && res.set(item[uniId], 1));
}


