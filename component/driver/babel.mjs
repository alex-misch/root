
import babel from '@babel/core'

const transform = async filepath => {
	const options = {

	}
	return new Promise( (resolve, reject) => {
		babel.transformFile( filepath , options, (err, res) => {
			if ( err ) reject( err )

			console.log( '- Babel completed: ', filepath )
			resolve({ code: res.code })
		})
	})
}

export { transform }
