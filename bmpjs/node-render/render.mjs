
import { ViewCompiler } from './project/view-compiler.mjs'
import { getProcessArguments } from './utils/arguments'

import package from "./package.json"

const args = getProcessArguments('url', 'headers')
if ( !args.uri ) {
	throw new Error( 'Please specify request uri' )
}

const request = {
  headers: (args.headers || {}),
	uri: args.url,
}


const render = async (request, script) => {
	try {
		const view = new ViewCompiler({ request })
		await view.render()
	} catch ( err ) {
		console.error( 'Fail to render:', err )
		process.exit( 1 )
	}
	process.stdout.write( view.getShell() )
}

render(request, package.bmp.application)


process.on('unhandledRejection', function(reason, p) {
  console.log(`
    Possibly Unhandled Rejection:
      reason:
        ${reason}
  `, p);
});
