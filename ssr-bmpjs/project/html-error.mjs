const CODES = {
	SERVER_ERROR: 500,
	NOT_FOUND: 404,
	FORBIDDEN: 403
}
const errors = {
	[CODES.SERVER_ERROR]: {
		message: 'Server Temporary Unavailable'
	},
	[CODES.NOT_FOUND]: {
		message: `Not found`
	},
	[CODES.FORBIDDEN]: {
		message: `Forbidden`
	}
}

class HTMLError {

	constructor(code) {
		this.statusCode = code
		this.data = errors[code]
		if ( !this.data ) console.warn(`HTMLError: non-existent error with code "${code}"`)
	}

	getMessage() {
		return this.data.message
	}

	shell() {
		return `
			<h2>Error!</h2>
			<p>${ this.getMessage() }</p>
			<small>&copy; BMP Server side render v0.0.1</small>
		`
	}

}

export { HTMLError }
