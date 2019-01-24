import ModuleExecutor from './module-executor'
import { download } from '../utils/file'

const moduleExecutor = new ModuleExecutor()

class BmpRender {
	constructor () {}

  async htmlComponent ({ url = null, context = {} }) {
		await this.load(url)
		return await this.execute({ url, context })
	}

	async load(url) {
		try {
			this.source = await download( url )
		} catch ( error ) {
			throw new Error(`Error while fetching file ${url}: ${error}`)
		}
	}

	async execute({ url, context }) {
		try {
			const content = await moduleExecutor.runCode({
				code: this.source,
				context,
				rootUrl: url,
			})
			return content
		} catch ( error ) {
			throw new Error(`Error while running file ${url}: ${error}`)
		}
	}

}

export { BmpRender }
