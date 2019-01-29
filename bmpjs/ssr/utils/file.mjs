import { readFileSync } from 'fs';

/**
 * Fetch file
 * @param { String } url
 * @returns { Promise }
 */
const download = async url => {
	try {
		return new Promise( (resolve, reject) => {
			if (!url.startsWith('http'))
				resolve( readFileSync(url).toString('UTF-8') )
			else
				import( url.startsWith('https') ? 'https' : 'http' )
					.then( ({ default: request }) => {
						request.get( url, resp => {
							let data = '';
							resp.on('data', chunk => data += chunk )
							resp.on('end', () => resolve(data) )
							resp.on('error', error => reject(error) )
						})
					})
		})
	} catch ( error ) {
		throw new Error(`\nUnable to get file ${this.fileURL}: ${error}\n`);
	}
}


export { download }
