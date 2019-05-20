
import { default as nodesass } from 'node-sass'
import babel from '@babel/core'
import { options as babeloptions } from './babel'

const transformSassToJs = (filepath, options) => {
	return new Promise( (resolve,reject) => {
		nodesass.render({
			file: filepath,
			...options
		}, async (err, sassresult) => {
			if (err) {
				reject(err.formatted)
			} else {
				const { code } = await babel.transform( 'export default `'+sassresult.css+'`',  babeloptions )
				resolve({ code, extension: 'js' })
			}
		});
	})
}

export { transformSassToJs }
