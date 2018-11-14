
import path from 'path'
import fs from 'fs-extra'
import { emptyFolder, createSymlink } from '../utils/fs'
import { searchFiles } from '../utils/fs'

class Bundler {

	constructor( config ) {
		this.performers = {}

		const { destination_folder: dest, source_folder: src } = config
		const folder = '.'

		this.sourceDir = path.resolve(path.join(folder, src))
		this.destDir = path.resolve(path.join(folder, dest))
		if ( !fs.existsSync(this.destDir) )
			fs.mkdirSync(this.destDir)
		this.afterBuild = config.afterBuild
		this.symlinkAssets = !!config.symlinkAssets
	}


	async execute() {
		this.synctree()

		const fileList = searchFiles({
			regex: /build\.json$/,
			dir: this.sourceDir
		})
		const bundlers = fileList.map( async confpath => {
			const fullConfpath = path.resolve(confpath)
			const { default: conf } = await import( fullConfpath )
			if ( Array.isArray(conf) ) {
				const filelist = conf.map( ({ entrypoint }) => `${ path.dirname(fullConfpath) }/${ entrypoint }` )
				await this.compile(filelist)
			}
		})

		await Promise.all(bundlers)
		if ( typeof this.afterBuild == 'function' )
			await this.afterBuild()
	}

	compile(filelist) {
		return Promise.all(
			filelist.map( async filepath => {
				const { code } = await this.transform( filepath )
				console.log( 'PUT COMPILED', filepath, 'TO', filepath.replace(this.sourceDir, this.destDir) )
				await fs.outputFile( filepath.replace(this.sourceDir, this.destDir), code )
			})
		)
	}


	synctree() {

		emptyFolder( this.destDir )
		if ( fs.existsSync( `${this.sourceDir}/assets` ) ) {
			if ( this.symlinkAssets )
				createSymlink( `${this.destDir}/assets`, `${this.sourceDir}/assets` )
			else
				fs.copySync( `${this.sourceDir}/assets`, `${this.destDir}/assets` )
		}
		if ( fs.existsSync(`${this.sourceDir}/index.html`) )
			fs.copySync(`${this.sourceDir}/index.html`, `${this.destDir}/index.html`)

	}

	transform(filepath) {
		const ext = path.extname(filepath)
		if ( !this.performers[ext] )
			this.performers[ext] = { perform: null }

		switch ( typeof this.performers[ext].perform ) {
			case "function":
				return this.performers[ext].perform( filepath )
			// TODO: case other performers
			default:
				console.log( `- WARNING: Not specified of ${filepath} (${ext}). Source copied to destination.` )
				return { code: fs.readFileSync(filepath) }
		}
	}

	describe(job) {
		if ( !job.perform )
			throw new Error(`"perform" is required parameter in Bundler.describe`)
		if ( !job.if || !job.if.extension )
			throw new Error(`Please specify condition (e.x { if: { extension: '.js' } } ) in Bundler.describe`)

		const { extension } = job.if
		this.performers[extension] = job
	}

}

export { Bundler }
