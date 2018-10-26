
const getDuration = el => {
  let {transitionDuration} = window.getComputedStyle( el )
  if ( /^[0-9\.]+s?/.test( transitionDuration ) ) {  // seconds
    transitionDuration = 1000 * parseFloat( transitionDuration )
  }
  return parseFloat(transitionDuration)
}


/**
 * View base class. All events must be changed by attribte
 * @class
 * @example
 * <bmp-view></bmp-view>
 */
class BmpView extends HTMLElement {

  constructor () { super() }

  static get is() { return 'bmp-view' }
  static get observedAttributes() {return ['state', 'pathname']; }

  get animDelay() {
    return parseFloat( this.getAttribute( 'anim-delay' ) )
  }


  attributeChangedCallback(name, oldValue, newValue) {
    if ( name == 'state' ) {
      if ( newValue === 'anim-out' ) {
        // remove view with delay
        this.style.position = 'absolute'
        this.style.top = `${-window.pageYOffset}px`
        setTimeout( _ => { this.parentNode.removeChild( this ) }, this.animDelay )
      }
    }
  }

  connectedCallback() {
    this.setAttribute( 'anim-delay', getDuration(this) )

    setTimeout( _ => {
      this.setAttribute( 'state', 'anim-in' ) // delay for animate trigger
    }, 50)
  }

  disconnectedCallback() {

  }

}


/** TODO: defferent method for web-component polyffil v0 */
customElements.define(BmpView.is, BmpView)
export { BmpView }
