import { default as Core } from 'bmpjs/core'
// import { default as css } from './suggested-routes.css.js'


class SuggestedRoutes extends Core.StatelessWidget {

	static get tagname() {
		return 'suggested-routes'
	}


	content() {
		return `suggested-routes. parent counter: ${this.context.homepage.counter}`
	}

}

export { SuggestedRoutes }
