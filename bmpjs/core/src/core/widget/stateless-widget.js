import { render, html } from '../../../node_modules/lit-html/lit-html.js'

/**
 * @class
 */
class StatelessWidget extends HTMLElement {

	constructor() {
		super()
	}

	/**
	 * "is" getter
	 *	@return {String} tagname that will be used as custom element
	 */
	static get tagname() {
		throw new Error( '"tagname" getter not defined in ComponentWidget' )
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
	html() {
		[...arguments]
				.filter( widget => widget instanceof StatelessWidget )
				.forEach( widget => {
					widget.render()
				})
		return html(...arguments)
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
	 * @async
	 * @private
	 * @example this._hook( 'beforeRender' )
	 */
	async _hook(fn) {
		if ( this[fn] && typeof this[fn] == 'function' ) {
			await this[fn]()
		} else {
			return Promise.resolve()
		}
	}

	/**
	 * Render content of element (when it attached)
	 * Content must be returned by "content" method
	 * @async
	 */
	async render() {
		if ( typeof this.content == 'function' ) {
			await this._hook( 'beforeRender' )
			render( this.content(), this )
			await this._hook( 'afterRender' )
		} else {
			console.warn( 'Widget "render" must be a function, got', typeof this.content )
		}
	}

	/**
	 * Invoked when the custom element is first connected to the document's DOM
	 * Call render function to first render of element
	 * */
  async connectedCallback() {
		await this._hook('beforeAttach')
		await this.render()
		await this._hook('afterAttach')
	}

	/**
	 * check if an element is not defined, define it in customElementRegistry, set context and return self
	 * @param { Object } context
	 * @return { StatelessWidget } instance of created widget with defined context
	 */
	static widget(context) {
		if ( !customElements.get( this.tagname ) ) // tagname not attached, then attach it
			customElements.define( this.tagname, this )

		const widget = document.createElement( this.tagname )
		widget.context = context

		return widget
	}

}

export { StatelessWidget }
