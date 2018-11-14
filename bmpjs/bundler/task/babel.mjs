
import babel from '@babel/core'
import path from 'path'

const transformBabel = (filepath) => {
	const options = {
		comments: false,
		presets: [
			[path.resolve(`../bundler/node_modules/@babel/preset-env`),  {
				modules: "amd",
				targets: { chrome: 65 }
			}]
		],
		plugins: [
			path.resolve(`../bundler/node_modules/babel-plugin-syntax-object-rest-spread`)
		]
	}
	return new Promise( (resolve, reject) => {
		babel.transformFile( filepath , options, (err, result) => {
			if ( err ) return reject(err)
			console.log( '- COMPLETE: babel', filepath )
			resolve({ code: result.code })
		})
	})
}

export { transformBabel }
