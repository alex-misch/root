class Element {

	constructor() {
		this._attributes = {}
		this.className = ''
	}

	/** Element mocks */
	insertBefore() {}
	insertAdjacentElement() {}
	insertAdjacentHTML() {}

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

	appendChild() {}

	matches() { return true }
	hasAttribute() { return false }


	get classList() {
		return {
			add: (...classNames) => {
				if (!classNames.length) throw new Error(`Can'nt add class ${className}`)
				this.className += (this.className ? ' ' : '') + classNames.join(' ')
			},
			remove: () => {},
			toggle: () => {},
			contains: () => { return false; }
		}
	}

}

export { Element }
