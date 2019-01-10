import BmpRemoteScript from '../bmp-remote-script'

const bmpRemoteScript = new BmpRemoteScript()

class BmpRender {
	constructor () {}

  async htmlComponent ({ url = null, context = {} }) {
		let script
		try {
			script = await bmpRemoteScript.getFile({ url })
			// console.log( `Success: fetch ${url}.` )
		} catch ( error ) {
			throw new Error(`Error while fetching file ${url}: ${error}`)
		}

		try {
			const content = await bmpRemoteScript.runFile({ script, context })
			// console.log( `Success: run ${url}.` )
			return content
		} catch ( error ) {
			throw new Error(`Error while runing file ${url}: ${error}`)
		}
  }
}

export { BmpRender }
