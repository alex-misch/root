import { default as Core } from "bmpjs/core";
// import css from './home.css'

// import { grid } from '../../theme/grid.js'
import { SuggestedRoutes } from "./widgets/suggested-routes/suggested-routes.component";
import { SearchPages } from "./widgets/suggested-pages/search-pages.component";
import { SearchFlights } from "./widgets/search-flights/search-flights.component";

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

	beforeAttach() {
		this.state = {
			counter: 4,
			pending: true
		}

	}

	afterAttach() {
		setInterval( () => {
			this.state.counter > 3 ? this.state.counter-- : this.state.counter++
		}, 1000 )
	}

	content() {
		const _context = { homepagecounter: this.state }
		return this.html`
			<h1>Home page. Counter: ${ this.state.counter }</h1>
			${ SuggestedRoutes.widget(_context) }
			${ SearchFlights.widget(_context) }
			${
				Array.from({ length: this.state.counter }).map( (el, index) => {
					return SearchFlights.widget({ index: Math.random() })
				})
			}
			${ SearchFlights.widget(_context) }
		`;
	}
}
export { HomePage }
