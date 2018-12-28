import { replaceLink } from "../utils/replace-link";
import { BmpRouter } from "./bmp-router";
import Core from 'bmpjs/core'



/**
 * Prevent default action behavior and handle click event, call router to navigate somewhere
 * Defines web-component as "bmp-anchor" tag
 * @class
 * @example
 * <bmp-anchor>
 *  <a href="/">Home</a>
 * </bmp-anchor>
 * <bmp-anchor>
 *  <a href="/about/">About</a>
 * </bmp-anchor>
 */
class BmpAnchor extends Core.StatelessWidget {

	static get tagname() {
		return 'bmp-anchor'
	}

	constructor() {
		super()
		this.allowedAttributes = [
			'href', 'target', 'title', 'download', "charset",
			'coords', 'hreflang', 'media', 'className', 'ping', 'rel',
			'rev', 'shape', 'style' // https://www.w3schools.com/tags/tag_a.asp
		]
	}

	attrs(raw) {
		return Object
			.keys(raw)
			.filter(key => this.allowedAttributes.includes(key))
			.reduce( (obj, key) => {
				obj[key] = raw[key]
				return obj
			}, {})
	}


	beforeAttach() {
		;[... this.querySelectorAll( 'a' ) ].forEach( el => replaceLink(el) )
		this.linksObserver = new MutationObserver( mutationRecords => {
			[...mutationRecords.addedNodes].forEach( el => replaceLink(el) )
		})
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		this.linksObserver.disconnect()
	}


	clickHandler(ev) {
		ev.preventDefault()
		console.log(BmpRouter.tagname, this.closest( BmpRouter.tagname ))
		this.closest( BmpRouter.tagname ).go(link.pathname + link.search)
	}

	content() {
		// ${isActive(link) && 'active' }
		return this.html`
			<a @click="${ ev => this.clickHandler(ev) }" dummy="${ Core.spread(this.attrs(this.context)) }">${ this.context.inner }</a>
		`
	}


}

export { BmpAnchor }
