/**
 * Escape (encode) &, <, >, ", ' symbols via HTML specification
 * @param { String } text
 */
const escapeHtml = text => {
	if ( typeof text !== 'boolean' && !text ) return ''
	if ( !(text instanceof String) ) text = text.toString()
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
 * const f = stringifyProps([
 * 		{name: "class", value: "hello"},
 * 		{name: "onclick", value: function() {} }
 * ])
 * f === `class="hello"` // true
 *
 */
const stringifyProps = props => {
	if ( !props || !Array.isArray(props) || !props.length ) return ''
	return " "+props
			.filter( prop => ['string', 'boolean', 'number'].includes( typeof prop.value ) )
			.filter( ({ name, value }) => !skipProps.includes(name) && (typeof value != 'boolean' || value !== false) )
			.filter( ({ name, value }) => !(transformPropKey(name) == 'class' && !value) )
			.map( ({ name, value }) => `${ transformPropKey(name) }="${ escapeHtml(value) }"` )
			.join(' ')
}

export {
	escapeHtml,
	selfClosedTags,
	stringifyProps,
}
