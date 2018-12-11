import { render, html, TemplateResult } from '../../../node_modules/lit-html/lit-html.js'
import { CompilableWidget } from './compilable-widget.js'
import { BaseStorage } from '../../shared/base-storage.js';
/**
 * @class
 */
class StatelessWidget extends HTMLElement {

	constructor() {
		super()
		this.widgetStorage = new BaseStorage()
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

	/**
	 * Compiler of widget list return compiled widget if it can. If not, return not modified arg
	 * @param {Array<mixed>} widgets list of widgets (and not only) that need to be compiled
	 * @param {String} deepID id, based
	 */
	compileWidgets(widgets, deepID = '') {
		// if not array, convert
		if ( !Array.isArray(widgets) ) widgets = [widgets]

		return widgets.map( (widget, index) => {
			const id = `${deepID}${index}`

			if ( Array.isArray(widget) ) {
				// if got array, go deep recursively
				return this.compileWidgets(widget, id)
			} else if ( widget instanceof TemplateResult ) {
				// TemplateResult is lit-html result, stored values can be widgets. Compile it here
				widget.values = this.compileWidgets(widget.values, id)
				return widget
			} else if ( widget instanceof CompilableWidget ) {
				// valid widget, can be compiled, so do it
				return widget.compile(this, id)
			} else {
				// something else like String, Boolean, etc.
				return widget
			}
		})
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
		// this.oldWidgetList = arguments
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
	 * @async
	 * @private
	 * @example this._hook( 'beforeRender' )
	 */
	_hook(fn) {
		if ( this[fn] && typeof this[fn] === 'function' ) {
			this[fn]()
		} else {
			return Promise.resolve()
		}
	}

	/**
	 * Render content of element (when it attached)
	 * Content must be returned by "content" method
	 * @async
	 */
	render() {
		if ( typeof this.content == 'function' ) {
			if ( !this.processing ) {
				this.processing = true
				this._hook( 'beforeRender' )
				const template = this.compileWidgets(this.content())
				render( template, this )
				this._hook( 'afterRender' )
				this.processing = false
			}
		} else {
			console.warn( 'Widget "content" must be a function, got', typeof this.content )
		}
		return this
	}

	/**
	 * Invoked when the custom element is first connected to the document's DOM
	 * Call render function to first render of element
	 * */
  connectedCallback() {
		this._hook('beforeAttach')
		this.render()
		this._hook('afterAttach')
	}

	/**
	 * check if an element is not defined, define it in customElementRegistry,
	 * try to get from cache old widget
	 * set context and return self
	 * @param { Object } context
	 * @return { StatelessWidget } instance of created widget with defined context
	 */
	static widget(widgetContext) {
		return new CompilableWidget({
			constructor: this,
			context: widgetContext
		})
	}

}

export { StatelessWidget }
