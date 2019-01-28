
/**
 * Escape (encode) &, <, >, ", ' symbols via HTML specification
 * @param { String } text
 */
const escapeHtml = text => {
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

export {
	escapeHtml,
	selfClosedTags,
}
