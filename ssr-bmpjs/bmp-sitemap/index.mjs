

import { unifyPathname } from "../utils/path-unifier.mjs";


const header = `<?xml version="1.0" encoding="UTF-8" ?>`
const xmlUrlset = content => `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	${ content }
</urlset>
`
const xmlURL = url => `<url><loc>${ url }</loc></url>\n\t`

class BmpSitemap {

	constructor( urlConf, domain ) {

		this.urlConf = urlConf
		this.domain = domain
	}

	toXML() {

		const urls = this.urlConf.map( view => {
			// TODO: parse dynamic pathnames
			const absoluteURL = this.domain + unifyPathname( view.pattern )
			return xmlURL(absoluteURL)
		})
		return header + xmlUrlset( urls.join('') )

	}


}

export { BmpSitemap }
