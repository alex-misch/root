import { html, directive } from '../node_modules/lit-html/lit-html'
// import { directive } from '../node_modules/lit-html/lib/directive'

import { BmpApp } from './bmp-app/index.js'
import { BmpCss, instance as bmpCssInstance } from './bmp-css/index.js'
import { BMPVDWebComponent, BMPVD, observe } from './bmp-virtual-dom-web-component/index.js'

import { BMPLit } from './bmp-lit/bmp-lit-web-component'

import { BmpStorage, instance as bmpStorageInstance }  from './bmp-storage/index.js'
import { HTTPRequest }  from './shared/http-request.js'
import { fetch } from './shared/fetch-polyfill.js'
import closestPolyfill from './shared/closest-polyfill.js'

if ( !window.fetch ) window.fetch = fetch
if ( !Element.prototype.closest ) closestPolyfill( Element.prototype )


export {
	BmpApp,
	BMPVDWebComponent,
	BMPVD,

	html, directive,
	BMPLit,

	observe,

	HTTPRequest,

	BmpStorage,
	bmpStorageInstance,

	BmpCss,
	bmpCssInstance
}

