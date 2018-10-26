'use strict';

class HTTPRequest {

	async request( method, endpoint, data ) {

		let headers = {
			'Accept': 'application/json, text/plain, */*',
			'Content-Type': 'application/json; charset=utf-8',
		}

		const { host, port, headers: confHeaders } = this.conf
		if ( confHeaders )
			Object.keys( confHeaders ).forEach( key => {
				headers[ key ] = confHeaders[ key ];
			});

		const url = `${ host }${ port ? `:${port}` : '' }/${ endpoint }`
		let fetchRes = await window.fetch(url, {
			method,
			headers,
			body: data ? JSON.stringify( data ) : null,
			credentials: this.conf.credentials || "include"
		})
		return await fetchRes.text()
	}

  getRequest ( endpoint, data ) {
    return this.request( 'GET', endpoint, data )
  }

  postRequest ( endpoint, data ) {
    return this.request( 'POST', endpoint, data )
  }
}

export { HTTPRequest }
