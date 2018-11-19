import { replaceLink } from "../utils/replace-link";

const refClick = function(ev) {
  ev.preventDefault()

  const link = this.querySelector('a')
  if ( link ) document.querySelector( 'bmp-router' ).go(link.pathname + link.search)
}


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
class BmpAnchor extends HTMLElement {

  static get is() { return 'bmp-anchor' }


  constructor() {
    super()
  }


  connectedCallback() {

		;[... this.querySelectorAll( 'a' ) ].forEach( el => replaceLink(el) )
		this.linksObserver = new MutationObserver( mutationRecords => {
			[...mutationRecords.addedNodes].forEach( el => replaceLink(el) )
		})
    this.addEventListener( 'click', refClick, false )
  }

  disconnectedCallback() {
		this.linksObserver.disconnect()
    this.removeEventListener( 'click', refClick, false )
  }

}

customElements.define( BmpAnchor.is, BmpAnchor )
export { BmpAnchor }
