
import { getProcessArguments, requiredArgs } from './utils/arguments.mjs'

import BmpRemoteApp from './core/classes/remote-app'
import VirtualDOMAdapter from './adapters/html/virtual-dom'

requiredArgs( 'url', 'src' )
const args = getProcessArguments('url', 'headers', 'user-agent', 'ip', 'src', 'static')
global.request = {
	headers: (args.headers || {}),
	uri: args.url,
	ip: args.ip,
	static: args.static,
	userAgent: args['user-agent'] || 'Google Chrome'
}

const render = async (clientRequest, entrypoint) => {
	try {
		const app = new BmpRemoteApp({
			htmlAdapter: new VirtualDOMAdapter(),
			entrypoint: entrypoint,
			clientRequest: clientRequest
		})

		/** Get content of app in format { statusCode, html } */
		const { statusCode, html } = await app.render()
		const output = {
			status: statusCode,
			content: html,
			mime: 'text/html'
		}
		process.stdout.write( JSON.stringify(output) )
		// process.exit(0)
	} catch ( err ) {
		console.error( 'Fail to render:', err )
		process.exit(1)
	}
}

render(global.request, args.src)


process.on('unhandledRejection', function(reason, p) {
  // console.log(`
  //   Possibly Unhandled Rejection:
  //     reason:
  //       ${reason}
  // `, p);
});
