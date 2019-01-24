
import https from 'https'

/**
 * Fetch file
 * @param { String } url
 * @returns { Promise }
 */
const download = async url => {
	try {
		return new Promise( (resolve, reject) => {
			https.get( url, resp => {
				let data = '';
				resp.on('data', chunk => data += chunk )
				resp.on('end', () => resolve(data) )
				resp.on('error', error => reject(error) )
			})
		})
	} catch ( error ) {
		throw new Error(`\nUnable to get file ${this.fileURL}: ${error}\n`);
	}
}


export { download }
