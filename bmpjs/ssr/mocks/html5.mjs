import { Element } from "./element.mjs";
import { HTMLElement } from "./html-element.mjs";
import { HTMLDocument } from "./html-document.mjs";
import { DOMException } from './dom-exception.mjs';
import { CustomElements, customElements } from "./custom-elements.mjs";
import { Navigator } from "./navigator"
import fetch from 'node-fetch-polyfill'

const HTML5Api = ({ url, userAgent }) => ({
	/** HTML5 Api */
	HTMLElement,
	MutationObserver: class {
		observe() {}
	},
	Element,
	self: { DOMException },
	navigator: Navigator(userAgent),
	document: new HTMLDocument(),
	getComputedStyle: element => { return {} },
	addEventListener: () => {},
	removeEventListener: () => {},

	/** Polyfills */
	require: () => {},
	CustomElements,
	customElements,
	CustomEvent: class {},
	fetch,

	/** BMP Mocks */
	BMPCSSJS: { },
	mdc: {},

	/** Contants */
	/** TODO: move it to dynamic variables (m.b. from CLI ) */
	SERVER_NAME: 'https://jetsmarter.com',
	apiGateway: 'https://api.jetsmarter.com',
	IS_SSR: true,
	location: new URL(url),
	window: HTML5Api
})

export { HTML5Api }
