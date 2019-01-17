const needObserve = value => value &&
		typeof value !== 'function' &&
			!value.__isProxy &&
				!(value instanceof Symbol) &&
					value instanceof Object

const allowedProxyProp = prop => !['__isProxy', 'length'].includes(prop)

const observeArray = (arr, callback) => {
	if ( !arr.hasOwnProperty('push') ) {
		Object.defineProperty(arr, "push", {
			configurable: false,
			enumerable: false, // hide from for...in
			writable: false,
			value: function (...elements) {
				for ( const key in elements ) {
					this[this.length + parseInt(key, 10)] = observe(elements[key], callback)
				}
				callback(this)
				return this
			}
		})
	}
	return arr
}

const observe = ( o, callback ) => {
  const buildProxy = ( prefix, o ) => {
    return Object.seal(
			new Proxy( o, {
				set( target, property, value ) {
					// same as above, but add prefix
					const proxed = needObserve(value) ? buildProxy(`${prefix}${property}.`, value) : value
					target[property] = proxed
					callback( prefix + property, property, value )
					return target
				},
				get( target, property ) {
					const out = target[property]
					/**TODO watch out for arrays */

					if ( needObserve(out) ) {
						if ( Array.isArray(out) )
							return observeArray(out, callback)
						else if ( allowedProxyProp(property) )
							return buildProxy( `${prefix}${property}.`, out )
						else
							return out
					}
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
