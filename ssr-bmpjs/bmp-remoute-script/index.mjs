import vm from 'vm'
import path from 'path'
import request from 'request'
import { URL } from 'url'

/**
 * Compute absolute destination URL
 * @param { String } root URL
 * @param { String } to path ot URL
 * @returns { String }
 */
const genURL = ( root, to ) => {
  if ( path.isAbsolute( to ))
    return to
  const referanceURL = new URL(root)
  return `${referanceURL.origin}${path.normalize(`${path.join(path.dirname(referanceURL.pathname), to)}`)}`
}

/**
 * Fake customElements API
 */
const customElements = {
  define: ( tagName, constructor ) => {
    const newInstance = new constructor()
    return newInstance.render()
  }
}

/**
 * Fetch file
 * @param { String } url 
 * @returns { Promise }
 */
const getFile = url => new Promise (( resolve, reject ) => {
  request.get(
    url, ( error, response, body ) =>
      ( !error && response.statusCode >= 200 && response.statusCode < 400 ) ?
        resolve( body ) :
        reject( error )
  )
})


class BmpRemoutScript {
  constructor () {}

  getFile ( object = { url: null }) {
    this.fileURL = object.url
    return ( async _ => {
      try {
        return await getFile( this.fileURL )
      } catch ( error ) {
        throw new Error(`\nUnable to get file ${this.fileURL}: ${error}\n`);
      }
    })()
  }

  async runFile ( object = { script: null }) {
    const sandbox = vm.createContext({ customElements: customElements })
    const entryScript = new vm.SourceTextModule( object.script, { context: sandbox })

    const linker = async ( dependancePath, referencingModule ) => {
      if ( dependancePath ) {
        let url = referencingModule.realWorldUrl || this.fileURL
        let moduleText
        try {
          moduleText = await this.getFile({ url: genURL( url, dependancePath ) })
          let module = new vm.SourceTextModule( moduleText, { context: referencingModule.context })
          module.realWorldUrl = url
          return module
        } catch ( error ) {
          throw new Error(`\nUnable to get file content for Linker: ${error}\n`)
        }
      }
      throw new Error(`\nUnable to resolve dependency: ${dependancePath}\n`)
    }

    try {
      await entryScript.link( linker )
    } catch ( error ) {
      throw new Error(`\nUnable to link module: ${error}\n`)
    }

    try {
      entryScript.instantiate()
    } catch ( error ) {
      throw new Error(`\nUnable to link module: ${error}\n`)
    }

    let result
    try {
      result = await entryScript.evaluate()
      return result.result
    } catch ( error ) {
      throw new Error(`\nUnable to evaluate module: ${error}\n`)
    }

    
    
  }
}

export default BmpRemoutScript
