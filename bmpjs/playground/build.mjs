
import { Bundler } from './bmp_modules/bmpjs/bundler/core/bundler'
import fs from 'fs'
import rollup from "rollup"
import babelPlugin from "rollup-plugin-babel"

const builder = new Bundler({
	source_folder: "src",
	destination_folder: "dist"
})

const jsplugins = [
	babelPlugin({
		presets: [ ["@babel/preset-env",  {
			modules: false,
			targets: { ie: 11 }
		}] ],
		plugins: ['syntax-object-rest-spread']
	}),
	// commonjsPlugin()
]

builder.describe({
	extension: '.js',
	perform: async filepath => {
		console.log( 'Perform', filepath )
		const bundle = await rollup.rollup({
			input: filepath,
			plugins: jsplugins
		})
		return await bundle.generate({ format: "amd" })
	},
	output: {
		file: "$filename.amd.js",
	},
})

builder.describe({
	extension: '.html',
	perform: async filepath => ({ code: fs.readFileSync(filepath) }),

})

builder.execute()
