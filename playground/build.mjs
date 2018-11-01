
import { Bundler } from './bmp_modules/bmpjs/bundler/core/bundler'

const builder = new Bundler({
	source_folder: "src",
	destination_folder: "dist"
})

builder.addJob({
	name: 'rollup',
	output: {
		file: "$filename.amd.js",
		format: 'amd',
		minify: true,
	},
	plugins: {
		babel: {
			presets: [
				["@babel/preset-env",  {
					targets: { ie: 11 }
				}]
			],
			plugins: [
				'syntax-object-rest-spread',
				'transform-modules-amd'
			]
		},
		commonjs: true
	}
})

builder.run()
