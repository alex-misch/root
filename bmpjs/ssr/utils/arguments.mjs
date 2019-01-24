
/**
 * Parse argumets and return object of passed
 */
const getProcessArguments = (...expectedNames) => {
	return process.argv.reduce( (result, argument) => {
		const [attrName, value] = argument.replace(/^\-+/, '').split('=')
		if ( expectedNames.includes(attrName) )
			result[attrName] = value

		return result
	}, {})
}

export { getProcessArguments }
