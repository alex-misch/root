import HTMLAdapter from '../../core/interfaces/html-adapter'
import { selfClosedTags } from '../../utils/html.mjs';
import { customElements } from '../../mocks/custom-elements'

/**
 * Server-size Virtual Dom objects stringifier
 *
 */
class VirtualDomAdapter extends HTMLAdapter {

	constructor() {
		super()
		this.skipProps = ['safeHTML']
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
	async stringifyArr(instances, cssjs) {
		const strigifiers = instances.map( async inst => await this.stringify(inst, cssjs) )
		return (await Promise.all(strigifiers)).join('')
	}

	/**
	 * Convert virtualDOM instance to string
	 * @param {Object} instance {type, props, children} virtual-dom objject
	 * @param cssjs css of instance, will be attached on render fn
	 */
	async stringifyVD(instance, cssjs) {

		let { type: tagName, props, children } = instance
		if ( typeof cssjs[tagName] == 'object' ) {
			if ( typeof props == 'object' && props.hasOwnProperty('class') )
				props.class += cssjs[tagName].selector
			else
				props = { class: cssjs[tagName].selector }
		}

		if ( selfClosedTags.includes(tagName) ) {
			return `<${ tagName }${ this.stringifyProps(props) } ssr />`
		} else {
			let insideContent = ''
			let component = await this.createInstance(tagName, props)
			if ( component ) {
				let innerVirtualDOM = await this.render(component)
				if (innerVirtualDOM)
					insideContent = await this.stringify(innerVirtualDOM, cssjs)
			} else if (children && children.length) {
				insideContent = await this.stringify(children, cssjs)
			} else {
				insideContent = props.safeHTML || ''
			}

			return `<${ tagName }${ component && this.stringifyProps( component.attributes ) } ssr>${ insideContent }</${ tagName }>`
		}
	}

	/**
	 * Instance type checker. Call specify strigify function in case of instace type
	 * @param {*} instance any javascript variable that will be converted to string
	 * @param @optional cssjs css of this instance (optional)
	 */
	async stringify( instance, cssjs = {} ) {
		if ( Array.isArray(instance) )
			return await this.stringifyArr(instance, cssjs)

		if ( ['string','number','boolean'].includes(typeof instance) )
			return instance

		if ( instance === null || typeof instance === 'undefined' )
			return ''

		return this.stringifyVD(instance, cssjs)
	}


	/**
	 * Call specific functions of component that need to be called and render it
	 * @param { BMPVDWebComponent } component instance of WebComponent
	 * @return { Object<VirtualDOM> } component render result
	 */
	async render(component) {
		if ( typeof component.ready == 'function' )
			await component.ready()
		if ( typeof component.onAttached == 'function' )
			await component.onAttached()

		if ( typeof component.render == 'function' )
			return component.render()

		return null
	}

	/**
	 * Creates instnace of component if it defined in customElements and render it
	 * @param tagName tag of element
	 * @param attrs attributes of element
	 * @return { null|BMPVDWebComponent } component
	 */
	async createInstance(tagName, attrs) {
		const componentClass = customElements.get(tagName)
		if (componentClass) {
			const componentInstance = new componentClass.constructor()
			componentInstance.attributes = attrs
			return componentInstance
		}
		return null
	}

}

export default VirtualDomAdapter
