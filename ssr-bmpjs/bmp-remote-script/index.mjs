import vm from 'vm'
import path from 'path'
import request from 'request'
import { URL } from 'url'

import project from '../package.json'

/**
 * Compute absolute destination URL
 * @param { String } root URL
 * @param { String } to path ot URL
 * @returns { String }
 */
const genURL = (root, to) => {
	if ( project.bmp.external.hasOwnProperty( to ))
		return project.bmp.external[ to ]

  if ( path.isAbsolute( to ))
    return to
  const referanceURL = new URL(root)
  return `${referanceURL.origin}${ path.normalize(`${path.join(path.dirname(referanceURL.pathname), to)}`) }`
}


/**
 * Fetch file
 * @param { String } url
 * @returns { Promise }
 */
const getFile = url => new Promise(( resolve, reject ) => {
  request.get(
    url, ( error, response, body ) =>
      ( !error && response.statusCode >= 200 && response.statusCode < 400 ) ?
        resolve( body ) : reject( error )
  )
})


class BmpRemoteScript {
  constructor () {
		this.cache = {}
	}

  getFile ({ url = null }) {
    this.fileURL = url
    return ( async _ => {
      try {
        return await getFile( this.fileURL )
      } catch ( error ) {
        throw new Error(`\nUnable to get file ${this.fileURL}: ${error}\n`);
      }
    })()
  }

  async runFile ({ script = null, context = {} }) {

		// Provide some globals
		this.sandbox = vm.createContext( context )

		const entryScript = new vm.SourceTextModule( script, { context: this.sandbox })

    const linker = async ( dependencePath, referencingModule ) => {
      /** TODO:
       *
       * > Here is the place to find and rewrite some dependencies like BMPCoreJS in script
       * > Use "dependencePath" to detect dependencies we intrested in
       */
			if ( dependencePath ) {
				let url = referencingModule.realWorldUrl || this.fileURL
				url = genURL( url, dependencePath )

				let moduleText = this.cache[url] // try to get from cache
				if ( !moduleText ) {
					try {
						if ( dependencePath === './config.js' ) {
							// console.log( 'Skip dependency', dependencePath )
							moduleText = 'export {};' // config is empty, all config is already here
						} else {
							// console.log( 'Load dependency', dependencePath, ' from ', url )
							moduleText = await this.getFile({ url })
						}

						this.cache[url] = moduleText
					} catch ( error ) {
						throw new Error(`\nUnable to get file content for Linker: ${error}\n`)
					}
				}

				let fileModule = new vm.SourceTextModule( moduleText, { context: this.sandbox })
				fileModule.realWorldUrl = url
				return fileModule
      }
      throw new Error(`\nUnable to resolve dependency: ${dependencePath}\n`)
    }

    try {
      await entryScript.link( linker )
    } catch ( error ) {
      throw new Error(`\nUnable to link module: ${error}\n`)
    }

    try {
      entryScript.instantiate()
    } catch ( error ) {
      throw new Error(`\nUnable to instantiate module: ${error}\n`)
    }

    try {
			const result = await entryScript.evaluate()
      return result
    } catch ( error ) {
			// console.log( error )
      throw new Error(`\nUnable to evaluate module: ${ error }\n`)
    }

  }
}

export default BmpRemoteScript
