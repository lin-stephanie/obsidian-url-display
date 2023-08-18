import { requestUrl} from "obsidian";
import Mustache  from 'mustache';

interface ResponseData {
    [key: string]: object | string | number,
}

export abstract class Parser {
	api: string;

	abstract process(data: ResponseData): {
		title: string;
		logo: string;
		description: string;
	};

	async parse(url: string): Promise<{
		title: string;
		logo: string;
		description: string;
	}> {
		console.log(`Fetching ${url}`);

		const requestAPI = Mustache.render(this.api, { url });
		const res = await requestUrl({url: requestAPI});
		if (res.status !== 200) {
			return Promise.reject("server returned status code" + res.status + " for " + url);
		}
		const data = res.json;
		console.log('res', data);
		return { ...this.process(data)};
	}
}

class MicroLinkParser extends Parser {
	constructor() {
		super();
		this.api = 'https://api.microlink.io?url={{{url}}}&palette=true&audio=true&video=true&iframe=true';
	}
	process(data: any): { title: string; logo: string; description: string } {
		const title = (data.data.title || '');
		const logo = data.data.logo?.url || data.data.image?.url || '';
		const description = (data.data.description || '').replace(/\n/g, ' ');
		console.log(logo);
		return { title, logo, description };
	}
}

export const parsers: { [key: string]: Parser } = {
	microlink: new MicroLinkParser(),
};
