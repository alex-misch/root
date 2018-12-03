import { default as Core } from 'bmpjs/core'


class Grid extends Core.FlexGrid {
	constructor() {
		this.cols = 12;
		this.phone = {
			maxWidth: 700,
			cols: 6
		};
		this.tablet = {
			maxWidth: 1024,
			cols: 10
		};
	}

}

export { Grid }
