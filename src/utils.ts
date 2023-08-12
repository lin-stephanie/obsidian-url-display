
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Groups_and_backreferences#using_named_groups
/**
 * Represents a book.
 * @constructor
 * @param {any} str - 笔记内容.
 * @param {any} regex - 正则表达式.
 * @param {any} asyncFn - The author of the book.
 */
export async function replaceAsync(str: any, regex: any, asyncFn: any) {
    const promises: Promise<any>[] = [];
    str.replace(regex, (match: string, ...args: any) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

