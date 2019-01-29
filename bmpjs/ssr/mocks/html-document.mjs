
import { HTMLElement } from './html-element'
import { customElements } from './custom-elements'

class HTMLDocument extends HTMLElement {

	constructor(baseURI) {
		super()
		this.body = new HTMLElement('body')
		this.head = new HTMLElement('head')
		this.baseURI = baseURI
	}

	createTextNode(content) {
		return content
	}

	getElementById() {
		return new HTMLElement('div')
	}

	createElement(tag) {
		const CustomElement = customElements.get(tag)
		if (CustomElement) {
			const instance = new CustomElement.constructor(tag)
			instance.tagName = tag
			return instance
		} else {
			return new HTMLElement(tag)
		}
	}

	get implementation() {
		return {
			createHTMLDocument: () => {}
		}
	}

}

export { HTMLDocument }
