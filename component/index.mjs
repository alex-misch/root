import WatchServer from './core/watch-server'
import { Bundler } from './core/bundler'
import util from 'util'

const { TCP_LISTEN_PORT: port } = process.env

function logger() {
	console.log( 'Send to client | ', ...arguments )
	this.write( `SERVER | ${ util.format.apply(this, arguments) }\t\n` )
	this.pipe(this)
}

const Main = {
	run() {
		WatchServer.listen({ port })
			.on( 'start', this.onstart )
			.on( 'data', this.ondata )
			.on( 'connect', this.onconnect )
			.on( 'disconnect', this.ondisconnect )
			.on( 'error', this.onerror )
	},

	onstart: ({ port }) => console.log( `Server started listening ${port}\t\n` ),
	onconnect: client => console.log( 'New watcher connected' ),
	ondisconnect: client => console.log( `Watcher "${client.project_folder}" disconnected\t\n` ),
	onerror: err => console.log( 'Fail', err ),
	ondata: (client, data) => {
		try {
			if ( !data.event )
				throw new Error( 'Fail to parse event from client' )
			if ( data.event == 'initialize' ) {
				client.relative_folder = data.rel
				client.project_folder = data.project_folder
				client.bundler = new Bundler( data, logger.bind(client) )
			} else if ( data.event == 'filechange' ) {
				data.relative_path = data.path.replace( `${client.relative_folder}/`, '')
				client.bundler.fileChanged( data )
			} else {
				throw new Error(`Fail to load: ${data}`)
			}

		} catch (e) {
			console.log('Error', e)
		}
	}
}

Main.run.apply(Main)
