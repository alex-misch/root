
import util from 'util'

function logger(...msg) {
	console.log( 'Send to client | ', ...msg )
	this.write( `BUNDLER | ${ util.format(...msg) }\t\n` )
}

export { logger }
