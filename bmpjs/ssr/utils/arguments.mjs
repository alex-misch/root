
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

const requiredArgs = (...argNames) => {
	const args = getProcessArguments(...argNames)
	argNames.find( name => {
		if (!args[name])
			throw new Error( `Please specify "${name}" cli-argument` )

		return false
	})
	return true
}

export { getProcessArguments, requiredArgs }
