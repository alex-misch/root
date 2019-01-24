class Element {

	constructor() {
		this._attributes = {}
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

	set attributes(props) {
		this._attributes = props
	}

	appendChild() {}

	matches() { return true }
	hasAttribute() { return false }


	get classList() {
		return {
			add() {},
			remove() {},
			toggle() {},
			contains() { return false; }
		}
	}

}

export { Element }
