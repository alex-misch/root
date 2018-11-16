
import { Bundler } from './bmp_modules/bmpjs/bundler/core/bundler'
import fs from 'fs'
import rollup from "rollup"
import babelPlugin from "rollup-plugin-babel"
import project from "./package.json"

const builder = new Bundler({
	source_folder: "src",
	destination_folder: "dist",
	afterBuild: () => console.log( 'Done.' )
})

const dependencies = project.bmp ? project.bmp.dependencies : {}
if ( Object.entries(dependencies).length ) {
	Object.keys(dependencies).forEach( key => {
		dependencies[key] = `./bmp_modules/${ key }/src/index.js`
	})
}

const jsplugins = [
	{ resolveId: specifier => dependencies[specifier] || null },
	babelPlugin({
		presets: [ ["@babel/preset-env",  {
			modules: false,
			targets: { ie: 11 }
		}] ],
		plugins: ['syntax-object-rest-spread']
	})
]

builder.describe({
	if: { extension: '.js' },
	perform: async filepath => {
		const bundle = await rollup.rollup({
			input: filepath,
			plugins: jsplugins
		})
		console.log( '- COMPLETE: rollup', filepath )
		return await bundle.generate({
			format: "amd"
		})
	}
})

builder.describe({
	if: { extension: '.html' },
	perform: async filepath => ({ code: fs.readFileSync(filepath) }),

})

builder.execute()
