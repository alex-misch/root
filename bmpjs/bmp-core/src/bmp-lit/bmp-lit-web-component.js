import { render, html } from '../../node_modules/lit-html/lit-html'
import { observe } from '../shared/proxy-observe'

class BMPLit extends HTMLElement {

	constructor() {
		super()
	}


  observe( obj ) {
    return observe( obj, ( tree, property, value ) => {
      clearTimeout(this.dispatchUpdateTimeout)
      this.dispatchUpdateTimeout = setTimeout( _ =>{
				render(this.render(), this)
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

		render( this.render(), this )
		if ( this.onAttached ) {
			this.onAttached()
			this.onAttached = undefined
		}
		this.ready = undefined

	}


	get html() {
		return html
	}


}

export { BMPLit }

