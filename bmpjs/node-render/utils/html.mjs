
const MetaTags = {
	prefixes: [ '', 'twitter', 'og' ],

	stringify(objTags) {
		return Object.keys( objTags ).map( tag => {
			return MetaTags.prefixes.map(
				prefix => `<meta content="${ prefix + tag }" value="${ objTags[tag] }" />`
			).join('')
		}).join('')
	}

}

const inlineStyle = css => {
	return css ? `<style>${ css }</style>` : ''
}

const inlineScript = css => {
	return css ? `<script>${ css }</script>` : ''
}

export { MetaTags, inlineStyle, inlineScript }
