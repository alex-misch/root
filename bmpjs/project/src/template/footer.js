
import { Template } from 'bmpjs/core'

import { elem, text } from '../theme/index.js'

class Footer extends Bmp.CustomElement {

	static get tag() {
		return 'bmp-footer'
	}

	ready() {

	}


	content() {
		return `
			<p>Footer</p>
		`
	}

}

export { Footer }
