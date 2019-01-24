
import { ViewCompiler } from './core/view-compiler.mjs'
import { getProcessArguments } from './utils/arguments.mjs'

import pack from "./package.json"

const args = getProcessArguments('url', 'headers')
if ( !args.url ) {
	throw new Error( 'Please specify request url as cli-argument' )
}

global.request = {
	headers: (args.headers || {}),
	origin: "https://jetsmarter.com",
	uri: args.url,
	ip: args.ip,
	userAgent: args.userAgent
}


const render = async (request, script) => {
	try {
		const view = new ViewCompiler({ request })
		const resultHTML = await view.render()
		process.stdout.write( JSON.stringify({
			status: 200,
			content: resultHTML
		}))
	} catch ( err ) {
		console.error( 'Fail to render:', err )
		process.exit( 1 )
	}
}

render(global.request, pack.bmp.application)


process.on('unhandledRejection', function(reason, p) {
  // console.log(`
  //   Possibly Unhandled Rejection:
  //     reason:
  //       ${reason}
  // `, p);
});
