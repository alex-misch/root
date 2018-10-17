
import babel from 'babel'

const transform = async filepath => {
	console.log( `Run babel for ${filepath}` )
	// return babel(filepath)
}

export { transform }
