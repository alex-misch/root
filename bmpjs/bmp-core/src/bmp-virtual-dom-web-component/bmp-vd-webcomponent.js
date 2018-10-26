import { BMPVD } from './bmpvd.js'
import { observe } from '../shared/proxy-observe.js'


/** Extend BMPVDWebComponent class to create new custom elements with virtual dom and observable bindings */
class BMPVDWebComponent extends HTMLElement {
  constructor() {
    super()
    this.BMPVD = new BMPVD()
  }

  /** !warning: observe uses Proxy object and if there's no native support for Proxy it will *(TODO->)* use google-chrome team polyfill (which comes with some limitations)
   *  https://github.com/GoogleChrome/proxy-polyfill
  */
  observe( obj ) {
    return observe( obj, ( tree, property, value ) => {
      clearTimeout(this.dispatchUpdateTimeout)
      this.dispatchUpdateTimeout = setTimeout( _ =>{
        let prevVDInstance = Object.assign({}, this.BMPVD.currentVDInstance )
        let newVDInstance = this.BMPVD.setVirtualDOM( this.render() )
        this.BMPVD.updateContainer( this, newVDInstance, prevVDInstance )
      }, 10 )
    })
  }

  connectedCallback() {
    if ( this.ready ) {
			const readyPromise = this.ready()
			if ( readyPromise && readyPromise.then ) {
				// ready is Promise
				readyPromise
					.then( () => this._attachComponent() )
					.catch( err => console.error(err) )
			} else {
				this._attachComponent()
			}
		}

	}

	_attachComponent() {

		const newVD = this.BMPVD.setVirtualDOM( this.render() )
		this.BMPVD.updateContainer( this, newVD )
		if ( this.onAttached ) {
			this.onAttached()
			this.onAttached = undefined
		}
		this.ready = undefined
		/**TODO Real on attach callback flow */

	}
}

export { BMPVDWebComponent, BMPVD, observe }
