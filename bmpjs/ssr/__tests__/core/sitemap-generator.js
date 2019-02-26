import { SitemapGenerator } from '../../core/sitemap-generator'


describe("Sitemap generation", () => {

	test('XML Converter', () => {

		const sitemap = new SitemapGenerator([
			'/foo/bar/',
			'/foo/bar/baz/'
		], 'https://example.com')

		const expectedHead = `<?xml version="1.0" encoding="UTF-8" ?>`
		const expectedUrls = `<url><loc>https://example.com/foo/bar/</loc></url><url><loc>https://example.com/foo/bar/baz/</loc></url>`

		expect( sitemap.toXML() ).toBe(`${expectedHead}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${ expectedUrls }</urlset>`)
	})


})
