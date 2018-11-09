
import { Bundler } from './bmp_modules/bmpjs/bundler/core/bundler'
import fs from 'fs'
import babel from "rollup-plugin-babel"

const builder = new Bundler({
	source_folder: "src",
	destination_folder: "dist"
})

builder.describe({
	extension: '.js',
	driver: "rollup",
	format: 'amd',
	perform: {
		plugins: [
			babel({
				presets: [
					["@babel/preset-env",  {
						targets: { ie: 11 }
					}]
				],
				plugins: [
					'syntax-object-rest-spread',
					'transform-modules-amd'
				]
			}),
			"commonjs"
		]
	},
	output: {
		file: "$filename.amd.js",
		minify: true
	},
})

builder.describe({
	extension: '.html',
	perform: async filepath => ({ code: fs.readFileSync(filepath) }),

})

builder.execute()
