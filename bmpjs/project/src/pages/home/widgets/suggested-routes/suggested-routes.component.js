
import { DynamicWidget } from 'bmp-core'

import { default as css } from './suggested-routes.css.js'

class SuggestedRoutes extends WebComponentWidget {

	static get tagname() {
		return 'suggested-routes';
	}


	styles() {
		return this.setCss(css)
	}

	async ready() {
		return Promise.resolve()
	}

	beforeAttached() {

	}

	afterAttached() {

	}

	beforeDetached() {

	}

	afterDetached() {

	}

	widget() {
		return this.html`
			<p>Hello</p>
			<p>world!</p>
		`
	}

}

export { SuggestedRoutes }
