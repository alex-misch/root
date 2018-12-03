import { getDuration } from "../utils/css-duration";
import { default as Core } from 'bmpjs/bmp-core'


/**
 * View base class. All events must be changed by attribte
 * @class
 * @example
 * <bmp-view></bmp-view>
 */
class BmpView extends Core.StatelessWidget {

  constructor () {
		super()
	}

  static get tagname() {
		return 'bmp-view'
	}

  static get observedAttributes() {
		return ['state', 'pathname']
	}

  attributeChangedCallback(name, oldValue, newValue) {
    if ( name == 'state' ) {
      if ( newValue === 'anim-out' ) {
				// set pageY offset of page (imitate scroll position)
				this.style.top = `${-window.pageYOffset}px`
				this.style.position = 'absolute'

        // remove view with delay
        setTimeout( _ => {
					this.parentNode.removeChild( this )
				}, this.animDelay )
      }
    }
	}

  afterRender() {
    this.animDelay = getDuration(this)

    setTimeout( _ => {
      this.setAttribute( 'state', 'anim-in' ) // delay for animate trigger
    }, 50)
	}

	content() {
		return this.context.component.widget()
	}

}

export { BmpView }
