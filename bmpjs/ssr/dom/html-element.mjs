import { Element } from './element.mjs'
import et from 'elementtree'
import { customElements } from './custom-elements.mjs';

class HTMLElement extends Element {

	constructor(tagname, attributes, parent) {
		super(tagname, attributes, parent)
	}

	/** Events api */
	addEventListener() {}
	removeEventListener() {}

	// Event emitters
	focus() {}
	blur() {}
	click() {}

	closest() { return new HTMLElement('div') }

	querySelector() { return new HTMLElement('div') }
	querySelectorAll() {
		return []
	}

	set href(val) {
		this.setAttribute('href', val)
	}

	setMutationCallback(fn) {
		this._mutationCallback = fn
	}

	_mutation(mutationRecords) {
		if (typeof this._mutationCallback === 'function') {
			this._mutationCallback(mutationRecords)
		}
	}

	appendChild(node) {
		if (node instanceof Element)
			node.parent = this
		this.childNodes.push(node)
		this._mutation([{ addedNodes: [node] }])
	}

	_createElement({ tag, attrib, children }) {

		const CustomElement = customElements.get(tag)
		let el = null
		if (CustomElement) {
			el = new CustomElement.constructor(tag)
		} else {
			el = new HTMLElement(tag)
		}
		el.tagName = tag
		el.attributes = attrib
		if (children && children.length)
			el.childNodes = children.map( child => this._createElement(child) )
		return el
	}

	set innerHTML(content) {
		// const obj = et.parse(content)
		// const content = this._createElement( obj.getroot() )
		const _content = Array.isArray(content) ? content : [ content ]
		this.childNodes = _content
		this._mutation([{ addedNodes: _content }])
	}

	get innerHTML() {
		return this.childNodes.map( child => {
			return child instanceof Element ? child.outerHTML : child.toString()
		}).join('')
	}

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
