import { default as Core } from 'bmpjs/core'

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
