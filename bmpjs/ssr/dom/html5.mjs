import { Element } from "./element.mjs";
import { HTMLElement } from "./html-element.mjs";
import { HTMLDocument } from "./html-document.mjs";
import { DOMException } from './dom-exception.mjs';
import { CustomElements, customElements } from "./custom-elements.mjs";
import { Navigator } from "./navigator"
import { Console } from 'console'
import { Writable } from 'stream'
// import fetch from 'node-fetch-polyfill'
// import { timeStamp } from '../utils/timeline'

/**
 * NodeJS doesn't support rewriting URL, but we are creating browser ENV
 * so add replace support
 */
URL.prototype.replace = () => {}

const appLogger = {
	warn: (...args) => {},//console.warn('[APP CONSOLE]',...args),
	stdout: new Writable(),
	stderr: new Writable()
}

appLogger.stdout.on('pipe', appLogger.warn)
appLogger.stderr.on('pipe', appLogger.warn)

const HTML5Api = ({ url, userAgent, baseURI }) => ({
	console: new Console(appLogger),
	/** HTML5 Api */
	HTMLElement,
	Node: {
		ELEMENT_NODE: 1,
		ATTRIBUTE_NODE: 2,
		TEXT_NODE: 3,
		CDATA_SECTION_NODE: 4,
		ENTITY_REFERENCE_NODE: 5,
		ENTITY_NODE: 6,
		PROCESSING_INSTRUCTION_NODE: 7,
		COMMENT_NODE: 8,
		DOCUMENT_NODE: 9,
		DOCUMENT_TYPE_NODE: 10,
		DOCUMENT_FRAGMENT_NODE: 11,
		NOTATION_NODE: 	12,
	},
	MutationObserver: class {
		constructor(fn) {
			this.dispatch = fn
		}
		observe(element, params) {
			element.setMutationCallback(this.dispatch)
		}
	},
	Element,
	self: { DOMException },
	navigator: Navigator(userAgent),
	document: new HTMLDocument(baseURI),
	getComputedStyle: element => { return {} },
	addEventListener: () => {},
	removeEventListener: () => {},
	requestAnimationFrame: () => {},

	/** Polyfills */
	require: () => {},
	CustomElements,
	customElements,
	CustomEvent: class {},
	fetch: () => {},
	// async (...args) => {
	// 	console.error('fetch', timeStamp(), args[0])
	// 	const res = await fetch(...args)
	// 	console.error('fetch end', timeStamp(), args[0])
	// 	return res
	// },

	/** BMP api */

	/** Contants */
	/** TODO: move it to dynamic variables (m.b. from CLI ) */
	SERVER_NAME: 'https://jetsmarter.com',
	apiGateway: 'https://api.jetsmarter.com',
	IS_SSR: true,
	location: new URL(`https://${url}`),
	window: {
		innerWidth: 0,
		innerHeight: 0
	},
	scrollTo: () => {}
})


export { HTML5Api }
