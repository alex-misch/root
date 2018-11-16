import { Theme } from 'bmp-core'

class Elements extends Theme.Element {

	Button(inner, modificators) {
		return `<button ${ this.style(modificators) }>${ inner }</button>`
	}

	Input(props, modificators) {
		return `<input ${ this.style(modificators) } ${ this.props(props) } />`
	}

}

export default new Elements
