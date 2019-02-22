
import fs from 'fs'
import { getProcessArguments } from './utils/arguments.mjs'

import BmpRemoteApp from './core/classes/remote-app.mjs'

const args = getProcessArguments('output', 'src')
const remoteApp = new BmpRemoteApp({
	entrypoint: args.src,
	clientRequest: {
		origin: 'https://jetsmarter.com'
	}
})

const generate = async (remoteApp) => {
	const sitemap = await remoteApp.sitemap()
	if (args.output === 'stdout') {
		process.stdout.write( JSON.stringify({
			status: 200,
			content: sitemap.toXML(),
			mime: 'text/xml'
		}) )
	} else {
		fs.writeFile( './sitemap.xml', sitemap.toXML(), (err) => {
			if (err) throw err;
			console.log('Sitemap was saved to "sitemap.xml"!');
		})
	}
}

generate(remoteApp)
