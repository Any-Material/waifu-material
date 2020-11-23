import hitomi from "@/modules/hitomi";
import utility from "@/modules/utility";

import { Scheme, Schema } from "@/scheme";
import { Filter, GalleryBlock } from "@/modules/hitomi";

export type Session = {
	history: {
		filter: Filter,
		index: number;
	}[],
	index: number;
};

class History extends Schema<Session> {
	public get(): { filter: Filter, index: number; } {
		return this.$get().history[this.$get().index] || { filter: [], index: 0 };
	}
	public set(value: { filter: Filter, index: number; }): void {
		const history = [...this.$get().history.slice(0, this.$get().index), value];

		this.$set({ history: history, index: utility.clamp(this.$get().index + 1, 0, history.length - 1) });
	}
	public forward(): void {
		return this.$set({ ...this.$get(), index: this.$get().index + 1 });
	}
	public backward(): void {
		return this.$set({ ...this.$get(), index: this.$get().index - 1 });
	}
	public iterable(): Promise<GalleryBlock[]> {
		return new Promise<GalleryBlock[]>((resolve, rejects) => {
			// size and index only matters if SINGULAR equals true
			hitomi.search(this.get().filter, { size: 25, index: this.get().index }).then((archive) => {
				const array: Array<GalleryBlock> = new Array(Math.min(archive.array.length, 25));
				// loop 25 or less times
				for (let index: number = 0; index < array.length; index++) {
					hitomi.block(archive.array[index + (archive.singular ? 0 : 25 * this.get().index)]).then((block) => {
						// assign
						array[index] = block;
						// none-async resolve
						if (Object.keys(array).length === array.length) {
							return resolve(array);
						}
					});
				}
			});
		});
	}
}
export default (new History({ history: [], index: 0 }, Scheme.HISTORY));
