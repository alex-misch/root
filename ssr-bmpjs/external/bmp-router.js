import { BMPVD } from 'bmp-core'
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

// const importExternal = uri => {
// 	return new Promise( (resolve, reject) => {
// 		request.get( { uri }, (err, response) => {
// 			if (err) reject(err)

// 			var m = new Module()
// 			m._compile(response.body);
// 			resolve( m.exports )
// 		})
// 	})
// }

class BmpRouter {

	static config( config ) {
	}


	connectedCallback() {
		const uri = request.uri
		const entryPoint = routerConf.urlConf.find( view => isPatternMatchUrl( view.pattern, uri )  )

		let view = ''
		if ( !entryPoint ) {
			view = routerConf.not_found_template
		} else {
			view = BMPVD.createBMPVirtulaDOMElement( entryPoint.tagname )
		}
		return BMPVD.createBMPVirtulaDOMElement(
			routerConf.viewTag, { pathname: uri }, view
		)
		// return (
		// 	<ViewTag>
		// 		<EntryPoint pathname={ this.uri }>
		// 			${ entrypoint ? < }
		// 		</EntryPoint>
		// 	</ViewTag>
		// )

	}
}

customElements.define( 'bmp-router', BmpRouter )
export { BmpRouter }
