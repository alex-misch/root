import { default as Core } from "bmpjs/core";
import { SuggestedRoutes } from "./widgets/suggested-routes/suggested-routes.component";
import { SearchPages } from "./widgets/suggested-pages/search-pages.component";
import { SearchFlights } from "./widgets/search-flights/search-flights.component";

import css from './home.sass'
Core.CssJS.inject(css)

class HomePage extends Core.StatefulWidget {

	static get tagname() {
		return 'home-page';
	}

	static get style() {
		// return css;
	}

	beforeRender() {

	}

	afterRender() {

		//
	}

	getUniqueWIdgetID(context) {
		return `${context.uid}`;
	}

	beforeAttach() {
		this.state = {
			counter: 4,
			pending: true,
			flights: [
				{uid: '123123', data: {}},
				{uid: '47347', data: {}},
				{uid: '04332', data: {}},
				{uid: '76567324345', data: {}},
				{uid: '12351235', data: {}}
			]
		}

	}

	addFlight() {
		this.state.flights.push({
			uid: parseInt( 10000 * Math.random() )
		})
	}

	sortFlights() {

	}

	content() {
		return this.html`
			<h1>Home page</h1>
		`
	}

	// content() {
	// 	const _context = { homepagecounter: this.state }
	// 	return this.html`
	// 		<h1>Home page. Counter: ${ this.state.counter }</h1>
	// 		${ SuggestedRoutes.widget(_context) }
	// 		${ SearchFlights.widget(_context) }
	// 		${
	// 			this.state.flights.map( ({ uid, data }, index) => {
	// 				return SearchFlights.widget({ uid })
	// 			})
	// 		}
	// 		${ SearchFlights.widget(_context) }
	// 		<button @click="${ ev => this.addFlight() }">Add flight</button>
	// 		<button @click="${ ev => this.sortFlights() }">Sort flight</button>
	// 	`;
	// }
}
export { HomePage }
