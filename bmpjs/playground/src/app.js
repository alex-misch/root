
import { BmpLit } from "../bmp_modules/bmpjs/bmp-core/src/index.js"
import { BmpRouter } from "bmpjs/bmp-router"
import { util } from './utils/utils.js'

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
		util(123)
		return this.html`<h1>Hello from app!</h1>`
	}
}

customElements.define('myapp', App)
