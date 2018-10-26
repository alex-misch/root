
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


const asyncLoad = async (list, prefix, pathPrefix = '') => {
	return await Promise.all(
		list.map( async plugin => {
			let pluginName = null
			let options = {}
			if ( Array.isArray(plugin) ) {
				[pluginName, options] = plugin
			} else {
				pluginName = plugin
			}
			// console.log( `Load dependency ${prefix + pluginName}...` )
			const pluginConf = await parsePluginConfig( pluginName, options, pathPrefix )

			const { default: pluginModule } = await import(prefix + pluginName)
			return typeof pluginModule == 'function' ? pluginModule(pluginConf) : pluginModule.default( pluginConf )
		})
	)
}

const transform = async (filepath, config, pathPrefix) => {
	const plugins = await asyncLoad( config.plugins, 'rollup-plugin-', pathPrefix )
	const bundle = await rollup.rollup({
		input: filepath,
		plugins: plugins
	})
	const { code } = await bundle.generate({ format: config.format })
	return {
		code: code || ''
	}
}

export { transform }
