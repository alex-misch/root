
/**
 * Replace all double+ slashes and check for exists / in end end start of url
 * @method
 * @param {string} path path that will be unified
 */
const unifyPathname = path => {
	if ( path === '/' || path == '' ) return '/'
  return path
    .replace( /^\/?([^?#]+?)\/?((?=\?|#).*)?$/, '/$1/$2' ) // add end slash and start slash
    .replace( /\/\/+/g, '/' ) // remove multiple slashes
}

/**
 * Retrun
 * @param {String} path pathname from which the depth level will be taken
 * @return {Number}
 * @example
 * <script>
 *  const dl = getDepthLevel('/foo/bar/baz/'); // dl = 3
 * </script>
 */
const getDepthLevel = path => {
  return path.split( '/' ).filter( s => s != '' ).length
}

export { unifyPathname, getDepthLevel }
