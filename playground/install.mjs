import project from './package.json'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

console.log( "Installing dependencies..." )

const curdir = path.resolve('.')

class PackageManager {

	constructor({ assets, host }) {
		if ( !fs.existsSync(assets) ) {
			// recursive make directory
			assets.split( '/' ).reduce( (path, dir) => {
				if ( !fs.existsSync(path) )
					fs.mkdirSync(path)
				return `${path}/${dir}`
			}, '/')
		}
		this.assetsDir = assets
		this.host = host
	}

	ungzip(buffer, to) {
		return new Promise( (resolve, reject) => {
			const untar = spawn( 'tar', ['-xvf', '-', '-C', to])
			untar.on('error', err => reject(err) )
			untar.on('exit', code => code === 0 ? resolve() : reject() )
			untar.stdin.write( buffer )
			untar.stdin.end()
		})
	}

	async load(names) {
		const loaders = names.map( name => {
			return new Promise( async (resolve, reject) => {
				const data = []
				const request = await import( /^https/.test(this.host) ? 'https' : 'http' )
				request.get( `${ this.host }/${ name }.tar.gz`, resp => {

					resp.on( "error", err => reject(err) )
					resp.on( "data", chunk => {
						data.push(chunk)
					})
					resp.on( "end", () => {
						const dir = `${ this.assetsDir }/${ name }`
						if ( !fs.existsSync(dir) ) mkdirRecursive(dir)
						this.ungzip( Buffer.concat(data), dir ).then( () => {
							console.log( '- Success installed', name )
							resolve(name)
						}).catch( reject )
					})
				})
			})
		})
		return Promise.all(loaders)
	}

}

if ( project.bmp && project.bmp.dependencies ) {
	const packages = new PackageManager({
		assets: `${ curdir }/bmp_modules`,
		host: "https://d1evwmcww02bep.cloudfront.net"
	})

	packages.load( Object.keys(project.bmp.dependencies) )
		.then( dependenceList => {
			console.log( `${dependenceList.length} dependency successfully installed` )
		})
		.catch( err => {
			console.error( 'Fail install dependency', err )
			process.exit(1)
		})
}
