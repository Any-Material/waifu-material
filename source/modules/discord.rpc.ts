// @ts-ignore
import * as RPC from "discord-rpc";

/**
 * @see https://discord.com/developers/docs/rich-presence/how-to
 */
export class RichPresence {
	public state?: string;
	public details: string;
	public startTimestamp?: number;
	public endTimestamp?: number;
	public largeImageKey?: string;
	public largeImageText?: string;
	public smallImageKey?: string;
	public smallImageText?: string;
	public partyId?: string;
	public partySize?: number;
	public partyMax?: number;
	public matchSecret?: string;
	public spectateSecret?: string;
	public joinSecret?: string;
	public instance?: boolean;

	constructor(args: {
		state?: RichPresence["state"];
		details: RichPresence["details"];
		startTimestamp?: RichPresence["startTimestamp"];
		endTimestamp?: RichPresence["endTimestamp"];
		largeImageKey?: RichPresence["largeImageKey"];
		largeImageText?: RichPresence["largeImageText"];
		smallImageKey?: RichPresence["smallImageKey"];
		smallImageText?: RichPresence["smallImageText"];
		partyId?: RichPresence["partyId"];
		partySize?: RichPresence["partySize"];
		partyMax?: RichPresence["partyMax"];
		matchSecret?: RichPresence["matchSecret"];
		spectateSecret?: RichPresence["spectateSecret"];
		joinSecret?: RichPresence["joinSecret"];
		instance?: RichPresence["instance"];
	}) {
		this.state = args.state;
		this.details = args.details;
		this.startTimestamp = args.startTimestamp;
		this.endTimestamp = args.endTimestamp;
		this.largeImageKey = args.largeImageKey;
		this.largeImageText = args.largeImageText;
		this.smallImageKey = args.smallImageKey;
		this.smallImageText = args.smallImageText;
		this.partyId = args.partyId;
		this.partySize = args.partySize;
		this.partyMax = args.partyMax;
		this.spectateSecret = args.spectateSecret;
		this.joinSecret = args.joinSecret;
		this.instance = args.instance;
	}
};

/**
 * @see https://discord.com/developers/applications/{application_id}/information
 */
 export class DiscordRPC {
	private presence: RichPresence;
	private available: boolean;
	private readonly client = new RPC.Client({ transport: "ipc" });

	constructor(args: {
		secret: string;
		presence: RichPresence;
	}) {
		this.presence = args.presence;
		this.available = false;

		this.client.once("ready", () => {
			this.update();
		});
		this.login(args.secret);
	}
	private login(secret: string) {
		if (!this.available) {
			this.client.login({ clientId: secret }).then(() => {
				this.available = true;
			}).catch(() => {
				setTimeout(() => {
					this.login(secret);
				},
				//
				// 1000 milliseconds = 1 second
				// 60 seconds = 1 minute
				//
				1000 * 60);
			});
		}
	}
	public update(presence: RichPresence = this.presence, preserve: boolean = true) {
		if (preserve) {
			this.presence = new RichPresence({ ...this.presence, ...presence });
		} else {
			this.presence = presence;
		}
		if (this.available) {
			console.log(this.presence);
			this.client.setActivity(this.presence);
		}
	}
}

export default (
	//
	// singleton
	//
	new DiscordRPC({
		secret: "526951055079112724",
		presence: new RichPresence({
			details: "Starting...",
			startTimestamp: Date.now(),
			largeImageKey: "icon",
			largeImageText: "Sombian#7940",
			smallImageKey: "discord",
			smallImageText: "discord.gg/Gp7tWCe",
			instance: true
		})
	})
)
