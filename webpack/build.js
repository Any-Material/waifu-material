const fs = require("fs");
const webpack = require("webpack");
const package = require("../package");
const builder = require("electron-builder");
const { main, preload, renderer } = require("./webpack.config");

const compiler_main = webpack({
	...main,
	mode: "production",
	devtool: "inline-nosources-cheap-module-source-map",
}, () => {
	const compiler_preload = webpack({
		...preload,
		mode: "production",
		devtool: "inline-nosources-cheap-module-source-map",
	}, () => {
		const compiler_renderer = webpack({
			...renderer,
			mode: "production",
			devtool: "inline-nosources-cheap-module-source-map",
		}, () => {
			compiler_main.close(() => {
				compiler_preload.close(() => {
					compiler_renderer.close(() => {
						fs.writeFile("./build/package.json",
							JSON.stringify({
								name: package.name,
								main: package.main,
								version: package.version,
								description: package.description
							}), {}, () => {
							builder.build({
								targets: builder.Platform.WINDOWS.createTarget("zip"),
								config: {
									appId: "org.sombian.nozomi.material",
									files: [
										"build/*.js",
										"build/*.json",
										"build/*.html",
									],
									directories: {
										output: "releases"
									},
									icon: "../source/assets/icons/icon.ico",
								}
							});
						});
					});
				});
			});
		});
	});
});
