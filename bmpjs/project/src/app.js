import { default as Core } from 'bmpjs/core'
import { BmpRouter } from 'bmpjs/router'
import { config } from './app.config.js'

class MyApp extends Core.StatelessWidget {

	static get tagname() {
		return 'my-app'
	}

	trackView() {
		if (typeof ga == 'function')
			ga('send', 'pageview')
	}

	// get componentsRegistry() {
	// 	return config.components
	// }

	constructor() {
		super()
		this.router = BmpRouter.widget({
			viewDir: config.viewdir,
			urlconf: config.urlconf,
			onChange: this.trackView.bind(this)
		})
	}

	content() {
		this.render(this.router, this)
	}
}

customElements.define( MyApp.tagname, MyApp )
