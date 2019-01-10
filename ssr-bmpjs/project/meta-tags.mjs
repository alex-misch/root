const prefixes = [ '', 'twitter', 'og' ]

class MetaTags {

	constructor( tags = {} ) {
		this.tags = tags

	}

	stringify() {
		return Object.keys( this.tags ).map( tag => {
			return prefixes.map(
				prefix => `<meta content="${ prefix + tag }" value="${ this.tags[tag] }" />`
			).join('')
		}).join('')
	}


}

export { MetaTags }
