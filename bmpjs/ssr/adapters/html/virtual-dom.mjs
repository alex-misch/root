import HTMLAdapter from '../../core/interfaces/html-adapter'
import { selfClosedTags } from '../../utils/html.mjs';
import { customElements } from '../../mocks/custom-elements'
import { stringifyProps } from '../../utils/html.mjs';

/**
 * Server-size Virtual Dom objects stringifier
 *
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
	async stringifyArr(instances) {
		const strigifiers = instances.map( async inst => await this.stringify(inst) )
		return (await Promise.all(strigifiers)).join('')
	}

	/**
	 * Convert virtualDOM instance to string
	 * @param {Object} instance {type, props, children} virtual-dom objject
	 * @param cssjs css of instance, will be attached on render fn
	 */
	async stringifyVD(instance) {

		let { type: tagName, props, children } = instance

		if ( selfClosedTags.includes(tagName) ) {
			return `<${ tagName }${ stringifyProps(props) } ssr />`
		} else {
			let insideContent = ''
			let component = await this.createInstance(tagName, props)
			if ( component ) {
				let template = await this.render(component)
				if (template) insideContent += await this.stringify(template)
			}
			if (children && children.length) {
				insideContent += await this.stringify(children)
			}
			if (props.safeHTML) {
				insideContent += props.safeHTML
			}

			return `<${ tagName }${ stringifyProps( component ? component.attributes : props ) } ssr>${ insideContent }</${ tagName }>`
		}
	}

	/**
	 * Instance type checker. Call specify strigify function in case of instace type
	 * @param {*} instance any javascript variable that will be converted to string
	 * @param @optional cssjs css of this instance (optional)
	 */
	async stringify( instance ) {
		if ( ['string','number','boolean'].includes(typeof instance) )
			return instance.toString()

		if ( !instance )
			return ''

		if ( Array.isArray(instance) )
			return await this.stringifyArr(instance)

		return await this.stringifyVD(instance)
	}


	/**
	 * Call specific functions of component that need to be called and render it
	 * @param { BMPVDWebComponent } component instance of WebComponent
	 * @return { Object<VirtualDOM>|String } component render result
	 */
	async render(component) {
		if ( typeof component.render == 'function' ) {
			// like a virtualDOM component
			if ( typeof component.ready == 'function' )
				await component.ready()
			if ( typeof component.onAttached == 'function' )
				await component.onAttached()

			return component.render()
		} else {
			// customElement
			await component.connectedCallback()
			const childRenderers = component.childNodes.map( async child => {
				const result = await this.render(child)
				return await this.stringify(result)
			})
			component.childNodes = await Promise.all( childRenderers )
			return component.outerHTML
		}
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
			componentInstance.tagName = tagName
			return componentInstance
		}
		return null
	}

}

export default VirtualDomAdapter
