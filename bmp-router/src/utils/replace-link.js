import { unifyPathname } from "./path-unifier";

export const replaceLink = (link, origin = location.origin) => {
	const href = link.getAttribute( 'href' )

	if ( href && !/^(http|\/\/)/.test( href ) ) {
		link.href = origin + unifyPathname( href )
	}
}
