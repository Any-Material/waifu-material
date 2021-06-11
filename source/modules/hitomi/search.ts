import worker from "@/statics/worker";
import request from "@/modules/request";
import favorite from "@/statics/favorite";

import { TaskStatus } from "@/modules/download";
import { RequestResponse } from "@/modules/request";
import { Prefix, Field, Tag, Computable } from "@/modules/hitomi/filter";

export type GalleryList = {
	size: number,
	array: number[],
	singular: boolean;
};

class Search {
	private collection: Record<string, number[]> = {};
	public get([computable, count]: [Computable, number], index: number, per_page: number) {
		return this.unknown_0([computable, count], index, per_page);
	}
	private unknown_0([computable, count]: [Computable, number], index: number, per_page: number) {
		// instance
		const I = this,
			// result
			nozomi = {
				array: {
					local: [] as number[],
					global: [] as number[]
				},
				size: 0,
				singular: is_SINGULAR()
			};
		function is_SINGULAR() {
			let singular = 0;

			for (const group of computable) {
				for (const fragment of group) {
					// avoid undefined
					if (!fragment) {
						continue;
					}
					for (const tag of fragment[0]) {
						if (tag[0] !== Prefix.EXCLUDE && tag[1] === Field.LANGUAGE && tag[2] === "all") {
							singular++;
						} else {
							return false;
						}
					}
				}
			}
			return singular === 1;
		}
		function get_URL(tag: Tag) {
			const [prefix, field, value] = tag;

			switch (field) {
				case Field.LANGUAGE: {
					return `https://ltn.hitomi.la/index-${value}.nozomi`;
				}
				case Field.MALE:
				case Field.FEMALE: {
					return `https://ltn.hitomi.la/tag/${field}:${value}-all.nozomi`;
				}
				default: {
					return `https://ltn.hitomi.la/${field}/${value}-all.nozomi`;
				}
			}
		}
		async function retrieve(tag: Tag) {
			const [prefix, field, value] = tag;

			switch (field) {
				case Field.ID: {
					return [Number(value)];
				}
				case Field.STATUS: {
					if (value == "favorite") {
						return Object.keys(favorite.get()).map((id) => Number(id));
					}
					// @ts-ignore
					const status: TaskStatus | undefined = TaskStatus[value.toUpperCase()];

					if (status === undefined) {
						return [];
					}
					return Object.values(worker.get()).filter((task) => { return task.status === status; }).map((task) => { return task.id; });
				}
				default: {
					const URL = get_URL(tag);

					if (!I.collection[URL]) {
						await request.GET(URL, { headers: nozomi.singular ? { "range": `bytes=${index * per_page * 4}-${index * per_page * 4 + per_page * 4 - 1}` } : {} }, "binary").then((response) => {
							switch (response.status.code) {
								case 200:
								case 206: {
									if (nozomi.singular) {
										// full length
										nozomi.size = Number((response.headers["content-range"]! as string).replace(/^bytes\s[0-9]+-[0-9]+\//, "")) / 4;
										// return without save
										return I.unknown_1(response);
									}
									I.collection[URL] = I.unknown_1(response);
									break;
								}
							}
						});
					}
					return I.collection[URL] ?? [];
				}
			}
		}
		function compute(prefix: Prefix, scope: "local" | "global", array: number[]) {
			switch (prefix) {
				case Prefix.AND: {
					if (!nozomi.array[scope].length) {
						nozomi.array[scope] = [...nozomi.array[scope], ...array];
						break;
					}
				}
				case Prefix.EXCLUDE: {
					const collection = new Set(array);
					nozomi.array[scope] = nozomi.array[scope].filter((id) => { return (prefix === Prefix.AND) === collection.has(id); });
					break;
				}
				case Prefix.INCLUDE: {
					nozomi.array[scope] = [...nozomi.array[scope], ...array];
					break;
				}
			}
		}
		return new Promise<GalleryList>(async (resolve, reject) => {
			/*
			follows are URL format.

			https://ltn.hitomi.la/index-{language}.nozomi
			https://ltn.hitomi.la/{field}/{value}-{language}.nozomi

			in conclusion, it's possible to optimize request response by provide specific {language} scope.
			however this will make extra complexity in understanding of codes thus I decided to do not.
			*/
			for (let x = 0; x < computable.length; x++) {
				for (let y = 0; y < computable[x].length; y++) {
					// avoid undefined
					if (!computable[x][y]) {
						continue;
					}
					nozomi.array.local = [];

					for (let z = 0; z < computable[x][y][1].length; z++) {
						compute(computable[x][y][1][z][0], "local", await retrieve(computable[x][y][1][z]));
					}
					compute(computable[x][y][0], "global", nozomi.array.local);
				}
			}
			if (!nozomi.array.global.length) {
				compute(Prefix.INCLUDE, "global", await retrieve([Prefix.INCLUDE, Field.LANGUAGE, "all"]));
			}
			return resolve({
				array: nozomi.array.global,
				size: nozomi.singular ? nozomi.size : nozomi.array.global.length,
				singular: nozomi.singular
			});
		});
	}
	private unknown_1(response: RequestResponse) {
		const binary: Buffer = new Buffer(response.encode, "binary");
		const endian: DataView = new DataView(binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength));
		const array: Array<number> = new Array(endian.byteLength / 4);

		for (let index = 0; index < endian.byteLength / 4; index++) {
			array[index] = endian.getInt32(index * 4, false);
		}
		return array;
	}
}
export default (new Search());
