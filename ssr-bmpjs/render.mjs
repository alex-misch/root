
import { ViewCompiler } from './project/view-compiler.mjs'

/** TODO:
 *
 * > Get shell
 * > Run requested url trought project url conf to get component tag name and component js source entry point {request: {url:'<URL>'}}
 * > Run bmpRender to get html and css
 * > Merge computed html and css with shell
 *
 */
const params = {
	url: null
}

process.argv.forEach( argument => {
	if ( argument.indexOf('--') === 0 )
		argument = argument.replace('--', '')

	const [attr, value] = argument.split('=')
  if ( params.hasOwnProperty(attr) )
		params[attr] = value
});

const request = {
  headers: {},
	uri: params.url,
}

if ( !request.uri ) {
	throw new Error( 'Please specify request uri' )
}

try {
	const render = async (request) => {
		const view = new ViewCompiler({ request })

		try {
			await view.render()
		} catch ( err ) {
			console.error( 'Fail to render:', err )
			process.exit( 1 )
		}

		console.log( view.getShell() )
	}

	render(request)
} catch (e) {
	throw new Error(e)
}


process.on('unhandledRejection', function(reason, p) {
  console.log(`
    Possibly Unhandled Rejection:
      reason:
        ${reason}
  `, p);
});
