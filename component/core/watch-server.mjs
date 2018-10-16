import { createServer } from 'net'
import { EventEmitter } from 'events';

class WatchServer extends EventEmitter {

	constructor() {
		super()
		this.clients = []
		this.listener = null
	}


	create() {
		this.listener = createServer( client => {
			client.id = this.clients.length
			this.clients.push( client )

			// wait for client specify his folder
			client.on('data', buffer => {
				const data = buffer.toString('utf-8')
				try {
					this.emit('data', client, JSON.parse(data) ) //send object if json
				} catch(e) {
					this.emit('data', client, data) //send string
				}
			})
			client.on('end', event => {
				this.clients.splice(client.id, 1)
				this.emit('disconnect', client)
			})
		})

	}


	static listen({ port }) {
		const watchServer = new WatchServer()

		watchServer.create()
		watchServer.listener.on('error', (err) => {
			throw err;
		})
		watchServer.listener.listen(port, () => {
			watchServer.emit('start', { port })
		})

		return watchServer
	}
}


export default WatchServer
