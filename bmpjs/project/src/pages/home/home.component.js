import { StatableComponent } from 'bmp-core'
import { grid } from '../../theme/index.js'
import { SearchFlights } from './widgets/search-flights/search-flights.component.js';
import { SuggestedRoutes } from './widgets/suggested-routes/suggested-routes.component.js';
import { SuggestedPages } from './widgets/suggested-pages/search-pages.component.js';

class HomePage {

	build() {
		return (
			grid.row(
				grid.col({ common: 12 },
					this.html`
						<div class="">${ Theme.h3( 'Jet through life on your own terms', 'white', '' ) }</div>
					`,
					new SuggestedRoutes(),
					new SuggestedPages()
				)
			)
		)
	}

}

export { HomePage }
