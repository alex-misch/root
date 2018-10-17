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
			// handle client send data
			this.emit('connect')
			client.on('data', buffer => {
				const data = buffer.toString('utf-8')
				try {
					this.emit('data', client, JSON.parse(data) ) //send object if json
				} catch(e) {
					this.emit('data', client, data) //send string
				}
			})
			// handle error
			client.on('end', event => {
				this.emit('disconnect', client)
			})
		})

	}


	static listen({ port }) {
		const watchServer = new WatchServer()

		watchServer.create()
		watchServer.listener.on('error', (err) => {
			watchServer.emit('error', err)
			throw err;
		})

		watchServer.listener.listen(port, () => {
			watchServer.emit('start', { port })
		})

		return watchServer
	}
}


export default WatchServer
