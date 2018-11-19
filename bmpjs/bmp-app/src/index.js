// import { html, directive } from '../node_modules/lit-html/lit-html'

import { fetch } from './polyfill/fetch-polyfill.js'
import closestPolyfill from './polyfill/closest-polyfill.js'

/** Main Application class */
import { App } from './core/app/app.js';

/** Widgets */
import { StatefullWidget } from './core/widget/statefull-widget.js';
import { StatelessWidget } from './core/widget/stateless-widget.js';

/** CssJS */
import { CssJS } from './core/cssjs/cssjs-lit.js';


if ( !window.fetch ) window.fetch = fetch
if ( !Element.prototype.closest ) closestPolyfill( Element.prototype )


export {
	fetch,

	App,

	CssJS,

	StatelessWidget,
	StatefullWidget,

}

