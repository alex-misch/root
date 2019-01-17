
import { Resource } from './resource.js'

class GraphResource extends Resource {

	toSearchString( obj ) {
		return Object.keys( obj ).map( key => {
			return `${ key }=${ encodeURIComponent( obj[key] ) }`
		}).join('&')
	}

	get(query) {
		const searchstring = this.toSearchString({ query: `{ ${ query } }` })
		const url = `${ this.conf.host }?${ searchstring }`
		const request = new Request( url, {
			url: `${ this.conf.host }?${ searchstring }`,
			method: 'GET',
			headers: { 'Accept': '*/*' },
			credentials: this.conf.credentials || "include",
		})
		return super.request(request)
	}

	post(query) {
		const request = new Request( this.conf.host, {
			method: 'POST',
			body: { query: `{ ${ query } }` },
			credentials: this.conf.credentials || "include",
			headers: {
				'Accept': '*/*',
				'Content-Type': 'application/json'
			}
		})
		return super.request(request)
	}

}

export { GraphResource }
