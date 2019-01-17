import { HomePage } from './pages/home/home.component.js'
import { AboutPage } from './pages/about/view/about.component.js'
import { AboutDetailPage } from './pages/about/detail/about-detail.component.js'


const config = {

	routes: [
		{ path: '/', component: HomePage },
		{
			path: '/about/',
			component: AboutPage,
			routes: [
				{
					path: '/about/:slug/',
					component: AboutDetailPage
				}
			]
		},
	],

	// components: {
	// 	"bmp-slider": {
	// 		js: ['some/url/to/slider'],
	// 		css: ['some/url/to/scripts']
	// 	}
	// }


}


export { config }
