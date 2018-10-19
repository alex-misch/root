import WatchServer from './core/watch-server'
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
	onconnect: client => console.log( 'New launcher connected' ),
	ondisconnect: client => console.log( `Launcher "${client.project_folder}" disconnected.\t\n` ),
	onerror: err => console.log( 'Fail', err ),
	ondata: async (client, data) => {
		try {
			if ( !data.task )
				throw new Error( 'Fail to parse data from client' )

			switch (data.task) {
				case "build":
				case "watch":
					if (!data.working_directory)
						throw new Error( `Fail to initialize ${data.task}. "working_directory" is not specified in your task` )

					client.working_directory = data.working_directory
					client.bundler = await Main.initBundler( data )
					console.log( `"${data.task}" task was successfully initialized` )
					break;

				case "filechange":
					data.relative_path = data.path.replace( `${client.config.working_directory}/`, '')
					client.bundler.fileChanged( data.relative_path )
					break;

				default:
					throw new Error(`Launcher task not specified: "${data.event}"`)
			}
		} catch (e) {
			console.log('Error', e)
		}
	},
	initBundler: async ({ task, project_folder }) => {

		let bundler = null
		let config = {}
		switch (task) {
			case "build":
				const { Build } = await import( './task/build' )
				bundler = new Build()
				await bundler.init({
					folder: project_folder,
					assetsAction: 'copy',
					minify: true
				})
				break;
			case "watch":
				const { Watch } = await import( './task/watch' )
				bundler = new Watch()
				await bundler.init({
					folder: project_folder,
					assetsAction: 'symlink'
				})
				break;
		}

		return bundler
	}
}

Main.run()
