
class StatelessWidget extends HTMLElement {

	/**
	 * "is" getter
	 *	@return {String} tagname that will be used as custom element
	 */
	static get tagname() {
		throw new Error( '"is" getter not defined in ComponentWidget' )
	}

	/**
	 * Lit-css generator.
	 *
	 * @return {BmpLitCss} instace of lit css generator
	 * @example this.css`
	 * 	.title {
	 * 		font-size: ${font.size.medium};
	 * 		font-weight: ${font.weight.bold};
	 * 	}
	 * `
	 * */
	get css() {
		return BmpCss.litCss
	}

	/** Lit-HTML generator
	 *
	 * @return instace of lit html generator
	 * @example this.html`
	 * 	<div class="inner">
	 * 		<h3>Title of page</h3>
	 * 		<p>Paragraph of page</p>
	 * 	</div>
	 * `
	 */
	get html() {
		return html
	}

	/**
	 * Attributes list of element in key:value pair
	 * @returns {Object} list of attributes
	 * <any-element title="my title"></any-element>
	 * componentInstance.props // -> {title: 'my title'}
	 * */
	get props() {
		return ([...this.attributes]).reduce((result, attr) => ({
			...result,
			[attr.name]: attr.value
		}), {})
	}

	/**
	 * inspect passed function for possibility of calling and call it if it possible
	 * @private
	 * @example this._hook( 'beforeRender' )
	 */
	_hook(fn) {
		if ( this[fn] && typeof this[fn] == 'function' ) {
			this[fn]()
		}
	}

	/**
	 * check if an element is not defined, define it in customElementRegistry
	 * @return {void} 0
	 */
	_define() {
		if ( !customElements.get( this.is ) ) // is not attached, then
			customElements.define( this.is, this.constructor )
	}

	/**
	 * First render of element (when it attached)
	 */
	_attach() {
		let widget = this.build()

		this.hook( 'beforeRender' )
		render( widget.render() , this )
		this.hook( 'afterRender' )
	}

	/**
	 * Invoked when the custom element is first connected to the document's DOM
	 * Call _attach function to first render of element
	 * */
  connectedCallback() {
    if ( typeof this.ready == 'function' ) {
			const readyPromise = this.ready()
			if ( readyPromise && readyPromise.then ) {
				// ready is Promise
				readyPromise
					.then( () => this._attach() )
					.catch( err => console.error(err) )
			} else {
				this._attach()
			}
		} else {
			console.warn( 'Widget "render" must be a function but got', typeof this.ready )
		}
	}

	widget() {
		this._define()
		return `<${this.is}></${this.is}`
	}

}

export { StatelessWidget }
