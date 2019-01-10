
import { HTMLElement } from './html-element.mjs'
class HTMLDocument {

	constructor() {

		this.body = new HTMLElement('body')
	}

	createElement(tag) {
		return new HTMLElement(tag)
	}

}

export { HTMLDocument }
