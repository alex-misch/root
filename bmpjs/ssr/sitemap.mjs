
import fs from 'fs'
import { getProcessArguments } from './utils/arguments.mjs'

import VirtualDOMDriver from './drivers/html/virtual-dom'
import BmpRemoteApp from './core/classes/remote-app.mjs'

const args = getProcessArguments('output', 'src', 'origin', 'user-agent')
const remoteApp = new BmpRemoteApp({
	entrypoint: args.src,
	htmlDriver: new VirtualDOMDriver(),
	clientRequest: {
		origin: args.origin,
		userAgent: args['user-agent']
	}
})

const generate = async (remoteApp) => {
	let sitemap
	try {
		sitemap = await remoteApp.sitemap()
	} catch (e) {
		console.error(e)
		process.exit(1)
	}
	if (args.output === 'stdout') {
		process.stdout.write( JSON.stringify({
			status: 200,
			content: sitemap.toXML(),
			mime: 'text/xml'
		}) )
	} else {
		fs.writeFile( './sitemap.xml', sitemap.toXML(), (err) => {
			if (err) throw err;
			console.warn('Sitemap was saved to "sitemap.xml"!');
		})
	}
}

try {
	generate(remoteApp)
} catch(e) {
	console.error('Fail to render', e)
	process.exit(1)
}
