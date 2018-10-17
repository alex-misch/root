
import path from 'path'
import fs from 'fs-extra'
import { searchFiles, emptyFolder, createSymlink } from '../utils/fs'

class Bundler {

	constructor(config, logger) {
		console.log( `Initalized project "${config.rel}/${config.project_folder}"` )
		this.config = {
			folder: path.resolve( config.project_folder )
		}
		this.log = logger

		try {
			this.init()
		} catch (e) {
			this.log( 'Fail to initialize bundler', e )
		}
	}

	async runTransformers(modules, filepath) {
		if ( modules && modules.lenth ) {
			return await Promise.all(
				modules.map( async mod => {
					let driver = null
					let options = {}
					if ( typeof mod == 'object' ) {
						[ driver, options ] = mod
					} else {
						driver = mod
					}
					console.log( `Load driver ${driver}` )
					const { transform } = import( `../drivers/${ driver }` )
					await transform(filepath, options)
				})
			)
		} else {
			return fs.readFileSync(filepath)
		}
	}


	init() {
		const projectFolder = this.config.folder

		const fileList = searchFiles({
			regex: /(bmp.conf.json|.js)$/,
			dir: projectFolder
		})
		const rootConfPath = path.join(projectFolder, 'bmp.conf.json')
		let rootConf = null
		try {
			rootConf = JSON.parse( fs.readFileSync( rootConfPath ) )
		} catch(e) {
			throw new Error(`Can't parse ${rootConfPath}`)
		}

		const { dist, source_folder: src, transform } = rootConf
		this.config.transform = rootConf.transform
		this.sourceDir = path.join(projectFolder, src)
		this.distDir = path.join(projectFolder, dist)

		emptyFolder( this.distDir )
		createSymlink( `${this.distDir}/assets`, `${this.sourceDir}/assets` )

		this.log( 'Wait for changes...' )
	}

	async fileChanged(event) {
		console.log( `Building: ${ event.relative_path }...` )
		console.log( this.config.transform )
		const transformers = Object.keys( this.config.transform ).map( async format => {
			const options = this.config.transform[format]
			return await this.runTransformers( options.modules, event.relative_path )
		})
		await Promise.all( transformers )
		console.log( `Success: ${ event.relative_path }` )
	}

}

export { Bundler }
