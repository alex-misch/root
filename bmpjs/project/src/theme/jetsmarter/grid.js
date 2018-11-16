
import { UI } from 'bmp-core'

class Grid extends UI.Theme.FlexGrid {

	constructor() {

		this.cols = 12

		this.phone = {
			maxWidth: 700,
			cols: 6,
		}

		this.tablet = {
			maxWidth: 1024,
			cols: 10
		}
	}

}

export default new Grid
