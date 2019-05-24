import { Element } from "./element.mjs";
import { HTMLElement } from "./html-element.mjs";
import { HTMLDocument } from "./html-document.mjs";
import { DOMException } from './dom-exception.mjs';
import { CustomElements, customElements } from "./custom-elements.mjs";
import { Navigator } from "./navigator"
import { Console } from 'console'
import { Writable } from 'stream'
import fetch from 'node-fetch-polyfill'
// import { requirejs } from './requirejs'
import { timeStamp } from '../utils/timeline'

/**
 * NodeJS doesn't support rewriting URL, but we are creating browser ENV
 * so add replace mock
 */
URL.prototype.replace = () => {}

const warn = (...args) => { global.console.warn('[APP CONSOLE]',...args) }

const HTML5Api = ({ url, userAgent, baseURI }) => ({
	console: {
		debug: warn,
		error: warn,
		info: warn,
		log: warn,
		warn: warn,
	},
	// console: new Console(appLogger),
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
	navigator: Navigator({ userAgent }),
	document: new HTMLDocument(baseURI),
	getComputedStyle: element => { return {} },
	addEventListener: () => {},
	removeEventListener: () => {},
	requestAnimationFrame: () => {},

	/** Polyfills */
	requirejs: () => {},
	require: () => {},
	CustomElements,
	customElements,
	CustomEvent: class {},
	fetch: async (...args) => {
		console.error(...args)
		const fetchTime = (new Date()).getTime()
		const res = await fetch(...args)
		console.warn('Fetch end in', timeStamp(fetchTime), args[0])
		return res
	},

	/** BMP api */

	/** Contants */
	/** TODO: move it to dynamic variables (m.b. from CLI ) */
	SERVER_NAME: 'https://jetsmarter.com',
	apiGateway: 'https://api.jetsmarter.com',
	IS_SSR: true,
	location: new URL(`https://${url}`),
	btoa: str => new Buffer(str).toString('base64'),
	atob: str => new Buffer(str, 'base64').toString(),
	window: {
		innerWidth: 0,
		innerHeight: 0
	},
	scrollTo: () => {}
})


export { HTML5Api }
