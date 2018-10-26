import BmpRemoutScript from '../bmp-remoute-script'

const bmpRemoutScript = new BmpRemoutScript()

class BmpRender {
  constructor () {}
  htmlComponent ( object = { url: null }) {
    return ( async _ => {
      let script
      try {
        script = await bmpRemoutScript.getFile({ url: object.url })
      } catch ( error ) {
        throw new Error(`Error wile fetching file ${object.url}: ${error}`)
      }

      try {
        return await bmpRemoutScript.runFile({ script: script })
      } catch ( error ) {
        throw new Error(`Error wile runing file ${object.url}: ${error}`)
      }
      
    })()
  }
}

export { BmpRender }
