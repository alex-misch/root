import { Element } from './element.mjs'

class HTMLElement extends Element {

	constructor(tagname, attributes) {
		super(tagname, attributes)
	}

	/** Event mocks */
	addEventListener() {}
	removeEventListener() {}

	// Event emitters
	focus() {}
	blur() {}
	click() {}

	querySelector() {
		return new HTMLElement('div')
	}

	querySelectorAll() {
		return []
	}

	// set innerHTML(content) {
	// 	this.rawInnerHTML = content
	// }

	get hidden() { return false }
	get title() { return '' }
	get tabIndex() { return 1 }
	get style() { return {} }
	set style(arg) { this.style = arg }

	/** Work with data */
	get properties() { return this.attributes }
	get dataset() { return {} }

	/** Positioning */
	get offsetWidth() { return 0 }
	get offsetTop() { return 0 }
	get offsetParent() { return 0 }
	get offsetLeft() { return 0 }
	get offsetHeight() { return 0 }

	/** cryptographic number */
	get nonce() { return 0 }

	get noModule() { return false }

	/** Content representation */
	get innerText() { return '' }
	get isContentEditable() { return true }
	get contentEditable() { return true }

}

export { HTMLElement }
