
/**
 * Parse argumets and return object of passed
 */
const getProcessArgumets = (...expectedNames) => {
	return process.argv.reduce( (result, argument) => {
		if ( argument.indexOf('--') === 0 )
			argument = argument

		const [attrName, value] = argument.replace('--', '').split('=')
		if ( expectedNames.includes(attrName) )
			result.push( attrName, value )

		return result
	}, [])
}

export { getProcessArgumets }
