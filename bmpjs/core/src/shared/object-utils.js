
/**
 * Extract deep value from passed object by specific path with delimiter
 * @param {Array} arr where will be searched value
 * @param {String} where path of object props delimited
 * @param {String} delimiter delimiter of path
 * @example
 * <script>
 * 	extractFrom( { user: { token: 'xyz' } }, 'user.token' ) // 'xyz'
 * </script>
 */
const extractFrom = ( arr, where, delimiter = '.' ) => {
  if ( where !== null && typeof where !== 'undefined' )
    if ( arr.length === 1 ) {
      return where[ arr[ 0 ] ];
    } else {
      // 'where' is object, get the deep value
      let _where = where[ arr[ 0 ] ];
      // 'arr' is array
      let _arr = arr.splice( 1 )
      return extractFrom( _arr, _where, delimiter );
    }
	else
		return null
}

/**
 * Set deep value to passed object by specific path
 * @param { Object } obj
 * @param { Array } arrPath
 * @param {*} value
 * @param {Int} i
 */
const setTo = ( obj, arrPath, value, i = 0 ) => {
  // get current segment of path
  let segment = arrPath[i];

  if ( i != arrPath.length - 1 ) { // if segment is not last
    if ( typeof obj[ segment ] != 'object' ) {
      // segment data not found: set empty object
      obj[ segment ] = {}
    }

    // go to next depth level
    setTo( obj[ segment ], arrPath, value, ++i );
  } else {
    // if last, set value of recursion
    obj[ segment ] = value;
  }

}


export { setTo, extractFrom }
