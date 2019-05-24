
import { getProcessArguments, requiredArgs } from './utils/arguments.mjs'

import BmpRemoteApp from './core/classes/remote-app'
import VirtualDOMDriver from './drivers/html/virtual-dom'
import { timeStamp } from './utils/timeline.mjs';

requiredArgs( 'url', 'src' )
const args = getProcessArguments('url', 'headers', 'user-agent', 'ip', 'src', 'origin', 'host')
global.request = {
	headers: (args.headers || {}),
	uri: args.url,
	ip: args.ip,
	origin: args.origin,
	userAgent: args['user-agent']
}

const render = async (clientRequest, entrypoint) => {
	const app = new BmpRemoteApp({
		htmlDriver: new VirtualDOMDriver(),
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
	process.on('exit', code => console.warn(`Node SSR Finished in `, timeStamp() ))
	// process.exit(0)
}

render(global.request, args.src)


process.on('unhandledRejection', function(reason, p) {
  console.error(reason);
});
