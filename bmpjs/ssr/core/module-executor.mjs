import vm from 'vm'
import path from 'path'
import { URL } from 'url'
import { download } from '../utils/file.mjs'
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


class ModuleExecutor {

	/**
	 * @constant
	 */
  constructor () {
		this.cache = {}
	}

	/**
	 * Load all dependencies of ECMAScript code and execute it in sandbox with passed context
	 * @param {Object} { code, context, selfurl } of module
	 * @return { String } last return of script
	 */
  async runCode ({ code = null, context = {}, rootUrl = '' }) {

		// Provide some globals
		context.window = context
		this.sandbox = vm.createContext(
			new Proxy(context, {
				get(target, property) {
					if (!target[property]) {
						// if (!global[property])
							//console.log("empty", property)
						// else
							return global[property]
					}

					return target[property]
				}
			})
		)
		const vmModule = new vm.SourceTextModule( code, { context: this.sandbox })

    const linker = async ( dependencePath, referencingModule ) => {
			if ( !dependencePath )
				throw new Error(`\nUnable to resolve dependency: ${dependencePath}\n`)

			const referencePath = referencingModule.realWorldUrl || rootUrl
			const moduleText = await this.loadModuleSource(referencePath, dependencePath)
			const fileModule = new vm.SourceTextModule( moduleText, { context: this.sandbox })
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
		if ( this.cache[url] )
			return this.cache[url]

		// load file from remote
		try {
			// TODO: make it more flexible
			if ( dependencePath === './config.js' ) {
				console.log( 'Skip dependency', dependencePath )
				return 'export {};' // config is empty, all config is already here
			} else {
				// console.log( 'Load dependency', dependencePath, ' from ', url )
				this.cache[url] = await download( url )
				return this.cache[url]
			}

		} catch ( error ) {
			throw new Error(`\nUnable to get file content: ${error}\n`)
		}
	}

	async link(vmModule, linker) {
    try {
      await vmModule.link( linker )
    } catch ( error ) {
      throw new Error(`\nUnable to link module: ${error}\n`)
    }
	}

	instantiate(vmModule) {
    try {
      vmModule.instantiate()
    } catch ( error ) {
      throw new Error(`\nUnable to instantiate module: ${error}\n`)
    }
	}

	async evaluate(vmModule) {
    try {
			return await vmModule.evaluate()
    } catch ( error ) {
			console.log( error )
      throw new Error(`\nUnable to evaluate module: ${ error }\n`)
    }
	}

}

export default ModuleExecutor
