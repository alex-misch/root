
import rollup from 'rollup'

const transform = async filepath => {
	console.log( `Run rollup for ${filepath}` )
	// return rollup(filepath)
}

export { transform }
