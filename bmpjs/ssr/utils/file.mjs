import fs from 'fs';
import path from 'path';

const cache = {
	dir: path.resolve('./cache'),
	toBase64: str => Buffer.from(str).toString('base64'),

	get: key => {
		const keyBase64 = cache.toBase64(key)
		if (cache.storage.includes(keyBase64))
			return fs.readFileSync( path.join(cache.dir, keyBase64) ).toString('UTF-8')
	},
	set: (key, content) => {
		const keyBase64 = cache.toBase64(key)
		return fs.writeFileSync( path.join(cache.dir, keyBase64), Buffer.from(content) )
	}
}
if ( !fs.existsSync(cache.dir) )
	fs.mkdirSync(cache.dir)

cache.storage = fs.readdirSync( cache.dir )

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
				const fileContent = fs.readFileSync(url).toString('UTF-8')
				cache.set(url, fileContent)
				resolve( fileContent )
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
