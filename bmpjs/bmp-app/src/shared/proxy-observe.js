const observe = ( o, callback ) => {
  const buildProxy = ( prefix, o ) => {
    return Object.seal(
			new Proxy( o, {
				set( target, property, value ) {
					// same as above, but add prefix
					target[property] = value
					callback( prefix + property, property, value )
					return true
				},
				get( target, property ) {
					const out = target[property]
					/**TODO watch out for arrays */
					if ( out instanceof Object && !Array.isArray(out) ) {
						return buildProxy( prefix + property + '.', out )
					}
					return out
				}
				// deleteProperty(target, property) {
				//   const deleteRes = delete target[property]
				//   callback( prefix + property, property )
				//   return deleteRes
				// }
			})
		)
  }
  return buildProxy( '', o )
}

export { observe }
