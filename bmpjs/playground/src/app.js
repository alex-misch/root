/*******/
import { initApp } from 'core'
initApp = appClass => {
	document.body.insertAdjacentHTML('beforeend', appClass.html())
}
/*******/
import { BMPLit } from "bmpjs/core"
import { BmpRouter } from "bmpjs/bmp-router"
import { util } from './utils/utils.js'

class App extends BMPLit {

	constructor() {
		super()
	}

	static html() {
		return '<app/>'
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
			<h1>Hello from ${ util("bmp") } app!</h1>
			<p>Count: ${this.context.counter}</p>
			<button @click=${ e => this.context.counter++ }>Plus 1</button>
		`
		return new HTMLDOMWidget()
	}
}

customElements.define('my-app', App)


class BMPRouter extends BMPLit {
	constructor(settings) { super(); this.settings = settings }
	return() {
		return paternMatcher(this.settings)
	}
}

class Router {
	constructor() {
		super()
		this.settings = {
			'/': Home
		}
	}
	render() {
		return new BMPRouter(this.settings)
	}
}

class HomeBody {
	constructor({title}) {
		this.title = title
	}

	static get specifier() {
			return 'home-body'
	}

	render() {
		return Column({
			children: [
				new Text('some text')
			]
		})
	}
}

class SiteNav extends Widget {
	static get tag() {
		return 'sitenav'
	}
	render() {

	}
}

class HomeComponent {
	constructor() {}

	render() {
		return new Scaffold({
			appBar: new SiteNav(),
			body: new HomeBody({title: 'My body'})
		})
	}
}

class Scaffold extends BMPLit {

	constructor() {

	}

	return() {
		return `
			<header></header>
			<section>${this.render}</section>
		`
	}
}

class App extends BMPApp {

	constructor() {
		super()
	}


	render () {
		return new Router()
	}

}

initApp(App)

