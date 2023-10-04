export function deduplicateObjArrByUniId<T>(arr: T[], uniId: keyof T): T[] {
	const res = new Map();
	return arr.filter((item) => !res.has(item[uniId]) && res.set(item[uniId], 1));
}

export function searchContent(content: string, searchUrl: string) {
	const start = content.indexOf(searchUrl);
	if (start === -1) return null;
	const end = start + searchUrl.length;

	return { start, end };
}

export function getLineAndColumn (content: string, index: number) {
	let line = 0;
	let ch = index;
	for (let i = 0; i < index; i++) {
		if (content[i] === '\n') {
			line++;
			ch = index - i - 1;
		}
	}
	return { line, ch };
}
