
/**
 * Escape (encode) &, <, >, ", ' symbols via HTML specification
 * @param { String } text
 */
const escapeHtml = text => {
	if (!(text instanceof String))
		text = text.toString()
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
}

const selfClosedTags = [
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
]
const skipProps = ['safeHTML']
const transformPropKey = key => key == 'className' ? 'class' : key


/**
 * Stringify props from object to HTML tag view
 * Skip all except string, boolean and numbers in props
 * @param { Object } props
 * @example
 * const f = stringifyProps({ class: 'hello', rel: 'link', onclick: function() {} })
 * f === `class="hello" rel="link"` // true
 *
 */
const stringifyProps = props => {
	if ( !props || typeof props != 'object' || !Object.keys(props).length ) return ''
	return " " + Object.keys(props)
			.filter( key => ['string', 'boolean', 'number'].includes( typeof props[key] ) )
			.filter( key => !skipProps.includes(key) && (typeof key != 'boolean' || key !== false) )
			.filter( key => !(transformPropKey(key) == 'class' && !props[key]) )
			.map( key => `${ transformPropKey(key) }="${ escapeHtml(props[key]) }"` )
			.join(' ')
}

export {
	escapeHtml,
	selfClosedTags,
	stringifyProps,
}
