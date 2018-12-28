import { html, directive, svg } from '../node_modules/lit-html/lit-html'
import { spread } from './core/directives/spread-attributes';

import { fetch } from './polyfill/fetch.js'
import closestPolyfill from './polyfill/closest.js'

/** Main Application classes */
import { BmpApp } from './core/app/bmp-app.js';
import { DataStore } from './shared/data-store';
import { BaseStorage } from './shared/base-storage';

/** Services */
import { Service } from './core/services/services';

/** CssJS */
import { CssJS } from './core/styles/cssjs.js';

/** Widgets */
import { StatefulWidget } from './core/widget/stateful-widget.js';
import { StatelessWidget } from './core/widget/stateless-widget.js';

/** Polyfills */
if ( !window.fetch ) window.fetch = fetch
if ( !Element.prototype.closest ) closestPolyfill( Element.prototype )

export default {
	/** Lit-html package methods (including custom) */
	html, svg, directive, spread,

	/** App helpers */
	BmpApp,
	CssJS,

	/** Services */
	BaseStorage,
	DataStore,
	Service,

	/** Widgets */
	StatelessWidget,
	StatefulWidget
}

