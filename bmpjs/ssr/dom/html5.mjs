import { Element } from "./element.mjs";
import { HTMLElement } from "./html-element.mjs";
import { HTMLDocument } from "./html-document.mjs";
import { DOMException } from './dom-exception.mjs';
import { CustomElements, customElements } from "./custom-elements.mjs";
import { Navigator } from "./navigator"
import fetch from 'node-fetch-polyfill'
import { Console } from 'console'
import { Writable } from 'stream'

URL.prototype.replace = () => {}

const appLogger = {
	warn: (...args) => console.warn('[APP CONSOLE]',...args),
	stdout: new Writable(),
	stderr: new Writable()
}

appLogger.stdout.on('pipe', appLogger.warn)
appLogger.stderr.on('pipe', appLogger.warn)

const HTML5Api = ({ url, userAgent, baseURI }) => ({
	console: new Console(appLogger),
	/** HTML5 Api */
	HTMLElement,
	MutationObserver: class {
		observe() {}
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
	fetch,
	// : (...args) => {
	// 	console.log(args[0])
	// 	return fetch(...args)
	// },

	/** BMP api */

	/** Contants */
	/** TODO: move it to dynamic variables (m.b. from CLI ) */
	SERVER_NAME: 'https://jetsmarter.com',
	apiGateway: 'https://api.jetsmarter.com',
	IS_SSR: true,
	location: new URL(`https://${url}`),
	window: {}
})


export { HTML5Api }
