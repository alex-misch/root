import { BaseStorage } from '../../shared/base-storage.js'

const stylesStorage = new BaseStorage()
class CssJS {

	constructor(source) {
		this.source = source
	}

	static inject(css) {
		const style = document.createElement('style')
		style.textContent = css
		document.head.appendChild(style)
	}

  /** Random selector with cuctom prefix
   * @param { String } prefix prefix of selector with -
   * @returns { String } generated uniq string
   */
  genUniqSelector( prefix = 'bmp' ) {
    /** TODO change {Math.random().toString(36).substr(2, 5)} copy-past */
    let selector = `${prefix}-${Math.random().toString(36).substr(2, 5)}`
    if ( this.uniqs.indexOf( selector ) >= 0 )
      return this.genUniqSelector()

    this.uniqs.push( selector )
    return selector
	}

	find(source) {
		return Object
			.keys( this.storage.dataStore() )
			.find( className => stylesStorage.get(className) === source )
	}

	instance(compiledSource) {
		return {
			attach: element => {
				element.classList.add()
				let className = CssJs.find(compiledSource)
				if (!className) className = CssJs.genUniqSelector()
				CssJs.storage[className] = compiledSource
			}
		}
	}

	static compile(source) {
		return new CssJs(source)

		const result = new Adapters[adapter](source)
		result.applyTo(instance)
		return CssJS.instance(result)
	}

}

export { CssJS }
