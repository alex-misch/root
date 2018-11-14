
import { Bundler } from './bmp_modules/bmpjs/bundler/core/bundler'
import rollup from "rollup"

const builder = new Bundler({
	source_folder: "src",
	destination_folder: "dist",
	afterBuild: () => console.log( 'Done.' )
})

builder.describe({
	if: { extension: '.js' },
	perform: async filepath => {
		const bundle = await rollup.rollup({ input: filepath })
		console.log( '- COMPLETE: rollup', filepath )
		return await bundle.generate({ format: "amd" })
	}
})

builder.execute()
