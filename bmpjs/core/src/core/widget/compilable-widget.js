/**
 * @class CompilableWidget
 * Inialize widget that has a compile function
 */
class CompilableWidget {

	/**
	 * Define custom element of widget if it now defined right now cache it to local varables
	 * @constructor
	 * @param { {StatelessWidget, Object} } param widget's constructor and context
	 */
	constructor({ constructor, context }) {
		if ( !customElements.get( constructor.tagname ) )
			// custom element not attached, then attach it
			customElements.define( constructor.tagname, constructor )

		this.context = context
		this.constructor = constructor
	}

	/**
	 * Check do it need to create new widget cached widget is fine
	 * @param {StatelessWidget} widget
	 * @return {Boolean}
	 */
	needToCreate(widget) {
		return !widget || !this.constructor.prototype.isPrototypeOf(widget)
	}

	/**
	 * Check matchs of widget context with self context from constructor
	 * @param {StatelessWidget} widget
	 * @return {Boolean}
	 */
	needToRender(widget) {
		return widget.context != this.context
	}

	/**
	 * Compile widget to HTMLElement instance with context from constructor
	 * Returns cache if parent storage contains widget by passed key with an equal tag
	 * @param {HTMLElement|StatelessWidget} parentInstance element that initiate widget compiler
	 * @param {String} widgetID string-key to search cached widget in parent storage
	 * @returns {HTMLElement|StatelessWidget} compiled element
	 */
	compile(parentInstance, widgetID) {
		// concat widgets id by tag and passed id
		const widgetIdWithTag = `${this.constructor.tagname}${widgetID}`

		let widget = parentInstance.widgetStorage && parentInstance.widgetStorage.get(widgetIdWithTag)
		if ( !widget ) {
			// no cache found, widget need to be created
			widget = document.createElement( this.constructor.tagname )

			// this check works if parent is not StatelessWidget
			// and hasn't storage (ex. document.body)
			if ( parentInstance.widgetStorage )
				parentInstance.widgetStorage.set(widgetIdWithTag, widget)
		}

		if ( this.needToRender(widget) ) {
			// widget need to be rerendered, bind new context and render it
			widget.context = this.context
			widget.render()
		}

		return widget
	}

}


export { CompilableWidget }
