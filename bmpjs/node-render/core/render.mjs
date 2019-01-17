import Executor from '../executor'
import FileUtil from '../utils/file'

const Executor = new Executor()

class BmpRender {
	constructor () {}

  async htmlComponent ({ url = null, context = {} }) {
		this.load(url)
		this.execute({ url, context })
	}

	load(url) {
		try {
			this.source = await FileUtil.download({ url })
			// console.log( `Success: fetch ${url}.` )
		} catch ( error ) {
			throw new Error(`Error while fetching file ${url}: ${error}`)
		}
	}

	execute({ url, context }) {
		try {
			const content = await Executor.runCode({
				code: this.source,
				context,
				rootUrl: url
			})
			return content
		} catch ( error ) {
			throw new Error(`Error while running file ${url}: ${error}`)
		}
	}

}

export { BmpRender }
