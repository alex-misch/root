import { customElements } from '../mocks/custom-elements'

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

const selfClosedTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']
const transformPropKey = key => key == 'className' ? 'class' : key

/**
 * Stringify props from object to HTML tag view
 * Skip all except string, boolean and numbers in props
 * @param { Object } props
 * @example
 * stringifyProps({ class: 'hello', rel: 'link', onclick: function() {} })
 * // -> String( 'class="hello" rel="link"' )
 *
 */
const stringifyProps = props => {
	if ( !props || typeof props != 'object' || !Object.keys(props).length ) return ''

	const forbiddenKeys = ['safeHTML']
	return " " + Object.keys(props)
			.filter( key => ['string', 'boolean', 'number'].includes( typeof props[key] ) )
			.filter( key => !forbiddenKeys.includes(key) && (typeof key != 'boolean' || key !== false) )
			.map( key => `${ transformPropKey(key) }="${ escapeHtml(props[key]) }"` )
			.join(' ')
}

const attachComponent = async component => {
	if ( typeof component.ready == 'function' )
		await component.ready()
	if ( typeof component.onAttached == 'function' )
		await component.onAttached()

	if ( typeof component.render == 'function' )
		return component.render()

	return null
}

const renderVDByTag = async (tagName, props) => {
	const componentClass = customElements.get(tagName)
	if (componentClass) {
		const componentInstance = new componentClass.constructor()
		componentInstance.attributes = props
		return await attachComponent(componentInstance)
	}
	return null
}

/**
 * Server-size Virtual Dom objects stringifier
 *
 */
const BMPVD = {

	createBMPVirtualDOMElement( type, props, ...children ) {
    return {
			type,
			props: props || {},
			children: children.reduce(( output, iter ) => {
				if ( Array.isArray( iter ))
					return [ ...output, ...iter ]
				else
					return [ ...output, iter ]
			}, []).filter( child => child !== null )
		}
	},

	async stringifyArr(instances, cssjs) {
		const strigifiers = instances.map( async inst => await BMPVD.stringify(inst, cssjs) )
		return (await Promise.all(strigifiers)).join('')
	},

	async stringifyVD(instance, cssjs) {

		let { type: tagName, props, children } = instance
		if ( typeof cssjs[tagName] == 'object' ) {
			if ( typeof props == 'object' && props.hasOwnProperty('class') )
				props.class += cssjs[tagName].selector
			else
				props = { class: cssjs[tagName].selector }
		}


		if ( selfClosedTags.includes(tagName) ) {
			return `<${ tagName }${ stringifyProps(props) } ssr />`
		} else {
			let insideContent = ''
			let innerVirtualDOM = await renderVDByTag(tagName, props)
			if (innerVirtualDOM)
				insideContent = await BMPVD.stringify(innerVirtualDOM, cssjs)
			else if (children && children.length)
				insideContent = await BMPVD.stringify(children, cssjs)
			else
				insideContent = props.safeHTML || ''

			return `<${ tagName }${ stringifyProps(props) } ssr>${ insideContent }</${ tagName }>`
		}
	},

	async stringify( instance, cssjs = {} ) {
		if ( Array.isArray(instance) )
			return await BMPVD.stringifyArr(instance, cssjs)

		if ( ['string','number','boolean'].includes(typeof instance) )
			return instance

		if ( instance === null || typeof instance === 'undefined' )
			return ''

		return BMPVD.stringifyVD(instance, cssjs)
	}

}


/**
 * Server-Side mock for BmpApp
 */
class BmpApp {

	attach( element ) {
		// console.log( 'App element attached', element )
		this.elementToAttach = element
	}


	registerAsyncComponents( list ) {
		// console.log( `registerAsyncComponents: `, list )
		this.components = list
	}

}

export { BMPVD, BmpApp }
