import Server from './core/server'
import { Bundler } from './core/bundler.mjs';
import { transformBabel } from './task/babel.mjs';
import { searchFiles } from './utils/fs.mjs';
import { logger } from './utils/logger.mjs'

const { TCP_LISTEN_PORT: port } = process.env

const Serve = {
	filesToBundle: new Set(),
	waiter: null,
	run() {
		Server.listen({ port })
			.on( 'start', this.onstart )
			.on( 'data', this.ondata.bind(Serve) )
			// .on( 'connect', this.onconnect )
			.on( 'disconnect', this.ondisconnect )
			.on( 'error', this.onerror )
	},
	onstart: ({ port }) => console.log( `Server started listening ${port}\t\n` ),
	onconnect: client => console.log( 'New launcher connected' ),
	ondisconnect: client => console.log( `Launcher "${client.project_folder}" disconnected.\t\n` ),
	onerror: err => console.log( 'Fail', err ),
	async ondata(client, data) {
		try {
			if ( typeof data == 'object' ) {
				logger.call( client, `Prepare to initialize "${data.project_folder}" project...` )
				await this.initBundler( client, data )
				logger.call( client, `Wait for changes...` )
			} else {
				// filechange
				if ( client.bundler ) {
					data
						.split( `${client.working_directory}/`)
						.filter( pathname => pathname.includes(client.bundler.sourceDir) )
						.forEach( filepath => this.filesToBundle.add( filepath ) )
					clearTimeout( this.waiter ) // throttled
					this.waiter = setTimeout( async () => {
						this.waiter = null
						await client.bundler.compile([ ...this.filesToBundle ])
						this.filesToBundle.clear()
						logger.call( 'Done ', this.filesToBundle.map( f => `${f}\n\t` ) )
						logger.call(client,  "Wait for changes..." )
					}, 200 )
				}
			}

		} catch (e) {
			logger.call(client, 'Error', e)
		}
	},
	async initBundler(client, {working_directory, project_folder}) {
		if ( !working_directory )
			throw new Error( `Fail to initialize project. "working_directory" is not specified in your task` )
		if ( !project_folder )
			throw new Error( `Fail to initialize project. "project_folder" is not specified in your task` )

		client.working_directory = working_directory
		client.project_folder = project_folder
		client.bundler = new Bundler({
			destination_folder: `${project_folder}/.tmp/`,
			source_folder: `${project_folder}/src/`,
			symlinkAssets: true,
			afterBuild: () => logger.call( client, `Wait for changes...` )
		})
		// Describe js transpiler
		client.bundler.describe({
			if: { extension: '.js' },
			perform: async filepath => {
				const bundle = await transformBabel(filepath)
				logger.call( client, `- Completed "babel" ${filepath}` )
				return bundle
			}
		})
		// Compile all
		await client.bundler.compile(
			searchFiles({
				regex: /\.(js|html)$/,
				dir: client.bundler.sourceDir
			})
		)
	}
}

Serve.run()
