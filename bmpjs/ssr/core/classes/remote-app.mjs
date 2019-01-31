import VirtualMachine from './virtual-machine'
import { download } from '../../utils/file.mjs'
import { HTML5Api } from "../../dom/html5.mjs";
import HTMLAdapter from '../interfaces/html-adapter.mjs';

class BmpRemoteApp {

	/**
	 * Configurating app and start virtual machine to run code
	 * @constructor
	 * @param { Object } { clientRequest, htmlAdapter, entrypoint }
	 *
	 */
	constructor({ clientRequest, htmlAdapter, entrypoint }) {
		/** @param { HTMLAdapter } htmlAdapter adapter of html5 stringifier */
		this.htmlAdapter = htmlAdapter
		/** @param {String} entrypoint script URL  */
		this.entrypoint = entrypoint
		/** @param {Object} clientRequest key-value pair object with client request */
		this.clientRequest = clientRequest

		/** Create enviroment of vitrual machine and start it */
		const vmContext = HTML5Api({
			baseURI: clientRequest.static,
			url: clientRequest.origin + clientRequest.uri,
			userAgent: clientRequest.userAgent
		})
		this.vm = new VirtualMachine(vmContext)
	}

	/**
	 * Returns file content by it URL
	 * @param url file to fetch
	 * @return {String} source of fetched file
	 */
	async fetch(url) {
		// console.log('fetch', url)
		try {
			return await download( url )
		} catch ( error ) {
			throw new Error(`Error while fetching file ${url}: ${error}`)
		}
	}


	/**
	 * Generate html by configured app
	 * @return { Object } { html, statusCode }
	 */
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
		/** @var {HTMLElement} appElement */
		const appElement = await this.htmlAdapter.convertToHTML( appInstance )
		// generate styles of document
		let arrCss = []
		if (CssJS) {
			arrCss = Object.keys( CssJS.componentsRegistry ).map( name => {
				return CssJS.componentsRegistry[name].stringify()
			})
		}
		try {
			const shell = Application.constructor.generateDocument({
				baseURI: this.clientRequest.static,
				html: appElement.outerHTML,
				head: this.vm.getContext().document.head.innerHTML,
				lang: 'en',
				css: arrCss.join('')
			})
			return { html: shell, statusCode: 200 }
		} catch (err) {
			console.error('Fail to render', err)
			process.exit( 1 )
		}

	}

}

export default BmpRemoteApp
