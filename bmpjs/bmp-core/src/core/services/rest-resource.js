
import { Resource } from './resource.js'

class RestResource extends Resource {

	generateURL(endpoint) {
		return `${ this.conf.host }/${ endpoint }`
	}

	get( endpoint, data ) {
		return this.request( endpoint, data, 'GET' )
	}

	post( endpoint, data ) {
		return this.request( endpoint, data, 'POST' )
	}

	request( endpoint, data = null, method = 'GET' ) {
		const url = this.generateURL( endpoint )
		const request = new Request(url, {
			method,
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Content-Type': 'application/json; charset=utf-8',
				...this.conf.headers
			},
			body: data ? JSON.stringify( data ) : null,
			credentials: this.conf.credentials || "include"
		})
		return super.request(request)
	}


}

export { RestResource }
