import WatchServer from './core/watch-server'
import { Bundler } from './core/bundler'

const { TCP_LISTEN_PORT: port } = process.env

WatchServer.listen({ port })
	.on( 'start', ({ port }) => {
		console.log( `Server started listening ${port}\t\n` )
	})
	.on( 'data', (client, data) => {
		if ( data.path ) {
			console.log( `Received from client: ${ data }\t\n` )
			client.bundler.fileChanged( data.path )
		} else if ( data.project_folder ) {
			console.log( `Init project: ${ data.project_folder }\t\n` )
			client.project_folder = data.project_folder
			client.bundler = new Bundler(client.project_folder)
		}
	})
	.on( 'disconnect', client => {
		console.log( `Watcher "${client.project_folder}" disconnected\t\n` )
	})
	.on('error', err => {
		throw err
	})
