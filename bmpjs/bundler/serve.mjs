import Server from './core/server'
import { Bundler } from './core/bundler.mjs';
import { transformBabel } from './task/babel.mjs';
import { searchFiles } from './utils/fs.mjs';
import { logger } from './utils/logger.mjs'
import { transformSassToJs } from './task/sasstojs.mjs';

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
					console.log( client.bundler.sourceDir, data )
					data
						.split( `${client.working_directory}/`)
						.filter( pathname => pathname.includes(`${client.project_folder}/src`) )
						.forEach( filepath => this.filesToBundle.add( filepath ) )
					clearTimeout( this.waiter ) // throttled
					this.waiter = setTimeout( async () => {
						this.waiter = null
						const filelist = [...this.filesToBundle]
						this.filesToBundle.clear()
						logger.call(client, 'Files changed ', ...filelist )
						await client.bundler.compile( filelist )
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
			throw new Error( `Fail to initialize project. "working_directory" is not specified in your launcher` )
		if ( !project_folder )
			throw new Error( `Fail to initialize project. "project_folder" is not specified in your launcher` )

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
				try {
					const bundle = await transformBabel(filepath)
					logger.call( client, `- Completed "babel" ${filepath}` )
					return bundle
				} catch (e) {
					logger.call(client, '- Error "javascript"', e)
				}
			}
		})

		client.bundler.describe({
			if: { extension: '.sass' },
			perform: async filepath => {
				try {
					const result = await transformSassToJs(filepath)
					logger.call( client, `- Completed "sass" ${filepath}` )
					return result
				} catch (e) {
					logger.call(client, '- Error "sass"', e)
				}
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
