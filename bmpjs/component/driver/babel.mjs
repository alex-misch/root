
import babel from '@babel/core'
import path from 'path'

const resolvePath  = (name, prefix = '') => path.resolve(`${prefix}/node_modules/@babel/${name}`)

const transform = async (filepath, config = {}, pathPrefix) => {
	return new Promise( (resolve, reject) => {
		const options = {
			comments: false,
			plugins: config.plugins.map( plugin => resolvePath(`plugin-${plugin}`, pathPrefix) ),
			presets: config.presets || []
		}
		babel.transformFile( filepath , options, (err, result) => {
			if ( err )
				return reject( err )

			console.log( '- COMPLETE: babel', filepath )
			resolve({ code: result.code })
		})
	})
}

export { transform }
