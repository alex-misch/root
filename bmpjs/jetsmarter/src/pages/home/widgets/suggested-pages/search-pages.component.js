import Core from 'bmpjs/core'
import styles from './search-pages.sass'
Core.CssJS.inject(styles)

class SearchPages extends Core.StatelessWidget {
	static get tagname() {
		return 'suggested-routes';
	}

	content() {
		return this.html`
			<p>search-pages. context: ${ JSON.stringify(this.context) }</p>
		`
	}

}
export { SearchPages }
