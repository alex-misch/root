import { grid } from '../../theme/index.js'
import { SearchFlights } from './widgets/search-flights/search-flights.component.js';
import { SuggestedRoutes } from './widgets/suggested-routes/suggested-routes.component.js';
import { SuggestedPages } from './widgets/suggested-pages/search-pages.component.js';

class HomePage extends StatelessWidget {

	static get tagname() {
		return 'home-page'
	}

	build() {
		return (
			grid.row(
				grid.col({ common: 12 },
					this.html`
						<div class="title">Jet through life on your own terms</div>
						${ (new SearchFlights()).widget() }
						${ (new LegOffers()).widget() }
					`,
				)
			),
			grid.row(
				grid.col({ common: 12 },
					(new SuggestedRoutes()).widget(),
				)
			),
			grid.row(
				grid.col({ common: 12 },
					(new SuggestedPages()).widget()
				)
			)
		)
	}

}

export { HomePage }
