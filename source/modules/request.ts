export class Request {
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
	 */
	public async send(args: RequestOptions, progress?: (chunk: any, progress: ProgressEvent<XMLHttpRequestEventTarget>) => void) {
		return new Promise<RequestResponse>((resolve, reject) => {
			const http = {
				xhr: new XMLHttpRequest(),
				index: 0,
				headers: <Record<string, string>>{}
			};
			// ready
			http.xhr.open(args.request.method, args.request.url, true);
			// set data type
			http.xhr.responseType = args.request.type;

			for (const key of Object.keys(args.partial.headers ?? {})) {
				http.xhr.setRequestHeader(key, args.partial.headers![key]);
			}
			http.xhr.addEventListener("readystatechange", (ev) => {
				if (http.xhr.readyState === http.xhr.HEADERS_RECEIVED) {
					/**
					 * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getAllResponseHeaders
					 */
					for (const header of http.xhr.getAllResponseHeaders().trim().split(/[\r\n]+/)) {
						// 0: key
						// 1: value
						const fragment = header.split(/:\s/) as [string, string];
	
						http.headers[fragment[0]] = fragment[1];
					}
					// redirects
					if (http.headers["location"] && (args.partial.max_redirects ?? 10) > (args.private.redirects ?? 0)) {
						return this.send(
							new RequestOptions({
								...args,
								request: {
									...args.request,
									url: http.headers["location"]
								},
								private: {
									...args.private,
									redirects: (args.private.redirects ?? 0) + 1
								}
							}
						),
						progress);
					}
				}
			});
			http.xhr.addEventListener("load", () => {
				return resolve(new RequestResponse({
					encode: http.xhr.response,
					status: {
						code: http.xhr.status,
						message: http.xhr.statusText
					},
					headers: http.headers
				}));
			});
			http.xhr.addEventListener("progress", (progression) => {
				if (http.xhr.response && progress) {
					switch (args.request.type) {
						case "arraybuffer": {
							progress((http.xhr.response as ArrayBuffer).skip(http.index), progression);
							http.index = (http.xhr.response as ArrayBuffer).byteLength;
							break;
						}
						case "blob": {
							throw new Error("Unimplemented");
						}
						case "document": {
							throw new Error("Unimplemented");
						}
						case "json": {
							throw new Error("Unimplemented");
						}
						case "text": {
							throw new Error("Unimplemented");
						}
					}
				}
			});
			http.xhr.addEventListener("error", () => {
				return reject(http.xhr);
			});
			http.xhr.addEventListener("abort", () => {
				return reject(http.xhr);
			});
			// fire
			http.xhr.send();
		});
	}
	public GET(url: string, args?: { type?: XMLHttpRequestResponseType, headers?: Record<string, string>, progress?: (chunk: any, progress: ProgressEvent<XMLHttpRequestEventTarget>) => void }) {
		return this.send(new RequestOptions({ request: { url: url, type: args?.type ?? "text", method: "GET" }, partial: { headers: args?.headers, max_redirects: 10 }, private: { redirects: 0 } }), args?.progress);
	}
	public PUT(url: string, args?: { type?: XMLHttpRequestResponseType, headers?: Record<string, string>, progress?: (chunk: any, progress: ProgressEvent<XMLHttpRequestEventTarget>) => void }) {
		return this.send(new RequestOptions({ request: { url: url, type: args?.type ?? "text", method: "PUT" }, partial: { headers: args?.headers, max_redirects: 10 }, private: { redirects: 0 } }), args?.progress);
	}
	public POST(url: string, args?: { type?: XMLHttpRequestResponseType, headers?: Record<string, string>, progress?: (chunk: any, progress: ProgressEvent<XMLHttpRequestEventTarget>) => void }) {
		return this.send(new RequestOptions({ request: { url: url, type: args?.type ?? "text", method: "POST" }, partial: { headers: args?.headers, max_redirects: 10 }, private: { redirects: 0 } }), args?.progress);
	}
	public DELETE(url: string, args?: { type?: XMLHttpRequestResponseType, headers?: Record<string, string>, progress?: (chunk: any, progress: ProgressEvent<XMLHttpRequestEventTarget>) => void }) {
		return this.send(new RequestOptions({ request: { url: url, type: args?.type ?? "text", method: "DELETE" }, partial: { headers: args?.headers, max_redirects: 10 }, private: { redirects: 0 } }), args?.progress);
	}
	public HEAD(url: string, args?: { type?: XMLHttpRequestResponseType, headers?: Record<string, string>, progress?: (chunk: any, progress: ProgressEvent<XMLHttpRequestEventTarget>) => void }) {
		return this.send(new RequestOptions({ request: { url: url, type: args?.type ?? "text", method: "HEAD" }, partial: { headers: args?.headers, max_redirects: 10 }, private: { redirects: 0 } }), args?.progress);
	}
}

export class RequestOptions {
	public readonly request: {
		url: string;
		type: XMLHttpRequestResponseType;
		method: "GET" | "PUT" | "POST" | "DELETE" | "HEAD";
	};
	public readonly partial: {
		headers?: Record<string, string>;
		max_redirects?: number;
	};
	public readonly private: {
		redirects?: number;
	};

	constructor(args: {
		request: RequestOptions["request"];
		partial: RequestOptions["partial"];
		private: RequestOptions["private"];
	}) {
		this.request = args.request;
		this.partial = args.partial;
		this.private = args.private;
	}
}

export class RequestResponse {
	public readonly encode: string;
	public readonly status: {
		code: number;
		message: string;
	};
	public readonly headers: Record<string, string>;

	constructor(args: {
		encode: RequestResponse["encode"];
		status: RequestResponse["status"];
		headers: RequestResponse["headers"];
	}) {
		this.encode = args.encode;
		this.status = args.status;
		this.headers = args.headers;
	}
}

export default (
	//
	// singleton
	//
	new Request()
)
