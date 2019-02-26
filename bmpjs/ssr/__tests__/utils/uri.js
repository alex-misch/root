
import {
	hasDynamic,
	unifyPathname,
	replaceDynamicParts
} from '../../utils/uri'
describe("unifyPathname", () => {

  test( "url without segments", () => {
    expect( unifyPathname( '' ) ).toBe( '/' )
    expect( unifyPathname( '/' ) ).toBe( '/' )
    expect( unifyPathname( '////' ) ).toBe( '/' )
  })


  test( "url with segments", () => {

    [
      '/foo//bar///baz/////',
      'foo//bar///baz',
      '/foo/bar//baz',
      'foo/bar//baz/',
    ].forEach( pathname => {
      expect( unifyPathname( pathname ) ).toBe( '/foo/bar/baz/' )
    })
  })
  test( "url with parameters", () => {

    expect( unifyPathname( `/foo//bar///baz/?foo=bar` ) ).toBe( '/foo/bar/baz/?foo=bar' )
    expect( unifyPathname( `foo//bar///baz?foo=bar` ) ).toBe( '/foo/bar/baz/?foo=bar' )
    expect( unifyPathname( `/foo/bar//baz#foo=bar` ) ).toBe( '/foo/bar/baz/#foo=bar' )
    expect( unifyPathname( `/foo/bar//baz/?bar=baz#foo=bar` ) ).toBe( '/foo/bar/baz/?bar=baz#foo=bar' )
    expect( unifyPathname( `/foo/bar/baz/?foo=bar&bar=baz` ) ).toBe( '/foo/bar/baz/?foo=bar&bar=baz' )

  })

})

describe("hasDynamic", () => {

	test("with dynamic", () => {
		expect( hasDynamic('/blog/:slug/') ).toBeTruthy()
		expect( hasDynamic('/about/s2/:board_member/') ).toBeTruthy()
	})

	test("without dynamic", () => {
		expect( hasDynamic('/blog/') ).toBeFalsy()
		expect( hasDynamic('/about/membership/') ).toBeFalsy()
	})

})

describe("replaceDynamicParts", () => {

	test("last segment", () => {
		expect(
			replaceDynamicParts('/blog/:slug/', { slug: 'lol-kek' })
		).toBe( '/blog/lol-kek/' )

		expect(
			replaceDynamicParts('/blog/s2/:slug/', { slug: 'lol-kek' })
		).toBe( '/blog/s2/lol-kek/' )

	})

	test("middle segment", () => {
		expect(
			replaceDynamicParts('/blog/s2/:some_big_name/s3/', { some_big_name: 'foobar' })
		).toBe( '/blog/s2/foobar/s3/' )

		expect(
			replaceDynamicParts('/blog/:some_big_name/s2/s3/', { some_big_name: 'foobar' })
		).toBe( '/blog/foobar/s2/s3/' )

	})

	test("first segment", () => {
		expect(
			replaceDynamicParts('/:first_segment/', { first_segment: 'baz' })
		).toBe( '/baz/' )
		expect(
			replaceDynamicParts('/:first_segment/s2/', { first_segment: 'baz' })
		).toBe( '/baz/s2/' )
	})

})
