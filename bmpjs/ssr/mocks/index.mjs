import { Element } from "./element.mjs";
import { HTMLElement } from "./html-element.mjs";
import { HTMLDocument } from "./html-document.mjs";
import { DOMException } from './dom-exception.mjs';
import { CustomElements, customElements } from "./custom-elements.mjs";
import { Navigator } from "./navigator"
import { BMPVD } from "../virtual-dom/bmp-core.mjs";
import { BmpCss } from "../virtual-dom/bmp-css.mjs";
import fetch from 'node-fetch-polyfill'

const Mocks = {
	/** HTML5 Api */
	HTMLElement,
	MutationObserver: class {
		observe() {}
	},
	Element,
	self: { DOMException },
	navigator: Navigator(),
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
	SSR: { BMPVD, BmpCss },
	mdc: {},

	/** Contants */
	/** TODO: move it to dynamic variables (m.b. from CLI ) */
	SERVER_NAME: 'https://jetsmarter.com',
	apiGateway: 'https://api.jetsmarter.com',
	IS_SSR: true,
}

export { Mocks }
