import { Bundler } from "../core/bundler";
import { searchFiles } from '../utils/fs'
import fs from "fs-extra";
import path from "path"

class Build extends Bundler {

	async buildAll() {
		const fileList = searchFiles({
			regex: /.js$/,
			dir: this.project.folder
		})
		const bundlers = fileList.map( async filepath => {
			return await this.bundleFile( filepath )
		})
		return Promise.all(bundlers)
	}

	async bundleFile( filepath, driver ) {
		// console.log( `Building: ${ filepath }` )
		const sourceFile = path.parse(filepath)
		const destFolder = sourceFile.dir.replace( this.sourceDir, this.destDir )
		try {
			const transformers = Object
				.keys(this.project.config.transform )
				.map( async format => {
					// transform options
					const options = this.project.config.transform[format]
					// transform options
					const tmpFilepath = filepath.replace(sourceFile.dir, destFolder)
					const destFilepath = `${ destFolder }/${ options.filename.replace( '$filename', sourceFile.name ) }`
					// copy file to dest
					fs.outputFileSync( tmpFilepath, fs.readFileSync(filepath) )
					// run transformers to it
					await this.runTransformers( tmpFilepath, options.modules, format )
					fs.rename( tmpFilepath, destFilepath )
				})
			return await Promise.all( transformers )
		} catch (e) {
			console.log( 'Bundle error:', e )
			return Promise.reject(e)
		}
	}
}

export { Build }

