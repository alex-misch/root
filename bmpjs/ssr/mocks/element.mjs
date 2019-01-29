class Element {

	constructor(tagname, attributes) {
		this._attributes = attributes || {}
		this.tagName = tagname
		this.className = ''
		this.childNodes = []

		this.id = undefined
	}

	/** Work with content */
	animate() {}
	closest() { return null }
	appendChild(node) { this.childNodes.push(node) }
	insertBefore() {}
	insertAdjacentElement() {}
	insertAdjacentHTML() {}
	get innerHTML() {
		return this.childNodes.map( child => {
			return child instanceof Element ? child.outerHTML : child
		}).join('')
	}
	get outerHTML() {
		return `<${this.tagName}>${ this.innerHTML }</${this.tagName}>`
	}

	/** Web Components api */
	get shadowRoot() { return null }
	get attachShadow() {}
	get createShadowRoot() {}
	get slot() { return '' }

	/** Work with properties */
	hasAttribute(key) { return this._attributes.hasOwnProperty(key) }
	getAttributeNames() {}
	getAttributeNS() {}

	getAttribute(key) {
		return this._attributes[key]
	}

	setAttribute(key, val) {
		this._attributes[key] = val
	}

	get attributes() {
		return {
			...this._attributes,
			className: this.className
		}
	}

	set attributes(props) {
		this._attributes = props
	}

	get classList() {
		return {
			add: (...classNames) => {
				if (!classNames.length) throw new Error(`Element.classList.add can'nt called without arguments`)
				this.className += (this.className ? ' ' : '') + classNames.join(' ')
			},
			remove: className => {
				this.className = this.className.replace(className, '')
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
