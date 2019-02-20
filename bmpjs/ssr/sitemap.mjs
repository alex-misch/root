
import fs from 'fs'
import { SitemapGenerator } from './core/sitemap-generator.mjs'
import { routes } from './cache/config.js-com-v5.mjs';
import { getProcessArguments } from './utils/arguments.mjs'


const server_name = 'https://jetsmarter.com'
const sitemap = new SitemapGenerator( routes, server_name )

const args = getProcessArguments('output')
const xmlResult = sitemap.toXML()
if (args.output === 'stdout') {
	process.stdout.write()
} else {
	fs.writeFile( './sitemap.xml', xmlResult, (err) => {
		if (err) throw err;
		console.log('Sitemap was saved to "sitemap.xml"!');
	})
}
