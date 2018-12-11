// it is function because variable has cursor and bugs sometimes.
// Function will return new regexp instance every time it need
const slugRegex = _ => /\/:([\w-]+(?:{.*})?)/g // like /benefit/:slug/ or /benefit/:slug{param1|param2}/

/**
 * Convert passed pattern to valid regular expression
 * @private
 * @param {string} pattern bmp-based pattern than will be converted to regular expression
 */
const _convertToRegExp = pattern => {
  return pattern.replace( slugRegex(), '\/([\\w-\%]+)' )
}

/**
 * Returns true if pathname of url is match pattern
 * @param {string} url
 * @returns {Boolean}
 * @example
 * isPatternMatchUrl( '/benefits/:slug/', '/benefits/event/' ) // -> true
 * isPatternMatchUrl( '/fake/:slug/', '/benefits/event/' ) // -> false
 * isPatternMatchUrl( '/benefits/:slug{event1|event2}/', '/benefits/event1/' ) // -> true
 * isPatternMatchUrl( '/benefits/:slug{event1|event2}/', '/benefits/event3/' ) // -> false
 */
const isPatternMatchUrl = (pattern, pathname = location.pathname) => {

  if ( slugRegex().test( pattern ) ) { // pattern has dynamic segments
    if ( /{|}/.test( pattern ) ) { // pattern has "value" of dynamic segments
      const vals = extractValues( pattern, pathname )
      return Object.keys(vals).length > 0

    } else { // pattern has only dynamic segments without value declaration
      const regexp = _convertToRegExp( pattern ) //replace all dynamic segments to regexp values
      return new RegExp( `^${regexp}$` ).test( pathname ) // test pathname to according to regular expression
    }
  } else {
    return pattern === pathname // simply string
  }
  return false //default

}


/**
 * Parser for extected values in ":key{value1|value2}" syntax near dynamic pathname segment
 * and return clear key of this paramenets, test of expect and array of values
 * @param {String} key single segment of url pattern
 * @private
 * @returns {ExpectResult}
 * @example
 * _parseExpectedVals( ":slug" ) // -> { key: "slug", expectValues: [] }
 * _parseExpectedVals( ":slug{a|b}" ) // -> { key: "slug", expectValues: ['a', 'b'] }
 */
const _parseExpectedVals = key => {

  const isExpected = /{.*}/.test(key) // check for exists {} brackets in key
  let expectValues = []
  if ( isExpected ) {
    expectValues = key.replace( /.*?[\w-]+{(.*)}/, '$1' ).split('|') // get values from key
  }
  key = key.replace( /.*?([\w-]+)(?:{.*})?/, '$1' ) // remove trash from key

  return { key, expectValues }
}

/**
 * Extracts values from pathname by pattern. Returns pair key:value
 * @param {String} pattern patter of url that will be parsed
 * @param {String} pathname location pathname without base
 * @returns {Object} extracted values
 * @example
 * extractValues( '/benefits/:slug/:action/', '/benefits/lotte-plaza/share/' )
 * // -> { slug: 'lotte-plaza', action: 'share' }
 */
const extractValues = (pattern, pathname = location.pathname) => {

  // parse keys from pattern
  const paramsList = pattern.match( slugRegex() )

  // parse values from pathname
  const regexpPattern = _convertToRegExp( pattern ) // replace all dynamic segments to regexp values
  const regexp = new RegExp( `^${regexpPattern}$` )
  const urlSegments = pathname.match( regexp ) // array segments of url, first will contains full match

  let values = []
  if ( Array.isArray(paramsList) && urlSegments ) {
    // collect params and segments to object
    values = paramsList.reduce( (acc, param, index) => {
      if ( urlSegments[index + 1] ) {
        const val = urlSegments[index + 1] // skip full match element
        const { key, expectValues } = _parseExpectedVals( param ) // ask for expected vals (like :slug{s1|s2|s3})
        if ( !expectValues.length || expectValues.indexOf( val ) >= 0 ) {
          acc[ key ] = val // (not expected anything) or (expected array contains received value)
        }
      }

      return acc
    }, {})
  }

  return values
}

export { extractValues, isPatternMatchUrl }
