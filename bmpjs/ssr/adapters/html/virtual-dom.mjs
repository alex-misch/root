import HTMLAdapter from '../../core/interfaces/html-adapter'
import { customElements } from '../../dom/custom-elements'
import { HTMLElement } from '../../dom/html-element.mjs';
import { HTMLDocument } from '../../dom/html-document.mjs';

/**
 * Server-size Virtual Dom objects converter to HTML DOM instances
 */
class VirtualDomAdapter extends HTMLAdapter {

	constructor() {
		super()
	}

	/**
	 * Creates VirtualDOM object
	 * @param type like a tagName
	 * @param props VD attributes|listeners|etc
	 * @param children child VirtualDOM objects
	 */
	static createElement( type, props, ...children ) {
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
	}

	/**
	 * Convert array of some types to string
	 * @param {Array} instances list of instances
	 * @param cssjs css of this instances
	 */
	async arrayToHTML(instances) {
		const converters = instances.map( async inst => await this.convertToHTML(inst) )
		return await Promise.all(converters)
	}

	/**
	 * Convert virtualDOM instance to string
	 * @param {Object} instance {type, props, children} virtual-dom objject
	 * @param cssjs css of instance, will be attached on render fn
	 */
	async virtualDOMtoHTML(instance) {

		let { type: tagName, props, children = [] } = instance
		let element = HTMLDocument.createElement(tagName)
		element.attributes = props
		if ( typeof props.ref == 'function' ) props.ref(element)
		await this.render(element, children)
		return element
	}

	/**
	 * Instance type checker. Call specify strigify function in case of instace type
	 * @param {*} instance any javascript variable that will be converted to string
	 * @param @optional cssjs css of this instance (optional)
	 */
	async convertToHTML( content ) {
		if ( content instanceof HTMLElement ) {
			await this.render(content)
			return content
		}

		if ( ['string','number','boolean'].includes(typeof content) )
			return content.toString()

		if ( !content ) // like a null, undefined and other unexpected values
			return ''

		if ( Array.isArray(content) )
			return await this.arrayToHTML(content)

		return await this.virtualDOMtoHTML(content)
	}


	/**
	 * Call specific functions of component that need to be called and set to childNodes result
	 * @param { BMPVDWebComponent } component instance of WebComponent
	 * @return { void }
	 */
	async render(component, childrens = []) {
		let arrChilds = childrens
		if ( component.hasAttribute('safeHTML') )
			arrChilds.push(component.getAttribute('safeHTML'))

		if ( typeof component.render == 'function' ) {
			//  most likely a virtualDOM component
			if ( typeof component.ready == 'function' )
				await component.ready()
			if ( typeof component.onAttached == 'function' )
				await component.onAttached()

			arrChilds.push( await component.render() )
		} else if ( typeof component.connectedCallback == 'function' ) {
			// most likely a customElement
			await component.connectedCallback()
			arrChilds.push( ...component.childNodes )
		}
		component.childNodes = await this.convertToHTML(arrChilds)
	}


}

export default VirtualDomAdapter
