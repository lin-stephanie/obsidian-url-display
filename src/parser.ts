import Mustache  from 'mustache';

interface RawData {
    [key: string]: object | string | number,
}

export abstract class Parser {
	api: string;
	debug: boolean;

	async parseUrl(url: string): Promise<RawData> {
		const parseUrl = Mustache.render(this.api, { url });
		console.log(`Fetching ${url}`);
		const res = await ajaxPromise({
			url: parseUrl,
		});
		const data = JSON.parse(res);
		return data;
	}

	abstract process(data: RawData): {
		title: string;
		logo: string;
		description: string;
	};

	async parse(url: string): Promise<{
		title: string;
		logo: string;
		description: string;
		url: string;
	}> {
		const rawData = await this.parseUrl(url);
		if (this.debug) {
			console.log('rawData', rawData);
		}
		return { ...this.process(rawData), url};
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
		let description: string = data.data.description || '';
		description = description.replace(/\n/g, ' ');
		return { title, logo, description };
	}
}

class IframelyParser extends Parser {
	constructor() {
		super();
		this.api = 'http://iframely.server.crestify.com/iframely?url={{{url}}}';
	}
	process(data: any): { title: string; logo: string; description: string } {
		const title = data.meta?.title || '';
		let logo;
		for (const link of data.links) {
			if (link["rel"].includes("icon")) {
				logo = link.href || '';
			}
			break;
		}
		let description: string = data.meta?.description || '';
		description = description.replace(/\n/g, ' ');
		return { title, logo, description };
	}
}

export const parseOptions = {
	microlink: 'MicroLink',
	iframely: 'Iframely',
};

export const parsers: { [key: string]: Parser } = {
	microlink: new MicroLinkParser(),
	iframely: new IframelyParser(),
};
