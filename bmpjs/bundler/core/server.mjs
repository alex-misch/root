import { createServer } from 'net'
import { EventEmitter } from 'events';

class Server extends EventEmitter {

	constructor() {
		super()
		this.listener = null
	}


	create() {
		this.listener = createServer( client => {
			// handle client send data
			this.emit('connect')
			client.on('data', buffer => {
				const data = buffer.toString('utf-8').replace( /\0/g, '' )
				try {
					this.emit('data', client, JSON.parse(data) ) // send object if json
				} catch(e) {
					this.emit('data', client, data ) // send object if json
				}
			})
			// handle error
			client.on('end', event => {
				this.emit('disconnect', client)
			})
		})

	}


	static listen({ port }) {
		const watchServer = new Server()

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


export default Server
