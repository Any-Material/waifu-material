// modules
import request from "@/modules/request";
// modules/hitomi
import { Endian } from "@/modules/hitomi.la/suggest";
import { Computable, Prefix, Field, Tag } from "@/modules/hitomi.la/encode";
import bookmark from "@/states/bookmark";
import worker from "@/states/worker";

export class Search {
	public async get(compound: Array<Array<Computable>>, page: GalleryPage = new GalleryPage({ index: 0, limit: 25 })) {
		let global: GalleryList["list"] = [];
		let length: GalleryList["length"] = 0;
		let singular: GalleryList["singular"] = this.singularity(compound);

		function compute(prefix: Prefix, scope: Array<number>, list: Array<number>) {
			switch (prefix) {
				case Prefix.AND: {
					if (!global.length) {
						scope.add(...list);
					}
				}
				case Prefix.EXCLUDE: {
					const collection = new Set(list);
					scope = scope.filter((id) => (prefix === Prefix.AND) === collection.has(id));
					break;
				}
				case Prefix.INCLUDE: {
					scope.add(...list);
					break;
				}
			}
		}
		async function retrieve(tag: Tag) {
			switch (tag.field) {
				case Field.ID: {
					return [Number(tag.value)];
				}
				case Field.STATUS: {
					if (tag.value == "bookmark") {
						return Object.keys(bookmark.state).map((id) => Number(id));
					}
					return Object.values(worker.state).filter((task) => { return task.status === tag.value; }).map((task) => { return task.id; }) ?? [];
				}
				default: {
					const response = await request.GET(tag.url(), { type: "arraybuffer", headers: singular ? { "range": `bytes=${page.index * page.limit * 4}-${page.index * page.limit * 4 + page.limit * 4 - 1}` } : {} });
					const encode = Buffer.from(response.encode);

					switch (response.status.code) {
						/// OK (full-content)
						case 200:
						/// OK (partitial-content)
						case 206: {
							if (singular) {
								length = Number(response.headers["content-range"]!.replace(/^bytes\s[0-9]+-[0-9]+\//, "")) / 4;
							}
							const buffer: DataView = new DataView((encode.buffer as ArrayBuffer).skip(encode.byteOffset).take(encode.byteLength));
							const result: Array<number> = [];

							for (var index = 0; index < buffer.byteLength / 4; index++) {
								result.add(buffer.getInt32(index * 4, Endian.BIG));
							}
							return result;
						}
						default: {
							// throw new RangeError(`status code should either be 200 or 206, but received ${response.status.code}`);
							return [];
						}
					}
				}
			}
		}

		for (const x of compound) {
			for (const y of x) {
				/// store computable tags' id
				let local: Array<number> = [];

				for (const [prefix, tag] of y.tags) {
					compute(prefix, local, await retrieve(tag));
				}
				compute(y.prefix, global, local);
			}
		}
		if (!global.length) {
			singular = true;
			compute(Prefix.INCLUDE, global, await retrieve(new Tag({ field: Field.LANGUAGE, value: "all" })));
		}
		return new GalleryList({ list: global, length: singular ? length : global.length, singular: singular });
	}
	private singularity(compound: Array<Array<Computable>>) {
		let singular = 0;

		for (const x of compound) {
			for (const y of x) {
				for (const [prefix, tag] of y.tags) {
					if (prefix !== Prefix.EXCLUDE && tag.field === Field.LANGUAGE && tag.value === "all") {
						singular++;
					} else {
						return false;
					}
				}
			}
		}
		return singular == 1;
	}
}

export class GalleryList {
	public readonly list: Array<number>;
	public readonly length: number;
	public readonly singular: boolean;

	constructor(args: {
		list: GalleryList["list"];
		length: GalleryList["length"];
		singular: GalleryList["singular"];
	}) {
		this.list = args.list;
		this.length = args.length;
		this.singular = args.singular;
	}
}

export class GalleryPage {
	public readonly index: number;
	public readonly limit: number;

	constructor(args: {
		index: GalleryPage["index"];
		limit: GalleryPage["limit"];
	
	}) {
		this.index = args.index;
		this.limit = args.limit;
	}
}

export default (
	//
	// singleton
	//
	new Search()
)
