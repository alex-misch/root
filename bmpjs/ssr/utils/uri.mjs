
/**
 * Replace all double+ slashes and check for exists / in end end start of url
 * @method
 * @param {string} path path that will be unified
 * @example
 * p1 = unifyPathname('///foo/bar//baz')
 * p1 === '/foo/bar/baz/' // -> true
 * p2 = unifyPathname('foobar/baz')
 * p1 === '/foobar/baz/' // -> true
 */
const unifyPathname = path => {
	if ( path === '/' || path == '' ) return '/'
  return path
    .replace( /^\/?([^?#]+?)\/?((?=\?|#).*)?$/, '/$1/$2' ) // add end slash and start slash
    .replace( /\/\/+/g, '/' ) // remove multiple slashes
}

/**
 * @example
 * hasDynamic( '/benefits/:slug/' ) // -> true
 * hasDynamic( '/benefits/:slug{event1|event2}/' ) // -> true
 * hasDynamic( '/normal/url/' ) // -> false
 */
const hasDynamic = url => /\/:([\w-]+(?:{.*})?)/.test( url )

/**
 * Parser for extected values in ":key{value1|value2}" syntax near dynamic pathname segment
 * and return clear key of this paramenets, test of expect and array of values
 * @param {String} key single segment of url pattern
 * @private
 * @returns {ExpectResult<key, expectValues>} what expecting to replacement
 * @example
 * _parseExpectedVals( ":slug" ) // -> { key: false, expectValues: [] }
 * _parseExpectedVals( ":slug" ) // -> { key: "slug", expectValues: [] }
 * _parseExpectedVals( ":slug{a|b}" ) // -> { key: "slug", expectValues: ['a', 'b'] }
 */
const _parseExpectedVals = key => {
  let expectValues = []
	if (!/^:/.test(key))
		return { key: false, expectValues }

  const isExpected = /{.*}/.test(key) // check for exists {} brackets in key
  if ( isExpected ) {
    expectValues = key.replace( /.*?[\w-]+{(.*)}/, '$1' ).split('|') // get values from key
  }
  key = key.replace( /.*?([\w-]+)(?:{.*})?/, '$1' ) // remove trash from key

  return { key, expectValues }
}

/**
 * Repalces dynamic parts of patter to passed values
 * @param pattern
 * @param values
 */
const replaceDynamicParts = (pattern, values) => {
	const uri =  pattern
		.split('/')
		.filter( segment => segment != '' )
		.map( segment => {
			const { key } = _parseExpectedVals( segment )
			if ( !key ) return segment // not expected any replacements
			return values[key]
		})
		.join('/')
	return unifyPathname( uri )
}

export {
	unifyPathname,
	hasDynamic,
	replaceDynamicParts
}
