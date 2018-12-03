
import Bmp from 'bmpjs/core'

class Header extends Bmp.CustomElement {

	static get tag() {
		return 'bmp-header'
	}

	build() {
		return this.html`
			<p>Header</p>
		`
	}

}

export { Header }
