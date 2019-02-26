import VirtualMachine from './virtual-machine'
import { download } from '../../utils/file.mjs'
import { HTML5Api } from "../../dom/html5.mjs";
import { SitemapGenerator } from '../sitemap-generator.mjs'
import HTMLAdapter from '../interfaces/html-adapter.mjs';
import {
	replaceDynamicParts,
	hasDynamic
} from '../../utils/uri.mjs';

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
		if ( !sandbox.result.Application)
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
			const alreadyGenerated = this.registredComponents.includes(Element.tagName)
			this.registredComponents.push(Element.tagName)

			// { constructor, tagname } of custom element
			const Element = this.vm.getContext().customElements.get( route.tagName )
			const hasUrlConf = Element && typeof Element.constructor.getUrlConf == 'function'

			if ( !hasDynamic(route.pattern) ) {
				// skip dynamic patterns, it overwritten in element urlconf
				routes.push(route.pattern)
			} else if ( !hasUrlConf ){
				console.warn( `Looks like error: "${route.tagName}" has dynamic segment(s), but getUrlConf function not declarated.` )
			}

			if ( hasUrlConf ) { // component declarated urlConf generator
				if ( !alreadyGenerated ) {
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
			// baseURI: 'http://bmp.lo:8080/ssr/',
			css: '',
			html: '',
			head: null,
			lang: 'en',
			statusCode: 500,
			metatags: {}
		}

		// get instances of application
		const { Application, CssJS } = await this.execApp()

		try {
			// createElement is static method, like VirtualDOMAdapter.createElement
			// so we must call this method from constructor
			const appInstance = this.htmlAdapter.constructor.createElement( Application.tagName )
			// render all child elements recursively
			/** @var { HTMLElement } appElement */
			const appElement = await this.htmlAdapter.deepRender( appInstance )
			// By default it can supports HTML5 Api, so get outerHTML
			result.html = appElement.outerHTML
			// generate styles of document
			if (CssJS) {
				result.css = Object.keys( CssJS.componentsRegistry ).map( name => {
					return CssJS.componentsRegistry[name].stringify()
				}).join('')
			}
			result.head = this.vm.getContext().document.head.innerHTML
			result.statusCode = appElement.statusCode( this.clientRequest.uri )
			result.metatags = appElement.metatags( this.clientRequest.uri )
		} catch(e) {
			// TODO: parse valid status code
			// return shell with empty app tag
			result.html = `<${Application.tagName}></${Application.tagName}>`
			result.statusCode = 200
			console.error(e)
		}

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
