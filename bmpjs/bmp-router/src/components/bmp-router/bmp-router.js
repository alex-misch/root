import { isPatternMatchUrl, extractValues } from '../../utils/path-parser.js'
import { unifyPathname } from '../../utils/path-unifier.js'
import { BmpCore } from 'bmp-core'

// config of router that can be changed with static method
let config = null

const trackView = (view) => {
	if ( typeof ga == 'function' ) ga('send', 'pageview')
}

/**
 * Router web-component class. <br/>
 * Creates 'bmp-view' elements based on location pathname and base html-tag <br/>
 * Work on bmp-based config file that will be required relative to web path <br/>
 * Bmp-based config supports url pattern syntax with expected/unexpected parameters: <br/>
 * /benefit/:slug/ <br/>
 * /benefit/:slug{lotte-plaza|carhopper}/ <br/>
 * @class
 * @example
 * ... config.js:
 *  routes: [
 *    { url: '/benefit/', template: 'Benefit list' },
 *    { url: '/benefit/:slug/', template: 'Benefit detail' }
 *    { url: '/benefit/:slug{carhopper}/', template: 'Benefit carhopper detail' }
 *  ]
 * ...
 * <bmp-router data-config="./config.js"></bmp-router>
 */
class BmpRouter extends HTMLElement {

  /** @constructor */
  constructor () {
    super()
    // preset options
    this.scrollRegistry = {}
    this.currentRoute = ''
	}


	static config( confObj ) {
		config = confObj
	}


  static get is() {
		return 'bmp-router'
	}


  /**
   * Getter, returns base path from "base" tag without url origin
   * @example
   * <base href="http://localhost/foo/bar/" />
   * ...
   * <script>console.log( RouterInstance.basepath )</script> // -> /foo/bar/
   */
  get basepath() {
    const href = document.querySelector( 'base' ).href
    return href.replace( /https?:\/\/[\w.-]+(\:[0-9]+)?/g, '' ) // remove domain and protocol
	}


  async connectedCallback () {

    this.config = await this.requireConfig()
    this._refreshViews()

    this.handlePopstate = ev => {
			ev.preventDefault()
      this._refreshViews()
			trackView( location.pathname )
    }
    window.addEventListener( 'popstate', this.handlePopstate, false )
  }

  disconnectedCallback() {
    window.removeEventListener( 'popstate', this.handlePopstate, false )
  }

  /**
   * Returns config file exports that was declarated in "data-config" attribute
   * @returns {Promise}
   */
  requireConfig() {
		if ( config ) {
			return config
		} else {
			const confFilePath = this.getAttribute( 'data-config' )
			if ( !confFilePath )
				throw new Error( "Configuration file not found" )

			return new Promise( resolve => {
				require( [confFilePath], resolve )
			})
		}
  }

  /**
   * Removes basepath from location.pathname and return unify pathname
   * @return {string} pathname of current state
   */
  getCurrentPathname(pathname = location.pathname) {
    if ( this.basepath ) { // remove basepath from pathname
      pathname = pathname.replace( new RegExp( `^${this.basepath}(.*)$` ), '$1' )
    }
    return unifyPathname( pathname ) // remove all double slashas and add first slash/end slash
  }

  /**
   * Getter
   * @return {Array} current views list in router
   */
  get views() {
    return [...this.children].filter( node => node.tagName != this.config.viewTag )
  }

  getViewConf( pathname ) {
    return this.config.routes.find( route => {
      return isPatternMatchUrl( route.url, pathname )
    })
  }

  /**
   * Load view template from config then create view and insert it to dom
   * Trying to get dynamic params from location, add id to view's attributes
   * @param {string} pathname pathname of view that need to be created
   * @private
   * @example
   * <script>RouterInstance._createView( '/benefits/lotte-plaza/' )</script>
   * ...
   *  <bmp-router>
   *    <bmp-view params='{"slug":"lotte-plaza"}'>Lotte plaza</bmp-view>
   *  </bmp-router>
   * ...
   */
  _createView( pathname ) {
    const view = document.createElement( this.config.viewTag )
    view.setAttribute( 'pathname', pathname )
    const viewConf = this.getViewConf( pathname )

    if ( viewConf ) {
      const params = extractValues( viewConf.url, this.getCurrentPathname() )
      let { template } = viewConf
      if ( params ) {
        const jsonParams = JSON.stringify(params)
        view.setAttribute( 'params', jsonParams )
        if ( template.includes( 'view-params' ) )
          template = template.replace( /view-params=""/g, `view-params='${ jsonParams }'` )
      }
      view.innerHTML = template
    } else {
      view.innerHTML = this.config.not_found_template
    }

    this.appendChild( view )
  }

  /**
   * Caches current scroll position
   * @param {Bolean} isBack what
   */
  _updateScroll( pathname ) {
    const isBack = this.currentRoute.includes( pathname )
    if ( isBack ) {
      // get cached scroll position and set it to view
    } else {
      // cache current scroll position
      this.scrollRegistry[ pathname ] = window.pageYOffset
    }
  }

  /**
   * Refreshing view elements in DOM. Delete all "old" views and create view by current pathname
   * @private
   */
  _refreshViews() {
    let pathname = this.getCurrentPathname()
    if ( pathname != this.currentRoute ) { // fired only for changed path


      if ( this.views.length ) {
        // destroy old view(s)
        this.views.forEach( view => view.setAttribute( 'state', 'anim-out' ) )
      }
      // create new view with current pathname
      this._createView( pathname )
      // update scroll of current state
      this._updateScroll( pathname )
      // cache current route
      this.currentRoute = pathname

    }

  }

  /**
   * Creates new popstate event for window history with passed pathname
   * @param {string} pathname pathname that
   * @param {string} title Title of page
   * @example
   * <script> RouterInstance.go( '/benefits/lotte-plaza/' ) </script>
   */
  go( rawPathname, title = null ) {

		const oldpathname = location.pathname
		const pathname = unifyPathname( `${this.basepath}/${rawPathname}` )

    const urlToGo = location.origin + pathname
    // send url to state params, so we can detect what state is
    window.history.pushState( { 'url': urlToGo }, title, urlToGo )
		window.dispatchEvent( new Event('popstate') )

		if ( unifyPathname(location.pathname) != oldpathname.replace(/(?=\?|#).*/, '') )
				window.scrollTo( 0, 0 )
	}

  /**
   * Returns back by history browser
   * @example
   * <script> RouterInstance.back() </script>
   */
  back() {
    window.history.back()
  }
}

customElements.define(BmpRouter.is, BmpRouter)
export { BmpRouter }
