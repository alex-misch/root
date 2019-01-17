


const urlConf = [
	// Home page
	{
		pattern: '/',
		tagname: 'jetsm-home'
	},
	// FAQ
	{
		pattern: '/faq/',
		tagname: 'jetsm-faq-list'
	},
	// Legal
	{
		pattern: '/legal/',
		tagname: 'jetsm-legal-list'
	},
	{
		pattern: '/legal/public-charter-agreements/',
		tagname: 'jetsm-pca'
	},
	{
		pattern: '/legal/public-charter-agreements/:document_number/',
		tagname: 'jetsm-pca-detail'
	},
	{
		pattern: '/legal/:legal_slug/',
		tagname: 'jetsm-legal-detail'
	},

	// Profile
	{
		pattern: '/profile/',
		tagname: 'profile-edit'
	},
	{
		pattern: '/profile/promo/',
		tagname: 'profile-promo'
	},
	{
		pattern: '/profile/verify/',
		tagname: 'profile-verify'
	},
	{
		pattern: '/profile/payment-methods/',
		tagname: 'profile-payment'
	},
	// Authorization
	{
		pattern: '/login/',
		tagname: 'jetsm-login'
	},
	{
		pattern: '/logout/',
		tagname: 'jetsm-logout'
	},
	{
		pattern: '/signup/',
		tagname: 'jetsm-sign-up'
	},
	// Web forms
	{
		pattern: '/partnership/',
		tagname: 'jetsm-form'
	},
	{
		pattern: '/nbaa17/',
		tagname: 'jetsm-form'
	},
	{
		pattern: '/owners/request-form/',
		tagname: 'jetsm-form'
	},

	// TODO: frontend for this routes
	{
		pattern: '/experience/',
		template: 'jetsm-page',
	},
	{
		pattern: '/about/',
		template: 'jetsm-page'
	},
	{
		pattern: '/about/:board_member/',
		template: 'jetsm-page'
	},

	{
		pattern: '/news/',
		template: 'jetsm-news-list'
	},
	{
		pattern: '/news/:slug/',
		template: 'jetsm-news-detail'
	},

	{
		pattern: '/career/',
		template: 'jetsm-career'
	},
	{
		pattern: '/how-it-works/',
		template: 'jetsm-hiw'
	},
	{
		pattern: '/how-it-works/pricing/',
		template: 'jetsm-hiw-pricing'
	},

	{
		pattern: '/reviews/',
		template: 'jetsm-page'
	},
	{
		pattern: '/contact-us/',
		template: 'jetsm-page'
	},

	{
		pattern: '/download/',
		template: 'jetsm-download'
	},

	{
		pattern: '/safety-security/',
		template: 'jetsm-page'
	},
	{
		pattern: '/safety-security/:company/',
		template: 'jetsm-page'
	},

	{
		pattern: '/owners/',
		template: 'jetsm-page'
	},
	{
		pattern: '/fleet/',
		template: 'jetsm-page'
	},

	// TODO: webproduct, make it more readably, like array of urls ['url1', 'url2'], tmpl: '<web-product />'
	{
		pattern: '/flights/',
		template: 'routes-list'
	},
	{
		pattern: '/flights/:route/',
		template: 'jet-flights'
	},
	{
		pattern: '/flights/:route/:shuttleId/',
		template: 'jet-flights'
	},

	{
		pattern: '/my-trips/',
		template: 'jetsm-my-trips'
	},
	{
		pattern: '/my-trips/:slug/',
		template: 'jetsm-my-trips-detail'
	},

	// { pattern: '/routes-list/', template: '<routes-list,

]
const server_name = 'https://jetsmarter.com'
const viewTag = 'bmp-view'
const not_found_tag = 'page-404'

export { urlConf, viewTag, not_found_tag, server_name }
