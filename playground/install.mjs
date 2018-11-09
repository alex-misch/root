import project from './package.json'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

console.log( "Installing dependencies..." )

const mkdirRecursive = newdir => {
	newdir.split( '/' ).reduce( (path, dir) => {
		if ( !fs.existsSync(path) )
			fs.mkdirSync(path)
		return `${path}/${dir}`
	}, '/')
}

class PackageManager {

	constructor({ assets, host }) {
		if ( !fs.existsSync(assets) ) {
			// recursive make directory
			mkdirRecursive( assets )
		}
		this.assetsDir = assets
		this.host = host
		this.registry = []
	}


	ungzip(buffer, destDir) {
		return new Promise( (resolve, reject) => {
			const cmds = ['-xvzf', '-', '-C', destDir]
			const opts = { stdio: ['pipe', 'pipe', process.stderr] }
			const untar = spawn( 'tar', cmds, opts)
			untar.on('exit', code => code === 0 ? resolve() : reject() )
			untar.stdin.write( buffer )
			untar.stdin.end()
		})
	}

	async download(filepath) {
		const data = []
		const request = await import( /^https/.test(this.host) ? 'https' : 'http' )

		return new Promise( (resolve, reject) => {
			request.get( `${ this.host }/${ filepath }`, resp => {

				resp.on( "error", err => reject(err) )
				resp.on( "data", chunk => data.push(chunk) )
				resp.on( "end", () => {
					resolve( Buffer.concat(data) )
				})
			})
		})
	}

	async load(names) {
		this.registry.push(...names)
		const loaders = names.map( async name => {
			const dir = `${ this.assetsDir }/${ name }/`
			if ( fs.existsSync( dir ) ) {
				console.log( '- Already installed', name )
				return { name, status: 'cache' }
			} else {
				const buffer = await this.download( `${ name }.tar.gz` )
				if ( !fs.existsSync(dir) )
				mkdirRecursive(dir)

				await this.ungzip( buffer, dir )
				console.log( '- Success installed', name )
				return { name, status: 'download' }
			}

		})
		return Promise.all(loaders)
	}

}

if ( project.bmp && project.bmp.dependencies ) {
	const bmpack = new PackageManager({
		assets: `${ path.resolve('.') }/bmp_modules`,
		host: "https://d1evwmcww02bep.cloudfront.net"
	})

	bmpack
		.load( Object.keys(project.bmp.dependencies) )
		.then( dependenceList => {

			console.log( `${dependenceList.filter( dep => dep.status == 'download' ).length } dependency successfully installed` )
			console.log( `${dependenceList.filter( dep => dep.status == 'cache' ).length } dependency found in modules folder` )
		})
		.catch( err => {
			console.error( 'Fail install dependencies', err )
			process.exit(1)
		})
}
