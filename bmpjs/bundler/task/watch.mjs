import { Bundler } from "../core/bundler";
import { searchFiles } from '../utils/fs'
import fs from "fs-extra";
import path from "path"

class Watch extends Bundler {

	async bundleFile( filepath, driver ) {
		// console.log( `Building: ${ filepath }` )
		const sourceFile = path.parse(filepath)
		const destFolder = sourceFile.dir.replace( this.sourceDir, this.destDir )
		try {
			// transform options
			const tmpFilepath = filepath.replace(sourceFile.dir, destFolder)
			const destFilepath = `${ destFolder }/${ sourceFile.base }`
			const modules = [
				["babel", {
					presets: [],
					plugins: [
						'syntax-object-rest-spread',
						'transform-modules-amd'
					]
				}]
			]

			// copy file to dest
			fs.outputFileSync( tmpFilepath, fs.readFileSync(filepath) )

			// run transformers to it
			await this.runTransformers( tmpFilepath, modules, "amd" )
			await fs.rename( tmpFilepath, destFilepath )
			return Promise.resolve(destFilepath)
		} catch (e) {
			console.log( 'Bundle error:', e )
			return Promise.reject(e)
		}
	}
}

export { Watch }
