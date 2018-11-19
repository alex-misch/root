
import { BmpRouter } from "../../bmp-router/index.js"

/** Main application class */
class JetsmarterApp extends BmpCore.App {

	static get is() { return 'jetsmarter-app' }

	trackView() {
		if ( typeof ga == 'function' )
			ga('send', 'pageview')
	}

	get urlconf() {
		return {
			'/': "$views/home/home.component.js",
			'/about/': "$views/about/view/about.component.js",
			'/about/:slug/': "$views/about/detail/about-detail.component.js"
		}
	}

	constructor() {
		console.log( this.urlconf )
		this.router = new BmpRouter({
			viewDir: './pages',
			urlconf: this.urlconf,
			onChange: this.trackView.bind(this),
		})
	}

	build() {
		return this.router.widget()
	}


}

export { JetsmarterApp }
