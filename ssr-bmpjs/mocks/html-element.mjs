import { Element } from './element.mjs'

class HTMLElement extends Element {

	constructor(tagname, options = {}) {
		super()
		this.tagName = tagname
	}

	/** Event mocks */
	addEventListener() {}
	removeEventListener() {}

}

export { HTMLElement }
