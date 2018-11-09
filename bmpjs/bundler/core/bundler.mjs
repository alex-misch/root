
import path from 'path'
import fs from 'fs-extra'
import { emptyFolder, createSymlink } from '../utils/fs'
import { searchFiles } from '../utils/fs'

class Bundler {

	constructor( projectConfig ) {
		this.performers = {}

		const { destination_folder: dest, source_folder: src } = projectConfig
		const folder = '.'
		this.sourceDir = path.join(folder, src)
		this.destDir = path.join(folder, dest)
	}


	execute() {
		this.synctree()

		const fileList = searchFiles({
			regex: /build\.json$/,
			dir: this.sourceDir
		})
		const bundlers = fileList.map( async confpath => {
			const fullConfpath = path.resolve(confpath)
			const { default: conf } = await import( fullConfpath )
			let fileBundlers = []
			if ( Array.isArray(conf) ) {
				fileBundlers = conf.map( async ({ entrypoint }) => {
					const srcFile = `${ path.dirname(fullConfpath) }/${ entrypoint }`
					const { code } = await this.transform( srcFile )
					await fs.outputFile( srcFile.replace(this.sourceDir, this.destDir), code )
				})
				await Promise.all( fileBundlers )
			}
		})

		return Promise.all(bundlers)
	}


	synctree() {

		emptyFolder( this.destDir )
		if ( fs.existsSync( `${this.sourceDir}/assets` ) ) {
			// if ( assetsAction == 'symlink' )
			// 	createSymlink( `${this.destDir}/assets`, `${this.sourceDir}/assets` )
			// else if ( assetsAction == 'copy' )
				fs.copySync( `${this.sourceDir}/assets`, `${this.destDir}/assets` )
		}
		if ( fs.existsSync(`${this.sourceDir}/index.html`) )
			fs.copySync(`${this.sourceDir}/index.html`, `${this.destDir}/index.html`)

	}

	async bundleFile(filepath, config) {
		let { driver } = config

		console.log( `"${driver}" ${filepath}... ` )
		const { transform } = await import( `../driver/${ driver }` )
		return await transform(filepath, config )
	}

	transform(filepath) {
		const ext = path.extname(filepath)
		switch ( typeof this.performers[ext].perform ) {
			case "function":
				return this.performers[ext].perform( filepath )
			case "object":
				return this.bundleFile(filepath, this.performers[ext])
			default:
				console.log( `WARNING: Not specified ${filepath} (${ext}).` )
				return { code: fs.readFileSync(filepath) }
		}
	}

	describe(conf) {
		['extension', 'perform'].forEach( option => {
			if ( !conf[option] )
				throw new Error(`"${options}" is required parameter in Bundler.describe`)
		})

		const { extension } = conf
		this.performers[extension] = conf
	}

}

export { Bundler }
