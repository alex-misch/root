

class CompilableWidget {

	constructor({ constructor, context }) {
		if ( !customElements.get( constructor.tagname ) )
			// custom element not attached, then attach it
			customElements.define( constructor.tagname, constructor )

		this.context = context
		this.constructor = constructor
	}

	needToCreate(widget) {
		return !widget || widget.tagName.toUpperCase() !== this.constructor.tagname.toUpperCase()
	}

	needToRender(widget) {
		return widget.context != this.context
	}

	compile(parentInstance, widgetID) {
		const widgetIdWithTag = `${this.constructor.tagname}${widgetID}`
		const storedWidget = parentInstance.widgetStorage.get(widgetIdWithTag)

		let widget = null
		if ( this.needToCreate(storedWidget) ) {
			widget = document.createElement( this.constructor.tagname )
			widget.context = this.context
			parentInstance.widgetStorage.set(widgetIdWithTag, widget)
		} else {
			widget = storedWidget
			if ( this.needToRender(widget) ) {
				widget.context = this.context
				widget.render()
			}
		}
		return widget
	}

}


export { CompilableWidget }
