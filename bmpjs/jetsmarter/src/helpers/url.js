
const isActive = (link, strict = false, pathname = location.pathname) => {
	if ( strict )
		return link === pathname
	else
		return (link != '/' && pathname.indexOf( link ) == 0) || link === pathname
}

export { isActive }
