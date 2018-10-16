import fs from 'fs'
import path from 'path'

/**
 * @param { string } currentDirPath
 * directory where need find files
 * @param { function } callback
 * receives file path and file info
 */
const FindFiles = ({ regex, dir, result = [], recursive = true, ignore = /node_modules/ }) => {
	if ( !regex || !(regex instanceof RegExp) )
		throw new Error( `FindFiles: please specify valid regex parameter ("${regex}" is invalid)` )

	const list = fs.readdirSync(dir)
	if ( !list )
		throw new Error( `FindFiles: fail to read directory "${dir}"` )

	return list.reduce( (result, name) => {
		const filePath = path.join(dir, name)
		const stat = fs.statSync(filePath)

		if ( stat.isFile() && regex.test(filePath) ) {
			console.log( 'add', filePath )
			return result.concat([ filePath ])
		} else if (stat.isDirectory() && recursive && !ignore.test(filePath) ) {
			return result.concat(
				FindFiles({ // go to subdirectory
					dir: filePath, regex, result, recursive
				})
			)
		}
		return result

	}, result)
}

export { FindFiles }
