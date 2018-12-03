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
		return `search-flight. parent counter: ${this.context.counter}`
	}


}

export { SearchFlights }
