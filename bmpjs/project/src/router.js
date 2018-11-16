import BmpCore from 'bmpjs/bmp-core'
import BmpRouter from 'bmpjs/bmp-router'
import { HomePage } from './pages/home/home.component';
import { AboutPage } from './pages/about/about.component';

class JetsmRouter extends Bmp.Router {

	constructor() {
		super({
			urlconf: {
				'/': {
					controller: HomePage
				},
				'about': {
					controller: AboutPage
				}
			}
		})
	}


	build() {
		return ``
	}



}

export { JetsmRouter }
