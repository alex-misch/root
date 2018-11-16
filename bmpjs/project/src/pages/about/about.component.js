import { Bmp } from 'bmp-core'
import { grid } from '../../theme/index.js'

class AboutPage extends Bmp.Component {

	build() {
		return (
			grid.row(
				grid.col(12,
					new SearchFlights(),
					new PriorityRoutesList(),
					new PriorityPagesList()
				)
			)
		)
	}

}

export { AboutPage }
