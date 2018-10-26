import WatchServer from './core/watch-server'
import util from 'util'

const { TCP_LISTEN_PORT: port } = process.env

function logger() {
	console.log( 'Send to client | ', ...arguments )
	this.write( `SERVER | ${ util.format.apply(this, arguments) }\t\n` )
	this.pipe(this)
}

const Main = {
	tasksAllowed: ['build', 'watch'],
	filesToBundle: new Set(),
	waiter: null,
	run() {
		WatchServer.listen({ port })
			.on( 'start', this.onstart )
			.on( 'data', this.ondata )
			// .on( 'connect', this.onconnect )
			.on( 'disconnect', this.ondisconnect )
			.on( 'error', this.onerror )
	},
	onstart: ({ port }) => console.log( `Server started listening ${port}\t\n` ),
	onconnect: client => console.log( 'New launcher connected' ),
	ondisconnect: client => console.log( `Launcher "${client.project_folder}" disconnected.\t\n` ),
	onerror: err => console.log( 'Fail', err ),
	ondata: async (client, data) => {
		try {
			if ( typeof data == 'object' && data.task ) {
				if ( !data.task || !Main.tasksAllowed.includes(data.task) )
					throw new Error(`Launcher task not specified: "${data.event}"`)
				if (!data.working_directory)
					throw new Error( `Fail to initialize ${data.task}. "working_directory" is not specified in your task` )

				console.log( `Prepare to initialize "${data.task}" task...` )
				client.working_directory = data.working_directory
				client.project_folder = data.project_folder
				client.bundler = await Main.initBundler( data )
				console.log( `"${data.task}" task was successfully initialized` )

			} else {
				// filechange
				if ( client.bundler ) {
					data.split( `${client.working_directory}/`).forEach(
						filepath => Main.filesToBundle.add( filepath )
					)

					clearTimeout( Main.waiter ) // throttled
					Main.waiter = setTimeout( () => {
						Main.waiter = null
						Main.runBundler(client)
					}, 200 )
				}
			}

		} catch (e) {
			console.log('Error', e)
		}
	},
	initBundler: async ({ task, project_folder }) => {

		let bundler = null
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
	},
	runBundler: async client => {
		const { working_directory, project_folder, bundler } = client
		const projectSrcDir = `${ project_folder }/src`
		const bundlePromise = [...Main.filesToBundle ].map( filepath => {
			if (filepath && filepath.includes(projectSrcDir) ) {
				return bundler.transform( filepath )
			}
			return Promise.resolve()
		})
		Main.filesToBundle.clear()
		await Promise.all(projectSrcDir)
		// console.log( 'Wait for changes...' )
	},
}

Main.run()
