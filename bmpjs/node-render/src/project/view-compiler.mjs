import { BmpRender } from "../bmp-render/index.mjs";
import * as routerConf from "./config.mjs";

import project from '../package.json'
import { Mocks } from "../mocks/index.mjs";
import {
	MetaTags,
	inlineStyle,
	inlineScript
} from "../../utils/html.mjs";

const bmpRender = new BmpRender()

class ViewCompiler {

	constructor({ request }) {

		this.request = request
		this.css = null
		this.template = null
		this.metatags = null
		this.lang = 'en'

	}

	runApplication(ctx, dependencies) {

		for ( let dependency of dependencies ) {
			// execute all dependencies files
			if ( dependency.source.js ) {
				await bmpRender.htmlComponent({
					url: dependency.source.js,
					context: context
				})
			}
		}

		const { application } = project.bmp
		const { result } = await bmpRender.htmlComponent({
			url: application,
			context: context
		})
		return result
	}


	async render() {
		/** Run main application file  */

		/** Create enviroment of sandbox (not is like browser) */
		const context = {
			request: this.request,
			location: new URL( routerConf.server_name + this.request.uri ),
			routerConf: routerConf,
			...Mocks
		}
		const result = await this.runApplication( context, routerConf.urlConf )

		try {
			/** Project entrypoint from package.json */
			this.css = result.css
			this.template = result.html
			this.meta = result.metatags

		} catch (err) {
			console.log('Fail to render', err)
			process.exit( 1 )
		}

		return this.getShell()

	}

	/** TODO: download it from server or something else */
	getShell() {
		return `<!DOCTYPE html>
			<html lang="${ this.lang }">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<meta http-equiv="X-UA-Compatible" content="ie=edge">
					${ MetaTags.stringify( this.metatags ) }
					${ inlineStyle( this.css ) }
				</head>
				<body>
					${ this.template }
					${ inlineScript( `
						window.bmp_config = {
							router: ${ JSON.stringify( routerConf ) }
						}
					` ) }
					${ inlineScript( this.js ) }
				</body>
			</html>
		`
	}

}

export { ViewCompiler }
