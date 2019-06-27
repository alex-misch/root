
import { stringifyProps, selfClosedTags } from '../utils/html'


class Element {

	constructor(tagName, attributes = [], parent) {
		this.attributes = attributes || []
		if (tagName) {
			this.tagName = tagName
			this.nodeName = tagName
		}
		this.childNodes = []
		this.children = this.childNodes
		this.nodeType = 3

		this.id = ''
		this.parent = parent
	}

	/** Work with content */
	animate() {}
	get parentNode() { return this.parent }

	insertBefore() {}
	insertAdjacentElement() {}
	insertAdjacentHTML() {}

	/** Web Components api */
	get shadowRoot() { return null }
	get attachShadow() {}
	get createShadowRoot() {}
	get slot() { return '' }

	/** Working with attributes */
	hasAttribute(key) {
		return Boolean( this.getAttribute(key) )
	}
	getAttributeNames() {
		return this._attributes.map( attr => attr.name )
	}
	getAttributeNS() {}

	getAttribute(key) {
		const prop = this._attributes.find( ({ name }) => name == key )
		return prop ? prop.value : ''
	}

	getRawAttribute(key) {
		return this._attributes.find( ({ name }) => name == key )
	}

	removeAttribute(key) {
		delete this._attributes[key]
	}

	setAttribute(key, val) {
		const attr = this.getAttribute(key)
		if ( attr )
			this.getRawAttribute(key).value = val
		else
			this._attributes.push({ name: key, value: val })
	}

	get attributes() {
		return this._attributes
	}
	set attributes(attrs) {
		return this._attributes = Array.isArray(attrs) ? attrs : []
	}

	get outerHTML() {
		const props = stringifyProps(this._attributes)
		if ( selfClosedTags.includes(this.tagName) )
			return `<${this.tagName}${ props } ssr />`
		else
			return `<${this.tagName}${ props } ssr>${ this.innerHTML }</${this.tagName}>`
	}

	get classList() {
		return {
			add: (...classNames) => {
				if (!classNames.length) throw new Error(`Element.classList.add can'nt called without arguments`)
				const classAttr = this.getAttribute('class')
				this.setAttribute('class', (classAttr ? `${classAttr} ` : '') + classNames.join(' ') )
			},
			remove: className => {
				const current = this.getAttribute('class')
				this.setAttribute('class', current ? current.replace(className, '') : '' )
			},
			toggle: () => {},
			contains: () => { return false; }
		}
	}

	/** Is node is equal with another */
	matches() { return true }

	/** Positioning */
	getBoundingClientRect() {
		return { top: 0, bottom: 0, left: 0, right: 0 }
	}
	get clientHeight() { return 0 }
	get clientLeft() { return 0 }
	get clientTop() { return 0 }
	get clientWidth() { return 0 }

	get scrollHeight() { return 0 }
	get scrollLeft() { return 0 }
	get scrollLeftMax() { return 0 }
	get scrollTop() { return 0 }
	get scrollTopMax() { return 0 }
	get scrollWidth() { return 0 }

	computedStyleMap() {}

	/** Events api */
	dispatchEvent() {}
}

export { Element }
