import { render } from "../../../node_modules/lit-html/lib/render"
import { StatelessWidget } from "../widget/stateless-widget";


class BmpApp extends StatelessWidget {

	get render() {
		return render
	}

  /** Create async web components registry for loading dependencies if such component appears in the application.
   * @param { Object } asyncComponents - Expects { tag-name: { styles: [ 'url',... ], scripts: [ 'url',... ] },...}
   */
  registerAsyncComponents ( asyncComponents = {}) {
		if ( !this.asyncComponents ) {
			throw new Error('asyncComponents not defined in BmpApp instance')
		}
    this.asyncTagsList = Object.keys( this.asyncComponents ).map( c => c.toLowerCase() )
  }

  /** Loading css or js dependancies of the specific async web component
   * @param { string } componentName
   */
  loadAsyncComponentDependencies ( componentName = '' ) {
		/** find component dependancies and iterate by type js/css */
		if ( typeof this.asyncComponents[ componentName ] == 'object' ) {
			Object.keys( this.asyncComponents[ componentName ] )
				.forEach( dependenciesType => {
					/** extract list of dependancies by type */
					this.asyncComponents[ componentName ][ dependenciesType ]
						.forEach( dependancyURL => {
							/** and load each with suitable loader */
							Loaders[ dependenciesType ]( dependancyURL )
						})
				})
			/** clean tagsList to skip loading dependancies for this component in the future */
			this.asyncTagsList = this.asyncTagsList.filter( nameInList => nameInList !== componentName )
		}
  }

  /** Attach BmpApp to application container.
   * @param { HTMLElement } htmlElement
   */
  attach ( htmlElement ) {

    /** Assign HTMLElement from args to this context. */
    this.root = htmlElement

    /** Is node one of the registered async web components */
    const nameAsyncComponent = node => {
      if ( node.nodeType === Node.TEXT_NODE || !node.tagName ) return false
      const tag = node.tagName.toLowerCase()
      if ( this.asyncTagsList.indexOf( tag ) >= 0 )
        return tag
      else if ( node.attributes.hasOwnProperty('is') && this.asyncTagsList.indexOf( node.attributes.is ) )
        return node.attributes.is
      else
        return false
    }

    /** Handling new nodes in DOM and if there's asyncComponents load component dependencies.
     * https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord
     * @param { Array } mutationRecords - ex.: [ { type: "childList", target: { Node }, addedNodes: [ {tag-name}, {div},... ] },... ]
    */
    /** Configurate observer to catch only childList mutations. */
    let domMutationConf = { childList: true, subtree: true }

    const getDeepAsyncComponents = (node) => {
      let list = []
      const name = nameAsyncComponent( node )
      if ( name ) list.push( name )
      const childs = [...node.childNodes].filter( n => n.nodeType != Node.TEXT_NODE )
      if ( childs.length ) {
        list = list.concat( ...childs.map( n => getDeepAsyncComponents( n ) ) )
      }
      return list
    }

    /** Create DOM Mutation Observer to detect new tags additions DOM */
    let domMutationObserver = new MutationObserver( mutationRecords => {

    mutationRecords.forEach( mutationRecord => {
      [...mutationRecord.addedNodes]
        .reduce( ( output, node ) => [ ...output, ...getDeepAsyncComponents( node ) ], [] )
        .forEach( this.loadAsyncComponentDependencies.bind(this) )
      })
    } )

    /** Start observing DOM changes */
    domMutationObserver.observe( this.root, domMutationConf )

  }

}

export { BmpApp }
