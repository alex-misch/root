

/** Server-side CustomElements mock */
class CustomElements {

	constructor() {
		this.elementsRegistry = []
	}

	get( tagName ) {
		return this.elementsRegistry.find( element => element.tagName == tagName )
	}


  define( tagName, constructor ) {

		const newInstance = new constructor()
		const BMPVDInstance = newInstance.connectedCallback()

		this.elementsRegistry.push({
			tagName,
			constructor,
			BMPVDInstance
		})
  }
}


const customElements = new CustomElements
export { customElements, CustomElements }
