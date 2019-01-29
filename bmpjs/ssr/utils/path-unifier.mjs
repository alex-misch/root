
/**
 * Replace all double+ slashes and check for exists / in end end start of url
 * @method
 * @param {string} path path that will be unified
 * @example
 * p1 = unifyPathname('///foo/bar//baz')
 * p1 === '/foo/bar/baz/' // -> true
 * p2 = unifyPathname('foobar/baz')
 * p1 === '/foobar/baz/' // -> true
 */
const unifyPathname = path => {
	if ( path === '/' || path == '' ) return '/'
  return path
    .replace( /^\/?([^?#]+?)\/?((?=\?|#).*)?$/, '/$1/$2' ) // add end slash and start slash
    .replace( /\/\/+/g, '/' ) // remove multiple slashes
}

export { unifyPathname }
