import Core from 'bmpjs/core'

import styles from './search-flights.sass'
Core.CssJS.inject(styles)

class SearchFlights extends Core.StatelessWidget {

	static get tagname() {
		return 'search-flights'
	}

	get styles() {
		return style
	}

	afterAttached() {
		styles.attach(this)
	}


	content() {
		return this.html`
			<p>search-flight. context: ${ JSON.stringify(this.context) }</p>
		`
	}


}

export { SearchFlights }
