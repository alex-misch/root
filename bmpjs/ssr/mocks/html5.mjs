import { Element } from "./element.mjs";
import { HTMLElement } from "./html-element.mjs";
import { HTMLDocument } from "./html-document.mjs";
import { DOMException } from './dom-exception.mjs';
import { CustomElements, customElements } from "./custom-elements.mjs";
import { Navigator } from "./navigator"
import fetch from 'node-fetch-polyfill'

/** NOTE: it is hardcode of */
URL.prototype.replace = () => {}

const HTML5Api = ({ url, userAgent, baseURI }) => ({
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

	/** BMP Mocks */
	BMPCSSJS: { },
	mdc: {},

	/** Contants */
	/** TODO: move it to dynamic variables (m.b. from CLI ) */
	SERVER_NAME: 'https://jetsmarter.com',
	apiGateway: 'https://api.jetsmarter.com',
	IS_SSR: true,
	location: new URL(`https://${url}`),
	window: HTML5Api
})


export { HTML5Api }
