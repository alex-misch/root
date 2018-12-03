import { replaceLink } from "../../src/utils/replace-link";

class CustomLink {
	constructor(href) {
		this.href = href
	}
	getAttribute(param) {
		return this[ param ]
	}
}

describe( "Replace link test", () => {


	test( "Add link node with good url", () => {

		const origin = 'https://example.com'

		const link = new CustomLink( '/foo/bar/' )
		const newLink = new CustomLink( '/foo/bar/' )
		replaceLink( newLink, origin )

		expect( newLink.href ).toBe( `${origin}${link.href}` )

	})
	test( "Add link node with external url", () => {

		const origin = 'https://example.com'

		const link = new CustomLink( 'http://test.com/foo/bar/' )
		const newLink = new CustomLink( 'http://test.com/foo/bar/' )
		replaceLink( newLink, origin )

		expect( newLink.href ).toBe( link.href )

	})
	test( "Add link node with external url without protocol", () => {

		const origin = 'https://example.com'

		const link = new CustomLink( '//foo/bar/' )
		const newLink = new CustomLink( '//foo/bar/' )
		replaceLink( newLink, origin )

		expect( newLink.href ).toBe( link.href )

	})
})
