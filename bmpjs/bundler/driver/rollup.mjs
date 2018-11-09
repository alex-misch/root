
/** Core */
import rollup from 'rollup'
import path from 'path'


const parsePluginConfig = async (name, config, pathPrefix = '') => {
	switch (name) {
		case "babel":
			let presets = []
			if ( Array.isArray(config.presets) )
				presets = config.presets.map( preset => [
					path.join( pathPrefix, 'node_modules', preset[0] ),
					preset[1]
				])

			const plugins = await asyncLoad( config.plugins, '@babel/plugin-' )
			return {
				presets: presets,
				exclude: "node_modules/**",
				babelrc: false,
				plugins: plugins
			}
		default:
			return config
	}
}


const transform = async (filepath, config, pathPrefix = '') => {
	// const plugins = await asyncLoad( config.plugins, 'rollup-plugin-', pathPrefix )
	const bundle = await rollup.rollup({
		input: filepath,
		plugins: config.plugins
	})
	const { code } = await bundle.generate({ format: config.format })
	return {
		code: code || ''
	}
}

export { transform }
