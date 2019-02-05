import { stringifyProps, selfClosedTags } from "../utils/html.mjs";

class Element {

	constructor(tagName, attributes) {
		this._attributes = attributes || {}
		if (tagName) this.tagName = tagName
		this.childNodes = []
		this.children = this.childNodes

		this.id = ''
	}

	/** Work with content */
	animate() {}
	closest() { return null }
	appendChild(node) { this.childNodes.push(node) }
	insertBefore() {}
	insertAdjacentElement() {}
	insertAdjacentHTML() {}

	get outerHTML() {
		const props = stringifyProps(this.attributes)
		if ( selfClosedTags.includes(this.tagName) )
			return `<${this.tagName}${ props } ssr />`
		else
			return `<${this.tagName}${ props } ssr>${ this.innerHTML }</${this.tagName}>`
	}


	/** Web Components api */
	get shadowRoot() { return null }
	get attachShadow() {}
	get createShadowRoot() {}
	get slot() { return '' }

	/** Working with attributes */
	hasAttribute(key) {
		return this._attributes.hasOwnProperty(key)
	}
	getAttributeNames() {}
	getAttributeNS() {}

	getAttribute(key) {
		return this._attributes[key]
	}

	removeAttribute(key) {
		delete this._attributes[key]
	}

	setAttribute(key, val) {
		this._attributes[key] = val
	}

	get attributes() {
		return this._attributes
	}

	set attributes(props) {
		this._attributes = props || {}
	}

	get classList() {
		return {
			add: (...classNames) => {
				if (!classNames.length) throw new Error(`Element.classList.add can'nt called without arguments`)
				this.attributes.class = (this.attributes.class ? `${this.attributes.class} ` : '') + classNames.join(' ')
			},
			remove: className => {
				this.attributes.class = this.attributes.class.replace(className, '')
			},
			toggle: () => {},
			contains: () => { return false; }
		}
	}

	/** Is node is equal with another */
	matches() { return true }

	/** Positioning */
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
