
import { HTMLElement } from './html-element.mjs'
class HTMLDocument extends HTMLElement {

	constructor() {
		super()
		this.body = new HTMLElement('body')
		this.head = new HTMLElement('head')
	}

	createTextNode(content) {
		return content
	}

	getElementById() {
		return new HTMLElement('div')
	}

	createElement(tag) {
		return new HTMLElement(tag)
	}

	get implementation() {
		return {
			createHTMLDocument: () => {}
		}
	}

}

export { HTMLDocument }
