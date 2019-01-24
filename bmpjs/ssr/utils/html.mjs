
const MetaTags = {
	prefixes: [ '', 'twitter', 'og' ],

	stringify(objTags) {
		if (!objTags) return ''
		return Object.keys( objTags ).map( tag => {
			return MetaTags.prefixes.map(
				prefix => `<meta content="${ prefix + tag }" value="${ objTags[tag] }" />`
			).join('')
		}).join('')
	}

}

const inlineStyle = css => css ? `<style>${ css }</style>` : ''

const inlineScript = js => js ? `<script>${ js }</script>` : ''

export { MetaTags, inlineStyle, inlineScript }
