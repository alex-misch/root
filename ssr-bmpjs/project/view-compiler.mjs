import { HTMLError } from "./html-error.mjs";
import { BmpRender } from "../bmp-render/index.mjs";
import { MetaTags } from "./meta-tags.mjs";
import * as routerConf from "./config.mjs";

import project from '../package.json'
import { Mocks } from "../mocks/index.mjs";

const bmpRender = new BmpRender()

class ViewCompiler {

	constructor({ projectName, request }) {

		this.request = request
		this.view = {
			template: null,
			meta: null
		}

	}


	async render() {
		/** Run main application file  */

		/** Create enviroment of sandbox (not is like browser) */
		/** TODO: refactor to make it more flexible */
		const context = {
			request: this.request,
			location: new URL( routerConf.server_name + this.request.uri ),
			routerConf: routerConf,
			BMPCSSJS: {},
			...Mocks
		}
		/** Project entrypoint from package.json */
		const url = project.bmp.application

		try {
			for ( let view of routerConf.urlConf ) {
				// load all dependencies of urlConf
				if ( view.source.js ) {
					await bmpRender.htmlComponent({
						url: view.source.js,
						context: context
					})
				}
			}

			const { result } = await bmpRender.htmlComponent({
				url: project.bmp.application,
				context: context
			})

			this.view.css = result.css
			this.view.template = result.html
			this.view.meta = new MetaTags()

		} catch (err) {
			console.log('Fail to render', err)
			process.exit( 1 )
		}

	}


	getShell() {
		return `<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<meta http-equiv="X-UA-Compatible" content="ie=edge">
					${ this.view.meta.stringify() || '' }
					<meta name="status-code" content="200">
					<style>${ this.view.css || '' }</style>
				</head>
				<body>
					${ this.view.template }
					<script>
					window.bmp_config = {
						router: ${ JSON.stringify( routerConf ) }
					}
					</script>
					<script>${ this.view.js }</script>
				</body>
			</html>
		`
	}

}

export { ViewCompiler }
