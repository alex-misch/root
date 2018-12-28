import { default as Core } from 'bmpjs/core'
// import { default as css } from './suggested-routes.css.js'
import styles from './suggested-routes.sass'
Core.CssJS.inject(styles)

class SuggestedRoutes extends Core.StatelessWidget {

	static get tagname() {
		return 'suggested-routes'
	}


	content() {
		return this.html`
			<p>suggested-routes. context: ${ JSON.stringify(this.context) }</p>
		`
	}

}

export { SuggestedRoutes }
