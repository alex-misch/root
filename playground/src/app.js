
import { BmpLit } from "bmp-core"
import { BmpRouter } from "bmp-router"

class App extends BmpLit {

	constructor() {
		super()
	}

	ready() {
		BmpRouter.config({
			viewTag: 'view',
			urlConf: [
				{ pattern: '/', tagName: 'home-component' },
				{ pattern: '/about/', tagName: 'about-component' }
			]
		})
	}

	render() {
		return this.html`
			<h1>Hello from app!</h1>
		`
	}


}

customElements.define('myapp', App)
