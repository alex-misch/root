import VirtualMachine from './virtual-machine'
import { download } from '../../utils/file.mjs'
import { HTML5Api } from "../../mocks/html5.mjs";

class BmpRemoteApp {

	constructor({ clientRequest, htmlAdapter, entrypoint }) {
		/** Implementation */
		this.htmlAdapter = htmlAdapter
		this.entrypoint = entrypoint
		this.clientRequest = clientRequest

		/** Create enviroment of vitrual machine and start it */
		const vmContext = HTML5Api({
			url: clientRequest.origin + clientRequest.uri,
			userAgent: clientRequest.userAgent
		})
		this.vm = new VirtualMachine(vmContext)
	}

	async fetch(url) {
		console.log('fetch', url)
		try {
			return await download( url )
		} catch ( error ) {
			throw new Error(`Error while fetching file ${url}: ${error}`)
		}
	}


	async render() {
		/** Run main application file  */
		const sourceCode = await this.fetch( this.entrypoint )

		// Execute fetched code in virtual machine
		const { result } = await this.vm.run({
			code: sourceCode,
			rootUrl: this.entrypoint,
		})

		// Application must return app class
		// router and cssjs is optional
		const { Application, CssJS } = result
		if (!Application) throw new Error(`Fail to get "Application" key in result of evaluating. Got ${result}`)

		// createElement is static method, like VirtualDOMAdapter.createElement
		// so we must call this method from constructor
		const appInstance = this.htmlAdapter.constructor.createElement( Application.tagName )
		// render html string with attached css selectors
		const html = await this.htmlAdapter.stringify( appInstance, CssJS )

		// generate styles of document
		const arrCss = Object.keys( CssJS.componentsRegistry ).map( name => {
			return CssJS.componentsRegistry[name].stringify()
		})
		try {
			const shell = Application.constructor.generateDocument({
				html,
				lang: 'en',
				css: arrCss.join(),
				js: 'window.config = {}'
			})
			return { html: shell, statusCode: 200 }
		} catch (err) {
			console.log('Fail to render', err)
			process.exit( 1 )
		}

	}

}

export default BmpRemoteApp
