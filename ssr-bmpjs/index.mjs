import { BmpRender } from './bmp-render/index.mjs'

const bmpRender = new BmpRender()

bmpRender.htmlComponent({ url: 'https://jetsmarter.com/data/website/code/test/entry-point.js' })
  .then(result => console.log(`\nRender result: ${result}`))
  .catch(error => { throw new Error(`Crash while render: ${error}`) })


process.on('unhandledRejection', function( reason, p ){
  console.log(`
    Possibly Unhandled Rejection:
      reason:
        ${reason}
  `, p);
});