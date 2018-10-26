
import { extractValues, isPatternMatchUrl } from  '../../src/utils/path-parser.js'

const routes = [
  { url: '/', template: `<root></root>` },
  { url: '/foo/', template: `<foo></foo>` },
  { url: '/foo/:slug/', template: `<foo-with-slug></foo-with-slug>` },
  { url: '/bar/baz/', template: `<bar-baz></bar-baz>` },
  { url: '/any-action/:action{share|download|get-app}/', template: `<action></action>` }
]


describe( "Test url parsers helper", () => {

  test( "root url", () => {
    let locationPathname = '/'

    let route = routes.find( route => isPatternMatchUrl( route.url, locationPathname ) )

    expect( route ).toEqual( routes.find( r => r.template === '<root></root>' ) )
  })

  test( "pattern without dynamic segments", () => {
    let locationPathname = '/bar/baz/'

    let route = routes.find( route => isPatternMatchUrl( route.url, locationPathname ) )

    expect( route ).toEqual( routes.find( r => r.template === '<bar-baz></bar-baz>' ) )
  })

  test( "pattern with any dynamic segments", () => {
    let locationPathname = '/foo/bar/'

    let route = routes.find( route => isPatternMatchUrl( route.url, locationPathname ) )
    const values = extractValues( route.url, locationPathname )

    expect( route ).toEqual( routes.find( r => r.template === '<foo-with-slug></foo-with-slug>' ) )
    expect( values.slug ).toBe( 'bar' )
  })


  test( "pattern with expected dynamic segments", () => {
    let locationPathname = '/any-action/share/'

    let route = routes.find( route => isPatternMatchUrl( route.url, locationPathname ) )
    let values = extractValues( route.url, locationPathname )

    expect( route ).toEqual( routes.find( r => r.template === '<action></action>' ) )
    expect( values.action ).toBe( 'share' )


    locationPathname = '/any-action/list/' // no such action

    route = routes.find( route => isPatternMatchUrl( route.url, locationPathname ) )
    expect( route ).toBeFalsy()
  })

})
