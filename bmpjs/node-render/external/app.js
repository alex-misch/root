/** @jsx BMPVD.createBMPVirtulaDOMElement */

import { BmpApp, BMPVD, BMPVDWebComponent, BmpCss, bmpCssInstance } from 'bmp-core'
import { BmpRouter } from 'bmp-router'

// create App instance
let bmpApp = new BmpApp()

// initiate JS in Css interface

let bmpCssComponent = bmpCssInstance.define({
	name: 'jetsmarter-app',
	cssjs: { display: 'block' }
})

class App extends BMPVDWebComponent {
	constructor() {
		super()
	}

	static get is() { return 'jetsmarter-app' }

	ready() {

		bmpApp.attach(this)
		bmpApp.registerAsyncComponents({
			'bmp-slider': {
				'js': ['https://cdn.boomfunc.io/bmp-slider/1.1.1/scripts/bmp-slider.js'],
				'css': ['https://cdn.boomfunc.io/bmp-slider/1.1.1/styles/styles.css']
			}
		})
		bmpCssComponent.attachStyles(this)

		// Setup router config
		BmpRouter.config( routerConf )
	}


	/** Use render to tell BMP what's your component will look like with JSX syntax */
	render() {
		return BMPVD.createBMPVirtulaDOMElement('bmp-router')
	}

	static compile() {
		const app = customElements.get( App.is )

		const self = BMPVD.createBMPVirtulaDOMElement( App.is, null, app.BMPVDInstance )
		return {
			html: BMPVD.stringify( self, BMPCSSJS ),
			css: BmpCss.stringify( BMPCSSJS )
		}
	}

}

customElements.define(App.is, App)
if ( window.IS_SSR ) {
	App.compile()
}
