import { default as Core } from "bmpjs/core";
import css from './home.css'

// import { grid } from '../../theme/grid.js'
import { SuggestedRoutes } from "./widgets/suggested-routes/suggested-routes.component";
import { SearchPages } from "./widgets/suggested-pages/search-pages.component";
import { SearchFlights } from "./widgets/search-flights/search-flights.component";

class HomePage extends Core.StatefullWidget {

	static get tagname() {
		return 'home-page';
	}

	static get style() {
		return css;
	}

	beforeRender() {

	}

	afterRender() {

	}

	beforeAttach() {
		this.state = {
			counter: 0
		}

		const widgetContext = { homepage: this.state }
		this.widgets = {
			suggestedRoutes: 	SuggestedRoutes.widget(widgetContext),
			searchPages: 			SearchPages.widget(widgetContext),
			searchFlights: 		SearchFlights.widget(widgetContext),
		}

	}

	afterAttach() {
		setInterval( () => {
			console.log(++this.state.counter)
		}, 1000)
	}

	content() {
		return this.html`
			<h1>Hi. Counter: ${ this.state.counter }</h1>
			<div>${ this.widgets.suggestedRoutes }</div>
			${ this.widgets.searchPages }
			${ this.widgets.searchFlights }
		`;
	}
}
export { HomePage }
