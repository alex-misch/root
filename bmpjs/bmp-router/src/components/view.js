import { getDuration } from "../utils/css-duration";

import { StatelessWidget } from '../../../bmp-app/index.js'
/**
 * View base class. All events must be changed by attribte
 * @class
 * @example
 * <bmp-view></bmp-view>
 */
class View extends StatelessWidget {

  constructor (config) {
		console.log( config )
		super()
	}

  static get is() {
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

}

export { View }
