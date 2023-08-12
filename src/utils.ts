/* interface Props {
    data: { [key: string]: number | string }[]
    changeCollapse: (args: string[]) => void
} */

import { URLObject } from './constants'

export function deduplicateObjectArrByuniId(arr: URLObject[], uniId: string): URLObject[] {
    const res = new Map();
    return arr.filter((item: object) => !res.has(item[uniId]) && res.set(item[uniId], 1));
}


