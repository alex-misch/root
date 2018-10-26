
import { Bundler } from "../bmpjs/component/core/bundler"

const builder = new Bundler({
	source_folder: "src",
	destination_folder: "dist",
	dependencies: {
		"bmp-core": "https://cdn.boomfunc.io/bmp-core/0.0.14/index.js",
		"bmp-router": "https://cdn.boomfunc.io/bmp-router/0.0.15/index.js"
	},
	minify: true,
	transform: {
		amd: {
			filename: "$filename.amd.js",
			jobs: [
				["rollup", {
					plugins: [
						["babel", {
							presets: [
								[ "env",  { targets: { ie: 11 } } ]
							],
							plugins: [
								'syntax-object-rest-spread',
								'transform-modules-amd'
							]
						}],
						"commonjs"
					]
				}]
			]
		}
	}
})
