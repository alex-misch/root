import VirtualMachine from './virtual-machine'
import { download } from '../../utils/file.mjs'
import { HTML5Api } from "../../dom/html5.mjs";
import { SitemapGenerator } from '../sitemap-generator.mjs'
import {
	replaceDynamicParts,
	hasDynamic
} from '../../utils/uri.mjs';
import { timeStamp } from '../../utils/timeline.mjs';

class BmpRemoteApp {

	/**
	 * Configurating app and start virtual machine to run code
	 * @constructor
	 * @param { Object } { clientRequest, htmlDriver, entrypoint }
	 *
	 */
	constructor({ clientRequest, htmlDriver, entrypoint }) {
		/** @param htmlDriver driver of html5 stringifier */
		this.htmlDriver = htmlDriver
		/** @param {String} entrypoint script URL  */
		this.entrypoint = entrypoint
		/** @param {Object} clientRequest key-value pair object with client request */
		this.clientRequest = clientRequest

		/** Create enviroment of vitrual machine and start it */

		const vmContext = HTML5Api({
			baseURI: clientRequest.origin,
			url: (clientRequest.origin.replace(/https?:\/\/(.*)\/$/, '$1') + clientRequest.uri),
			userAgent: clientRequest.userAgent
		})
		this.vm = new VirtualMachine(vmContext)

	}

	async execApp() {
		/** Run main application file  */
		const sourceCode = await download( this.entrypoint )

		// Execute fetched code in virtual machine
		let sandbox = null
		try {
			sandbox = await this.vm.run({
				code: sourceCode,
				rootUrl: this.entrypoint,
			})
		} catch (e) {
			console.error(`Fail to execute ${e}`)
			process.exit(1)
		}

		// Evaluated sandbox must return app class
		if ( !sandbox.result.Application )
			throw new Error(`Fail to get "Application" key in result of evaluating. Got ${sandbox.result}`)
		return sandbox.result
	}

	async sitemap() {
		/** Run main application file  */
		const { Application } = await this.execApp()
		this.registredComponents = []

		const routes = []
		// go to each custom element of route and load his own urlConf
		for (const route of Application.constructor.config.routes) {
			if ( route.skipSitemap )
				continue

			// register component as already
			// { constructor, tagname } of custom element
			const Element = this.vm.getContext().customElements.get( route.tagName )
			const alreadyGenerated = this.registredComponents.includes(Element.tagName)

			const hasUrlConf = Element && typeof Element.constructor.getUrlConf == 'function'

			if ( !hasDynamic(route.pattern) ) {
				// skip dynamic patterns, it overwritten in element urlconf
				routes.push(route.pattern)
			} else if ( !hasUrlConf ){
			}

			if ( hasUrlConf ) { // component declarated urlConf generator
				if ( !alreadyGenerated ) {
					this.registredComponents.push(Element.tagName)
					// url conf of a component must be generated
					const ownRoutes = await Element.constructor.getUrlConf(route.pattern, replaceDynamicParts)
					routes.push( ...ownRoutes )
				}
			}
		}

		return new SitemapGenerator( routes, this.clientRequest.origin )
	}

	/**
	 * Generate html by configured app
	 * @return { Object } { html, statusCode }
	 */
	async render() {
		const result = {
			css: '', // CSS of document
			html: '', // HTML of document
			head: null, // head of document
			lang: 'en', // TODO: multilanguage
			statusCode: 500, //by default it is internal error
		}

		// get instances of application
		const { Application, css } = await this.execApp()
		const { document } = this.vm.getContext()
		try {
			// createElement is static method, like VirtualDOMDriver.createElement
			// so we must call this method from constructor
			const appInstance = this.htmlDriver.constructor.createElement( Application.tagName )
			// render all child elements recursively
			/** @var { HTMLElement } appElement */
			const appElement = await this.htmlDriver.deepRender( appInstance )
			// By default it can supports HTML5 Api, so get outerHTML
			result.html = appElement.outerHTML
			// generate styles of document
			if (css) result.css = css
			result.head = document.head.innerHTML
			// rewrite status code by application
			result.statusCode = appElement.statusCode( this.clientRequest.uri )
		} catch(e) {
			console.error(e)
			process.exit(1)
		}

		result.baseURI = this.clientRequest.origin
		try {
			const shell = Application.constructor.generateDocument(result)
			return {
				html: shell,
				statusCode: result.statusCode
			}
		} catch (err) {
			console.error('Fail to render', err)
			// process.exit( 1 )
		}

	}

}

export default BmpRemoteApp
