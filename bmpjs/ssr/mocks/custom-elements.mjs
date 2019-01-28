

import { BmpRouter } from './bmp-router.mjs'


/** Server-side CustomElements mock */
class CustomElements {

	constructor() {
		this.elementsRegistry = []
	}

	/**
	 * TODO: Refactor and delete this part
	 * BmpRouter is not supports VirtualDOM now.
	 * So resolve it as custom dependency
	 * */
	resolve(tagName) {
		switch (tagName) {
			case "bmp-router":
				const Router = this.constructorByTagname('bmp-router')
				const RouterInstance = new Router.constructor()
				BmpRouter.config( RouterInstance.requireConfig() )
				return {
					tagName,
					constructor: BmpRouter
				}
			case "bmp-view":
				return null;
			default:
				return this.constructorByTagname(tagName)
		}

	}

	constructorByTagname(tagName) {
		return this.elementsRegistry.find( element => element.tagName == tagName )
	}

	get( tagName ) {
		return this.resolve(tagName)
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
