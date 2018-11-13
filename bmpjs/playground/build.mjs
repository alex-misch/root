
import { Bundler } from './bmp_modules/bmpjs/bundler/core/bundler'
import fs from 'fs'
import path from 'path'
import rollup from "rollup"
import babelPlugin from "rollup-plugin-babel"
import project from "./package.json"

const builder = new Bundler({
	source_folder: "src",
	destination_folder: "dist"
})

const dependencies = project.bmp ? project.bmp.dependencies : {}
if ( Object.keys(dependencies).length ) {
	Object.keys(dependencies).forEach( key => {
		dependencies[key] = `./bmp_modules/${ key }/src/index.js`
	})
}

const jsplugins = [
	{
		resolveId(specifier, importer) {
			if ( dependencies[specifier] ) {
				return dependencies[specifier]
			} else if ( importer ) {
				const filepath = `${path.dirname(importer)}/${ /\.[a-z]+$/.test(specifier) ? specifier : `${specifier}.js`  }`
				return fs.existsSync(filepath) ? filepath : specifier
			} else {
				return specifier
			}
		},
	},
	babelPlugin({
		presets: [ ["@babel/preset-env",  {
			modules: false,
			targets: { ie: 11 }
		}] ],
		plugins: ['syntax-object-rest-spread']
	})
]

console.log( dependencies )
builder.describe({
	extension: '.js',
	perform: async filepath => {
		console.log( 'Perform', filepath )
		const bundle = await rollup.rollup({
			input: filepath,
			plugins: jsplugins
		})
		return await bundle.generate({
			format: "amd"
		})
	},
	// output: {
	// 	file: "$filename.amd.js",
	// },
})

builder.describe({
	extension: '.html',
	perform: async filepath => ({ code: fs.readFileSync(filepath) }),

})

builder.execute()
