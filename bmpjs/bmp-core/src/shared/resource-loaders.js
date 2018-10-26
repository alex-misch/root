/** Contains static methods for loading .js and .css files */
class Loaders {
  /** Use to load styles
   * @param { string } url
   * @returns { Promise }
   */
  static css ( url = '' ) {
    return new Promise(( res, rej ) => {
      let xhr = new XMLHttpRequest()
      xhr.addEventListener( "load", _ => {
        if ( xhr.status >= 200 && xhr.status <= 300 ) {
          const style = document.createElement( 'style' )
          style.type = 'text/css'
          style.appendChild( document.createTextNode( xhr.responseText ) )
          document.head.appendChild( style )
          res( url )
        } else {
          rej({ error: xhr.status + ' : ' + xhr.statusText })
        }
      })
    })
  }

  static styles ( url = '' ) {
    return Loaders.css( url )
  }

  /** Use to load javascript
   * @param { string } url
   * @returns { Promise }
   */
  static js ( url = '' ) {
    return new Promise(( res, rej ) => {
      requirejs([url], res )
    })
  }

  static script ( url = '' ) {
    return Loaders.js( url )
  }

}


export { Loaders }