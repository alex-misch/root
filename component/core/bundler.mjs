
import path from 'path'
import fs from 'fs-extra'
import { emptyFolder, createSymlink } from '../utils/fs'

class Bundler {

	getProjectConfig(folder) {
		const rootConfPath = path.join(folder, 'bmp.conf.json')
		try {
			return JSON.parse( fs.readFileSync( rootConfPath ) )
		} catch(e) {
			throw new Error(`Can't parse ${rootConfPath}`)
		}
	}


	init({ folder, assetsAction, minify }) {
		this.project = {
			folder: folder,
			minify: Boolean(minify),
			config: this.getProjectConfig(folder)
		}

		const { destination_folder: dest, source_folder: src, transform } = this.project.config
		this.sourceDir = path.join(folder, src)
		this.destDir = path.join(folder, dest)

		emptyFolder( this.destDir )
		if ( fs.existsSync( `${this.sourceDir}/assets` ) ) {
			if ( assetsAction == 'symlink' )
				createSymlink( `${this.destDir}/assets`, `${this.sourceDir}/assets` )
			else if ( assetsAction == 'copy' )
				fs.copySync( `${this.sourceDir}/assets`, `${this.destDir}/assets` )
		}

		return this.buildAll()
	}

	async runTransformer(filepath, module) {
		return new Promise( resolve => {

		})
	}

	async runTransformers(filepath, modules, format) {
		if ( modules && modules.length ) {
			for (const moduleConf of modules) {
				let driver = null
				let options = {}
				if ( Array.isArray(moduleConf) ) {
					[driver, options] = moduleConf
				} else {
					driver = moduleConf
				}
				options.format = format
				console.log( `${this.project.folder}: "${driver}" to ${filepath}... ` )
				const { transform } = await import( `../driver/${ driver }` )
				const bundle = await transform(filepath, options, `/bmp/${this.project.folder}`)
				await fs.outputFile( filepath , bundle ? bundle.code : '' )
			}
		} else {
			return fs.readFileSync(filepath)
		}
	}


}

export { Bundler }
