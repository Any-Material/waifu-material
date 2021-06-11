import request from "@/modules/request";
import utility from "@/modules/utility";

export type GalleryBlock = {
	id: number,
	type: string,
	title: string,
	language: string,
	thumbnail: [string, string];
	character?: string[],
	artist?: string[],
	series?: string,
	group?: string,
	tags?: string[],
	date: string;
};
export type GalleryFile = {
	name: string,
	hash: string,
	width: number,
	height: number,
	haswebp: boolean,
	hasavif: boolean,
	hasavifsmalltn: boolean;
};
export type GalleryJS = Merge<{
	id: string,
	title: string,
	japanese_title?: string,
	language: string,
	language_localname: string,
	files: GalleryFile[],
	tags?: {
		female?: number,
		male?: number,
		url: string,
		tag: string;
	}[],
	date: string;
}, {
	files: {
		url: string,
		width: number,
		height: number;
	}[];
}>;

class Read {
	public block(id: number) {
		return new Promise<GalleryBlock>((resolve, reject) => {
			const object: Record<string, any> = {};

			function recursive() {
				request.GET(`https://ltn.hitomi.la/galleryblock/${id}.html`).then((response) => {
					const parsed = new DOMParser().parseFromString(response.encode, "text/html");

					for (const [index, value] of (utility.parse(parsed, "td") as string[]).entries()) {
						if (index % 2) {
							object[Object.keys(object).pop()!] = utility.unwrap(value.split(/\s\s+/).filter((value) => { return value.length; }));
						} else {
							object[value.toLowerCase()] = undefined;
						}
					}
					for (const extractor of [{
						key: "title",
						selector: ".lillie a",
					},
					{
						key: "thumbnail",
						selector: "img",
						attribute: "src"
					},
					{
						key: "artist",
						selector: ".artist-list a",
					},
					{
						key: "date",
						selector: ".date",
					}]) {
						object[extractor.key] = utility.parse(parsed, extractor.selector, extractor.attribute);

						switch (extractor.key) {
							case "thumbnail": {
								object[extractor.key] = (object[extractor.key] as [string, string]).map((value) => { return "https:" + value; });
								break;
							}
						}
					}
					// resolve
					return resolve({ id: id, ...object } as GalleryBlock);
				}).catch(() => {
					return recursive();
				});
			}
			return recursive();
		});
	}
	public script(id: number) {
		const I = this;
		return new Promise<GalleryJS>((resolve, reject) => {
			function recursive() {
				request.GET(`https://ltn.hitomi.la/galleries/${id}.js`).then((response) => {
					switch (response.status.code) {
						case 404: {
							return reject();
						}
						default: {
							const script: GalleryJS = utility.extract(`${response.encode};`, "galleryinfo", "object");
							// resolve
							return resolve({
								...script,
								files: script.files.map((value, index) => {
									return {
										// @ts-ignore
										url: I.unknown_0(script.id, script.files[index]),
										width: value.width,
										height: value.height
									};
								})
							});
						}
					}
				}).catch(() => {
					return recursive();
				});
			}
			return recursive();
		});
	}
	/**
	 * @memberof common.js
	 * @see url_from_url_from_hash
	*/
	private unknown_0(id: number, image: GalleryFile, directory?: string, extension?: string, subdomain?: string) {
		return this.unknown_3(this.unknown_5(id, image, directory, extension), subdomain);
	}
	/**
	 * @memberof common.js
	 * @see subdomain_from_galleryid
	*/
	private unknown_1(value: number, number_of_frontends: number) {
		return String.fromCharCode(97 + (value % number_of_frontends));
	}
	/**
	 * @memberof common.js
	 * @see subdomain_from_url
	*/
	private unknown_2(url: string, subdomain: string = "b") {
		const match = /\/[0-9a-f]\/([0-9a-f]{2})\//.exec(url);

		if (!match) {
			return "a";
		}
		const offset = parseInt(match[1], 16);

		if (!isNaN(offset)) {
			return this.unknown_1(offset < 0x59 ? 1 : offset, offset < 0x80 ? 2 : 3) + subdomain;
		}
		return subdomain;
	}
	/**
	 * @memberof common.js
	 * @see url_from_url
	*/
	private unknown_3(url: string, subdomain?: string) {
		return url.replace(/\/\/..?\.hitomi\.la\//, `//${this.unknown_2(url, subdomain)}.hitomi.la/`);
	}
	/**
	 * @memberof common.js
	 * @see full_path_from_hash
	*/
	private unknown_4(hash: string) {
		if (hash.length < 3) {
			return hash;
		}
		return hash.replace(/^.*(..)(.)$/, "$2/$1/" + hash);
	}
	/**
	 * @memberof common.js
	 * @see url_from_hash
	*/
	private unknown_5(id: number, image: GalleryFile, directory?: string, extension?: string) {
		extension = extension || directory || image.name.split(/\./).pop();
		directory = directory || "images";

		return `https://a.hitomi.la/${directory}/${this.unknown_4(image.hash)}.${extension}`;
	}
}
export default (new Read());
