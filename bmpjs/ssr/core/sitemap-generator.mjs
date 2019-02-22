

import { unifyPathname } from "../utils/uri.mjs";


const header = `<?xml version="1.0" encoding="UTF-8" ?>`
const xmlUrlset = content => `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${ content }</urlset>
`
const xmlURL = url => `<url><loc>${ url }</loc></url>`

class SitemapGenerator {

	constructor( routes, domain ) {

		this.routes = routes
		this.domain = domain
	}

	toXML() {

		const urls = this.routes.map( uri => {
			// TODO: parse dynamic pathnames
			const absoluteURL = this.domain + unifyPathname( uri )
			return xmlURL(absoluteURL)
		})
		return header + xmlUrlset( urls.join('') )

	}


}

export { SitemapGenerator }
