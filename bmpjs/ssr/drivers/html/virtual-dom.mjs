import { HTMLElement } from '../../dom/html-element.mjs';
import { HTMLDocument } from '../../dom/html-document.mjs';
import { timeStamp } from '../../utils/timeline.mjs';

/**
 * Server-size Virtual Dom objects converter to HTML DOM instances
 */
class VirtualDOMDriver {


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
					return [ ...output, ...iter ] // WTF?
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
	async arrayToHTML(instances, parent) {
		const converters = instances.map( async inst => await this.deepRender(inst, parent) )
		return await Promise.all(converters)
	}

	getTag(vdtype) {
    // vd type can be constructor or string.
    // "is" getter will return autogenerated tagname
		return typeof vdtype === 'string' ? vdtype : vdtype.is
	}

	/**
	 * Convert virtualDOM instance to string
	 * @param {Object} instance {type, props, children} virtual-dom objject
	 * @param cssjs css of instance, will be attached on render fn
	 */
	async virtualDOMtoHTML(instance, parent) {

		const { type: vdtype, props, children = [] } = instance
		const element = HTMLDocument.createElement( this.getTag(vdtype), {}, parent )
		if ( props )  {
      // convert props to key:value storage, write to attributes (simulate browser API)
			element.attributes = Object.keys(props).map( key => ({ name: key, value: props[key] }) )
			const ref = element.getAttribute('ref')
			if (typeof ref === 'function') {
				ref(element) // reference function
      } else if (props.hasOwnProperty('ref')) {
				instance.props.ref = element // simple binding
      }
		}

		element.innerHTML = await Promise.all(
			children.map( child => this.deepRender(child) )
		)
		await this.render(element)
		return element
	}

	/**
	 * Instance type checker. Call specify strigify function in case of instace type
	 * @param {*} instance any javascript variable that will be converted to string
	 * @param @optional cssjs css of this instance (optional)
	 */
	async deepRender( content, parent ) {
		if ( ['string','number','boolean'].includes(typeof content) ) {
			return content.toString()
		}

		if ( content instanceof HTMLElement ) {
			await this.render(content)
			// console.error(content)
			return content
		}

		if ( !content ) // like a null, undefined and other unexpected values
			return ''

		if ( Array.isArray(content) )
			return await this.arrayToHTML(content, parent)

		return await this.virtualDOMtoHTML(content, parent)
	}


	/**
	 * Call specific functions of component that need to be called and set to childNodes result
	 * @param { BMPVDWebComponent } component instance of WebComponent
	 * @return { void }
	 */
	async render(component) {
		// save old childnodes of component

		if ( typeof component.render == 'function' ) {
			//  most likely a virtualDOM component
			if ( typeof component.ready == 'function' )
				await component.ready()
			if ( typeof component.onAttached == 'function' )
				await component.onAttached()

			if ( typeof component.render == 'function' ) {
				const htmlChild = await this.virtualDOMtoHTML(component.render(), component)
				component.appendChild(htmlChild)
			}

		} else if ( typeof component.connectedCallback == 'function' ) {
			// most likely a customElement
			await component.connectedCallback()
		}

		if ( component.hasAttribute('safeHTML') ) {
			component.appendChild(component.getAttribute('safeHTML'))
		}


	}


}

export default VirtualDOMDriver
