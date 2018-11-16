import { bmpCssInstance } from 'bmp-core'

import { cssjs } from './jetsm-selectbox.css.js'
let bmpCssComponent = bmpCssInstance.define({
	name: 'jetsm-selectbox', cssjs
})

class JetsmSelectbox extends HTMLElement {


	connectedCallback() {
		bmpCssComponent.attachStyles(this)

		this.select = this.querySelector( 'select' )
		this.options = [...this.select.querySelectorAll('option')]
    if ( !this.options.length ) return

		this.render()
		this._handleChange()

    // open/close the dropdown
    var wrap = this.select.parentNode.querySelector( '.selectbox_wrapper' )
    var optionsWrap = wrap.querySelector( '.selectbox_options' )
    this.label = wrap.querySelector( '.selectbox_label' )

    this.label.addEventListener( 'click', () => {
      this.select.focus()
      if (!/(iphone|ipad|ipod|android)/gi.test( navigator.userAgent.toLowerCase() ) )
        wrap.classList.toggle( 'opened' )
    })
    document.body.addEventListener( 'click', event => {
      if ( event.target != this.label && event.target.parentNode != this.label )
        wrap.classList.remove( 'opened' )
    })

    // click on fake option
    var fakeOptions = [...optionsWrap.querySelectorAll( '.selectbox_option' )]
    ;[...fakeOptions].forEach( option => {
      option.addEventListener( 'click', ev => {
        ev.preventDefault()
        this.select.value = option.getAttribute( 'data-value' )
        this.select.dispatchEvent(new Event('change'))
      })
    })

		this.fakeOptions = fakeOptions
		const depends = this.getAttribute( 'depends-of' )
		if ( depends ) this._handleDepends( depends )
	}

	_handleChange() {
    // change label html when select changed
    this.select.addEventListener( 'change', () => {
      this.label.querySelector('span').innerHTML = this.options[ this.select.selectedIndex ].innerHTML;
    })
	}

	_handleDepends( selector ) {
		const dependSelect = document.querySelector( `${ selector } select` )
		dependSelect.addEventListener( 'change', ()=> {
			const val = dependSelect.value
			this.fakeOptions.forEach( el => {
				const elVal = el.getAttribute( 'data-value' )
				if ( val && elVal.toLowerCase() != 'other' && elVal.indexOf( val ) != 0 )
					el.style.display = 'none'
				else
					el.style.display = 'block'
			})

			this.options.forEach( option => {
				if ( val && option.value.toLowerCase() != 'other' && !option.value.includes( val ) )
					option.setAttribute( 'hidden', 'hidden' )
				else
					option.removeAttribute( 'hidden' )
			})
		}, false )
	}

	render() {

    // create template
    this.select.insertAdjacentHTML( 'beforeBegin', `
      <div class="selectbox_wrapper">
        <div class="selectbox_label">
          <span>${ this.options[0].innerHTML }</span><i></i>
        </div>
        <div class="selectbox_options">
          ${
            this.options.map( (option, i) => {
              if ( i === 0 ) return ''
              return `<div class="selectbox_option" data-value="${ option.value }">${ option.innerHTML }</div>`
            } ).join('')
          }
        </div>
      </div>
    ` );
	}

}

customElements.define( 'jetsm-selectbox', JetsmSelectbox )
