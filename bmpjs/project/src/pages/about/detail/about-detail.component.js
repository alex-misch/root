import { Bmp } from 'bmp-core'
import { grid } from '../../theme/index.js'

class AboutDetailPage extends Bmp.Component {

	build() {
		return (
			grid.row(
				grid.col({ common: 12 },
					(new SearchFlights()).widget(),
					(new PriorityRoutesList()).widget(),
					(new PriorityPagesList()).widget(),
				)
			)
		)
	}

}

export { AboutDetailPage }
œ
