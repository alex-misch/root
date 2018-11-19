import { StatelessWidget } from './stateless-widget.js'

class StatefullWidget extends StatelessWidget {

	get state() {
		throw new Error('"state" of component not defined.')
	}

  observe( obj ) {
    return observe( obj, ( tree, property, value ) => {
      clearTimeout(this.dispatchUpdateTimeout)
      this.dispatchUpdateTimeout = setTimeout( _ => {
				this.hook( 'beforeRender' )
				render(this.build().render(), this)
				this.hook( 'afterRender' )
      }, 10 )
    })
  }

	static widget() {
		this.observe( this.state )
		return super.widget()
	}

}

export { StatefullWidget }
