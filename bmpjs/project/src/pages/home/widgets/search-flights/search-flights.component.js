import { default as Core } from 'bmpjs/core'
import { default as style } from './search-flights.css'

class SearchFlights extends Core.StatelessWidget {

	static get tagname() {
		return 'search-flights'
	}

	get styles() {
		return style
	}

	content() {
		console.log(this.context)
		return this.html`
			<p>search-flight. context: ${ JSON.stringify(this.context) }</p>
		`
	}


}

export { SearchFlights }
