import { default as Core } from 'bmpjs/core'

class SearchPages extends Core.StatelessWidget {
	static get tagname() {
		return 'suggested-routes';
	}

	content() {
		return `search-pages. parent counter: ${this.context.counter}`
	}

}
export { SearchPages }
