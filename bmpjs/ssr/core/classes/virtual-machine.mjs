import vm from 'vm'
import path from 'path'
import { URL } from 'url'
import { download } from '../../utils/file.mjs'
import project from '../../package.json'

/**
 * Compute absolute destination URL
 * @param { String } root URL
 * @param { String } to path ot URL
 * @returns { String }
 */
const genURL = (root, to) => {
	if ( project.bmp.external && project.bmp.external.hasOwnProperty( to ))
		return project.bmp.external[ to ]

  if ( path.isAbsolute( to )) return to
  const referanceURL = new URL(root)
  return `${referanceURL.origin}${ path.normalize(`${path.join(path.dirname(referanceURL.pathname), to)}`) }`
}


class VirtualMachine {

	/**
	 * Starts virtual machine with passed context
	 * @constructor
	 * @param {Object} context of virtual machine
	 */
  constructor (context) {
		this.cache = {}

		const domContext = {
			...context,
			window: context
		}
		// Add observe to context to catch errors
		const contextProxy = new Proxy(domContext, {
			get(target, property) {
				return target[property] || global[property] || null
			}
		})
		this.context = vm.createContext(contextProxy)
	}

	getContext() {
		return this.context
	}

	/**
	 * Load all dependencies of ECMAScript code and execute it in sandbox with passed context
	 * @param {Object} { code, context, selfurl } of module
	 * @return {String} last return of script
	 */
  async run({ code = null, rootUrl = '' }) {

		// Provide some globals
		const vmModule = new vm.SourceTextModule( code, { context: this.context })

    const linker = async ( dependencePath, referencingModule ) => {
			if ( !dependencePath )
				throw new Error(`\nUnable to resolve dependency: ${dependencePath}\n`)

			const referencePath = referencingModule.realWorldUrl || rootUrl
			const moduleText = await this.loadModuleSource(referencePath, dependencePath)
			const fileModule = new vm.SourceTextModule( moduleText, { context: this.context })
			fileModule.realWorldUrl = referencePath
			return fileModule
		}

		await this.link(vmModule, linker)
		await this.instantiate(vmModule)

		return await this.evaluate(vmModule)
	}

	/**
	 * Resolves module path and download it text source
	 * @param { String } referencePath path of parent module
	 * @param { String } dependencePath path of module that need to be loaded
	 * @return { String } source of module
	 */
	async loadModuleSource(referencePath, dependencePath) {
		const url = genURL( referencePath, dependencePath )

		 // try to get from cache
		if ( this.cache[url] ) return this.cache[url]

		this.cache[url] = await download( url.endsWith('.js') ? url : `${url}.es.js` )
		return this.cache[url]
	}

	/** Link module of throw error */
	async link(vmModule, linker) {
    try {
      await vmModule.link( linker )
    } catch ( error ) {
      throw new Error(`\nUnable to link module: ${error}\n`)
    }
	}

	/** Instantiate module of throw error */
	instantiate(vmModule) {
    try {
      vmModule.instantiate()
    } catch ( error ) {
      throw new Error(`\nUnable to instantiate module: ${error}\n`)
    }
	}

	/**
	 * Compute module
	 * @param {vm.SourceTextModule} vmModule module to evaluate
	 * @return {*} result of module evaluator
	 */
	async evaluate(vmModule) {
    try {
			const result = await vmModule.evaluate()
			return result
    } catch ( error ) {
      throw new Error(`\nUnable to evaluate module: ${ error }\n`)
    }
	}

}

export default VirtualMachine
