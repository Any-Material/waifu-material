// nodejs
import * as node_fs from "fs";
import * as node_path from "path";
// modules
import request from "@/modules/request";
import settings from "@/modules/settings";
import gallery, { GalleryBlock } from "@/modules/hitomi.la/gallery";
// states
import worker from "@/states/worker";
// api
import { BridgeEvent } from "@/api";

export class Download {
	constructor() {
		if (node_fs.existsSync("./bundles")) {
			for (const path of node_fs.readdirSync("./bundles")) {
				// cache
				const json = JSON.parse(node_fs.readFileSync(`./bundles/${path}`, "utf-8"));
				//
				// TaskFile contains special functions, however JSON doesn't
				//
				new Task({ ...json, files: json["files"].map((file: any) => {
					return new TaskFile({ ...file });
				})});
			}
			for (const task of Object.values(worker.state).filter((task) => { return task.status === TaskStatus.WORKING; }).take(settings.state.download.max_threads)) {
				task.start();
			}
		}
	}
	public async folder(id: number) {
		return new Promise<string>(async (resolve, reject) => {
			//
			// shortcut
			//
			if (worker.state[id]) {
				return resolve(node_path.dirname(worker.state[id].files.first!.path));
			}
			const block = await gallery.block(id);

			let folder = settings.state.download.placeholder;

			for (const key of Object.keys(block)) {
				folder = folder.replace(new RegExp(`{${key}}`), (block[key as keyof GalleryBlock] ?? `{${key}}`)?.toString());
			}
			return resolve(folder);
		});
	}
	public async download(id: number) {
		return new Promise<void>(async (resolve, reject) => {
			const script = await gallery.script(id);
			const folder = await this.folder(id);

			new Task({
				id: id,
				files: script.files.map((file) => {
					return new TaskFile({
						url: file.url,
						path: node_path.join(settings.state.download.directory, folder, file.name),
						size: 0
					});
				}),
				status: Object.values(worker.state).filter((task) => { return task.status === TaskStatus.WORKING }).length < settings.state.download.max_threads ? TaskStatus.WORKING : TaskStatus.QUEUED
			});

			switch (worker.state[id].status) {
				case TaskStatus.WORKING: {
					return resolve(worker.state[id].start());
				}
				default: {
					return resolve();
				}
			}
		});
	}
	public async delete(id: number) {
		return new Promise<void>(async (resolve, reject) => {
			// @ts-ignore
			node_fs.rmdirSync(node_path.dirname(worker.state[id]!.files.first!.path), { recursive: true });
			// halt writable(s)
			worker.state[id].cancel();
			// resolve
			return resolve();
		});
	}
}

export class Task {
	public readonly id: number;
	public readonly files: Array<TaskFile>;
	public status: TaskStatus;

	constructor(args: {
		id: number;
		files: Array<TaskFile>;
		status: TaskStatus;
	}) {
		this.id = args.id;
		this.files = args.files;
		this.status = args.status;
		// sync with worker
		worker.spawn(this);
	}
	public start() {
		return new Promise<void>((resolve, reject) => {
			// scan for unfinished files
			let files: Array<TaskFile> = this.files.filter((file) => { return !file.written(); });

			const recursive = (file: TaskFile): void => {
				// it may takes time
				return file.write(this.id, () => {
					// remove self
					files = files.filter((unfinished) => { return unfinished !== file; });

					if (!files.length) {
						return complete();
					}
					return recursive(files.first!);
				});
			}
			const complete = () => {
				// mark as finished
				this.status = TaskStatus.FINISHED;
				// notify
				worker.notify(this.id, this);

				for (const task of
					Object.values(worker.state).filter((task) => {
						task.status === TaskStatus.QUEUED
					}).take(settings.state.download.max_threads - Object.values(worker.state).filter((task) => {
						task.status === TaskStatus.WORKING
					}).length
				)) {
					task.start();
				}
				return resolve();
			}
			// all finished
			if (!files.length) {
				return complete();
			}
			if (this.status !== TaskStatus.WORKING) {
				// mark as working
				this.status = TaskStatus.WORKING;
				// notify
				worker.notify(this.id, this);
			}
			worker.handle((state) => {
				if (state.key === this.id && !state.value) return this.cancel();
			});
			window.bridge.handle(BridgeEvent.CLOSE, () => {
				return this.cancel();
			});
			// generate directory recursively
			node_fs.mkdirSync(node_path.dirname(files.first!.path), { recursive: true });

			for (const file of files.take(settings.state.download.max_working)) {
				recursive(file);
			}
		});
	}
	public cancel() {
		if (worker.state[this.id]) {
			worker.despawn(this);	
		}
	}
}

export class TaskFile {
	public readonly url: string;
	public readonly path: string;
	public size: number;

	constructor(args: {
		url: string;
		path: string;
		size: number;
	}) {
		this.url = args.url;
		this.path = args.path;
		this.size = args.size;
	}
	public stats() {
		return node_fs.statSync(this.path);
	}
	public written() {
		return this.size ? this.stats().size === this.size : false;
	}
	public write(id: number, callback?: () => void) {
		// write by chunk
		const writable = node_fs.createWriteStream(this.path);

		worker.handle((state) => {
			if (state.key === id && !state.value) return writable.end();
		});
		request.GET(this.url, {
			type: "arraybuffer",
			headers: this.size ? { "range": `bytes=${this.stats().size}-` } : {},
			progress: (chunk, progress) => {
				// update size
				this.size = progress.total;
				// write to disk
				writable.write(new Uint8Array(chunk as ArrayBuffer));
			}
		}).then((response) => {
			// finish
			return writable.end(callback);
		});
	}
}

export enum TaskStatus {
	QUEUED		= "QUEUED",
	WORKING		= "WORKING",
	FINISHED	= "FINISHED"
}

export default (
	new Download()
)
