export enum Prefix {
	AND		= "",
	INCLUDE	= "-",
	EXCLUDE	= "\\+"
}

export enum Field {
	ID			= "id",
	TYPE		= "type",
	CHARACTER	= "character",
	LANGUAGE	= "language",
	SERIES		= "series",
	ARTIST		= "artist",
	GROUP		= "group",
	TAG			= "tag",
	MALE		= "male",
	FEMALE		= "female",
	STATUS		= "status"
}

export class Tag {
	public readonly field: Field;
	public readonly value: String;

	constructor(args: {
		field: Tag["field"];
		value: Tag["value"];
	}) {
		this.field = args.field;
		this.value = args.value;
	}
	public url() {
		switch (this.field) {
			case Field.LANGUAGE: {
				return `https://ltn.hitomi.la/index-${this.value}.nozomi`;
			}
			case Field.MALE:
			case Field.FEMALE: {
				return `https://ltn.hitomi.la/tag/${this.field}:${this.value}-all.nozomi`;
			}
			default: {
				return `https://ltn.hitomi.la/${this.field}/${this.value}-all.nozomi`;
			}
		}
	}
	public toString() {
		return `${this.field}:${this.value}`;
	}
}

export class Computable {
	public readonly prefix: Prefix;
	public readonly tags: Array<[Prefix, Tag]>;

	constructor(args: {
		prefix: Computable["prefix"];
		tags: Computable["tags"];
	}) {
		this.prefix = args.prefix;
		this.tags = args.tags;
	}
}

const _Tag = new RegExp(`^(${Object.values(Prefix).join("|")})(${Object.values(Field).join("|")}):([\\w]+)\$`);
const _Prefix = new RegExp(`^(${Object.values(Prefix).join("|")})\$`);

declare global {
	interface String {
		toPrefix(): Nullable<Prefix>;
		toField(): Nullable<Field>;
	}
}

String.prototype.toPrefix = function() {
	for (const prefix of Object.values(Prefix)) {
		if (prefix == this) {
			return prefix;
		}
	}
	return null;
}

String.prototype.toField = function() {
	for (const field of Object.values(Field)) {
		if (field == this) {
			return field;
		}
	}
	return null;
}

export class Encode {
	public parse(query: string) {
		const before: Array<Array<string>> = [[]];
		const after: Array<Array<Computable>> = [[]];

		let x = 0, y = 0;

		for (const chunk of query.split("")) {
			switch (chunk) {
				case "(": {
					y++;
					break;
				}
				case ")": {
					y--;
					// next
					if (y == 0) {
						x++;
						before[x] = [];
					}
					break;
				}
				default: {
					before[x][y] = before[x][y] ? before[x][y] + chunk : chunk;
					break;
				}
			}
		}
		for (x = 0; x < before.length; x++) {
			for (y = 0; y < before[x].length; y++) {
				for (const chunk of (before[x][y] + "\u0020").split("\u0020")) {
					/// 0: unused
					/// 1: prefix
					/// 2: field
					/// 3: value
					const tag = _Tag.match(chunk);

					if (!tag) continue;
					if (!after[x]) after[x] = [];
					if (!after[x][y]) after[x].add(new Computable({ prefix: y > 0 ? _Prefix.match(before[x][y - 1])!.group(1)!.toPrefix()! : Prefix.AND, tags: [] }));

					after[x][y].tags.add([
						tag.group(1)!.toPrefix()!,
						new Tag({ field: tag.group(2)!.toField()!, value: tag.group(3)!.replace(/\s/g, "%20") })
					]);
				}
			}
		}
		return after;
	}
}

export default (
	//
	// singleton
	//
	new Encode()
)
