
import path from 'path'
import fs from 'fs-extra'
import { FindFiles } from '../utils/find-files'

class Bundler {

	constructor(folder) {
		this.config = {
			folder: path.resolve( folder )
		}
		try {
			this.init()
		} catch (e) {
			console.log( 'Fail to initialize bundler', e )
		}
	}


	init() {
		const src = this.config.folder
		console.log( `Initializing bundler (source "${src}")` )
		const fileList = FindFiles({
			regex: /(bmp.conf.json|.js)$/,
			dir: src
		})
		const rootConf = path.join(src, 'bmp.conf.json')
		if ( !fs.existsSync(rootConf) )
			throw new Error(`Fail to load bundler: ${rootConf} not found`)
		console.log( 'Found files', fileList )

		// if ( fs.existsSync(distDir) ) fs.removeSync( distDir )
		// fs.mkdirSync( distDir )

		// console.log( `Created ${distDir}...` )

		// if ( fs.existsSync( `${sourceDir}/assets` ) ) {
		// 	fs.linkSync( `${sourceDir}/assets`, `${distDir}/assets` )
		// 	console.log( `Created ${distDir}...` )
		// }
		console.log( 'Wait for changes...' )
	}

	transform(filepath) {
		if ( this.config.babel && this.config.rollup )
			return this.rollup(filepath)
		if ( this.config.rollup )
			return this.rollup(filepath)
		if ( this.config.babel )
			return this.babel(filepath)
	}

	fileChanged(filePath) {

	}

	babel() {

	}


	rollup() {

	}
}

export { Bundler }
