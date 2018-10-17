import fs from 'fs-extra'
import path from 'path'

const createSymlink = (from, to) => {
	if ( fs.existsSync( from ) ) {
		fs.linkSync( from, to )
	}
}

const emptyFolder = folder => {
	if ( fs.existsSync(folder) )
		fs.removeSync( folder )

	fs.mkdirSync( folder )
}


/**
 * searches files by passed regular expression
 * @param {RegExp|undefined} regex regular expression for file paths
 * @param {String} dir directory to scan
 * @param {Array} result preset result of filelist
 * @param {Boolean} recursive do you want to search recursively?
 * @param {RegExp} ignore exclude regexp filter
 * @return {Array} filelist
 */
const searchFiles = ({ regex, dir, result = [], recursive = true, ignore = /node_modules/ }) => {
	if ( regex && !(regex instanceof RegExp) )
		throw new Error( `FindFiles: please specify valid regex parameter ("${regex}" is invalid)` )

	// list of files/dirs/descriptors/etc
	const list = fs.readdirSync(dir)
	if ( !list )throw new Error( `FindFiles: fail to read directory "${dir}"` )

	return list.reduce( (result, name) => {
		// full file path
		const filePath = path.join(dir, name)
		// props of file in file system
		const stat = fs.statSync(filePath)

		if ( stat.isFile() ) {
			if ( !regex || regex.test(filePath) )
				// file is regular and path passed regex test
				// push to result array and return it
				return result.concat(filePath)
		} else if (stat.isDirectory() && recursive && !ignore.test(filePath) ) {
			return searchFiles({ // go to subdirectory
				dir: filePath, regex, result, recursive
			})
		}
		// no one of conditions fired
		return result

	}, result)
}

export {
	searchFiles,
	createSymlink,
	emptyFolder
}
