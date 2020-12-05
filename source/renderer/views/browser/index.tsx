import * as React from "react";

import "./index.scss";

import utility from "@/modules/utility";

import Query from "@/renderer/components/query";
import Iterable from "@/renderer/components/iterable";

export type BrowserState = {
	disable: boolean;
};

class Browser extends React.Component<BrowserState> {
	public state: BrowserState;
	constructor(properties: BrowserState) {
		super(properties);
		this.state = { ...properties };
	}
	static getDerivedStateFromProps($new: BrowserState, $old: BrowserState) {
		return $new;
	}
	public render() {
		return (
			<section id="browser" class={utility.inline({ "disable": this.state.disable, "left": true })}>
				<Query focus={false} suggests={[]}></Query>
				<Iterable status={{}} blocks={[]}></Iterable>
			</section>
		);
	}
}
export default Browser;
