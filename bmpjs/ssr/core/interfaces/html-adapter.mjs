import { escapeHtml } from "../../utils/html.mjs";

/**
 * @interface HTMLAdapter
 * Adapter interface for "object-to-html" stringify classes
 */
class HTMLAdapter {

	constructor() {
		this.skipProps = []
	}

	transformPropKey(key) {
		return key == 'className' ? 'class' : key
	}

	/**
	 * Stringify props from object to HTML tag view
	 * Skip all except string, boolean and numbers in props
	 * @param { Object } props
	 * @example
	 * stringifyProps({ class: 'hello', rel: 'link', onclick: function() {} })
	 * // -> String( 'class="hello" rel="link"' )
	 *
	 */
	stringifyProps(props) {
		if ( !props || typeof props != 'object' || !Object.keys(props).length ) return ''

		return " " + Object.keys(props)
				.filter( key => ['string', 'boolean', 'number'].includes( typeof props[key] ) )
				.filter( key => !this.skipProps.includes(key) && (typeof key != 'boolean' || key !== false) )
				.map( key => `${ this.transformPropKey(key) }="${ escapeHtml(props[key]) }"` )
				.join(' ')
	}

}

export default HTMLAdapter
