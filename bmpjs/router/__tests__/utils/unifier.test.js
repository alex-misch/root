
import { unifyPathname } from "../../src/utils/path-unifier.js"


describe( "Unify pathname", () => {
  
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