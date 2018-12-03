// import { html, directive } from '../node_modules/lit-html/lit-html'

import { fetch } from './polyfill/fetch.js'
import closestPolyfill from './polyfill/closest.js'

/** Main Application class */
import { BmpApp } from './core/app/bmp-app.js';

/** Widgets */
import { StatefullWidget } from './core/widget/statefull-widget.js';
import { StatelessWidget } from './core/widget/stateless-widget.js';

/** CssJS */
import { CssJS } from './core/cssjs/cssjs-lit.js';


if ( !window.fetch ) window.fetch = fetch
if ( !Element.prototype.closest ) closestPolyfill( Element.prototype )


export default {
	fetch,

	BmpApp,

	CssJS,

	StatelessWidget,
	StatefullWidget
}

