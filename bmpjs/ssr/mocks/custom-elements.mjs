

/** Server-side CustomElements mock */
class CustomElements {

	constructor() {
		this.elementsRegistry = []
	}

	constructorByTagname(tagName) {
		return this.elementsRegistry.find( element => element.tagName == tagName )
	}

	get( tagName ) {
		// return this.resolve(tagName)
		return this.constructorByTagname(tagName)
	}


  define( tagName, constructor ) {
		if ( this.constructorByTagname(tagName) )
			throw new Error(`CustomElement "${tagName}" is already defined`)

		this.elementsRegistry.push({
			tagName,
			constructor
		})
  }
}

const customElements = new CustomElements()
export { CustomElements, customElements }
