import fs from 'fs-extra';
import path from 'path';

const cache = {
	// cache directory (using file driver)
	dir: './cache',

	get: url => {
		const cacheKey = cache.generateKey(url)
		const cacheFilePath =  path.join(cache.dir, cacheKey)
		if (fs.existsSync( cacheFilePath ) )
			return fs.readFileSync( cacheFilePath ).toString('UTF-8')

		return false
	},

	generateKey(url) {
		try {
			// try to parse location as URL
			const loc = (new URL(url))
			return loc.pathname
		} catch(e) {
			console.error(e)
			// simple base64 convertor
			return  Buffer.from(url).toString('base64')
		}
	},

	/**  */
	set: (url, content) => {
		// Urll should be like a pathname "/some/url/to/file.js"
		const cacheKey = cache.generateKey(url)
		const cacheFilePath =  path.join(cache.dir, cacheKey)

		// write to file with named base64 of content key
		fs.outputFileSync( cacheFilePath, Buffer.from(content) )
	}
}
if ( !fs.existsSync(cache.dir) ) {
	fs.mkdirSync(cache.dir)
}


/**
 * Fetch file
 * @param { String } url
 * @returns { Promise }
 */
const download = async url => {
	const file = cache.get(url)
	if (file) return file
	try {
		return new Promise( (resolve, reject) => {
			if (!url.startsWith('http')) {
				resolve( fs.readFileSync(url).toString('UTF-8') )
			} else {
				import( url.startsWith('https') ? 'https' : 'http' )
					.then( ({ default: http }) => {
						http.get( url, resp => {
							let data = '';
							resp.on('data', chunk => data += chunk )
							resp.on('end', () => {
								cache.set(url, data)
								resolve(data)
							})
							resp.on('error', error => reject(error) )
						})
					})
			}
		})
	} catch ( error ) {
		throw new Error(`\nUnable to get file ${this.fileURL}: ${error}\n`);
	}
}


export { download }
