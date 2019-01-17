import { Element } from "./element.mjs";
import { HTMLElement } from "./html-element.mjs";
import { HTMLDocument } from "./html-document.mjs";
import { DOMException } from './dom-exception.mjs';
import { customElements, CustomElements } from "./custom-elements.mjs";

const Mocks = {
	CustomElements,
	customElements,
	HTMLElement,
	Element,
	self: {
		DOMException
	},

	window: {
		getComputedStyle: (element) => {
			return {}
		},
		addEventListener: () => {},
		removeEventListener: () => {},
		IS_SSR: true
	},
	document: new HTMLDocument()
}

export { Mocks }
