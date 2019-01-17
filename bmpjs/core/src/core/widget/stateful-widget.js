import { StatelessWidget } from "./stateless-widget.js";
import { observe } from '../../shared/proxy-observe.js'

class StatefulWidget extends StatelessWidget {
	constructor() {
		super()
	}

	set state(state) {
		this.observedState = this.observe(state)
	}

	get state() {
		return this.observedState
	}

	observe(obj) {
		return observe(obj, (tree, property, value) => {
			clearTimeout(this.dispatchUpdateTimeout)
			this.dispatchUpdateTimeout = setTimeout( () => {
				this.render()
			}, 10)
		})
	}

}

export { StatefulWidget }
