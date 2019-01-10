class Element {

	/** Element mocks */
	insertAdjacentElement() {}
	insertAdjacentHTML() {}

	getAttribute() {}
	setAttrobite() {}

	get attributes() {
		return {}
	}

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
