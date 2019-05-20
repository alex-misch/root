define(['exports'], function (exports) { 'use strict';

	var seoblock = {
		meta: {
			title: 'World\'s Largest Private Air Travel & Lifestyle Community | JetSmarter',
			description: 'Search for private flights, book a rental jet, and pay on-the-fly, straight from your mobile phone',
			keywords: 'JetSmarter ; smart jet ; private jet app ; private jet hire ; private jet services ; private jet rent',
			image: 'https://jetsmarter.com/data/site-v4/images/external-link-5.jpg'
		},
		jsonld: [] // temporary disable ld+json
		// jsonld: [{
		// 	"@context": "http://schema.org",
		// 	"@type": "Organization",
		// 	"name": "JetSmarter United Kingdom Ltd",
		// 	"url": "https://jetsmarter.com/",
		// 	"logo": "https://jetsmarter.com/data/site-v4/images/logo.svg",
		// 	"sameAs": [
		// 		"https://www.facebook.com/JetSmarter/",
		// 		"https://www.instagram.com/jetsmarter/",
		// 		"https://twitter.com/JetSmarter",
		// 		"https://www.linkedin.com/company/jetsmarter"
		// 	]
		// }]
	};

	var seoblocks = [{
		slug: 'home',
		meta: {
			title: 'World\u2019s Largest Private Air Travel & Lifestyle Community | JetSmarter',
			description: 'Search for private flights, book a rental jet, and pay on-the-fly, straight from your mobile phone',
			keywords: 'JetSmarter ; smart jet ; private jet app ; private jet hire ; private jet services ; private jet rent'
		}
	}, {
		slug: 'faq',
		meta: {
			title: 'FAQ | JetSmarter',
			description: 'JetSmarter FAQ',
			keywords: 'JetSmarter FAQ'
		}
	}, {
		slug: 'profile',
		meta: {
			title: 'Profile | JetSmarter'
		}
	}, {
		slug: 'login',
		meta: {
			title: 'Login | JetSmarter'
		}
	}, {
		slug: 'logout',
		meta: {
			title: 'Logout | JetSmarter'
		}
	}, {
		slug: 'legal',
		meta: {
			title: 'Legal | JetSmarter',
			description: 'Please read the following terms and conditions before accessing or using JetSmarter products',
			keywords: 'jetsmarter, jetsmarter terms and conditions, jetsmarter legal'
		}
	}, {
		slug: 'pca',
		meta: {
			title: 'Public Charter Agreements | JetSmarter',
			description: 'Jetsmarter\'s Public Charter Agreements'
		}
	}, {
		slug: 'pca-detail',
		meta: function meta(el) {
			return {
				// !READ! view component should have static getter "lastElement" to use dynamic like this
				title: el.documentNumber + ' | JetSmarter',
				description: el.documentNumber + ' Public Charter Agreements',
				keywords: el.documentNumber + ', JetSmarter, Public Charter Agreements'
			};
		}
	}, {
		slug: 'jetsm-legal-detail',
		meta: {
			// !READ! view component should have static getter "lastElement" to use dynamic like this
			title: 'Legal detail | JetSmarter',
			description: 'Legal detail',
			keywords: 'Legal detail, JetSmarter'
		}
	}, {
		slug: 'form-partnership',
		meta: {
			title: 'Inquire About Partnership | JetSmarter',
			description: 'Inquire about partnership',
			keywords: 'partnership; JetSmarter'
		}
	}, {
		slug: 'form-nbaa',
		meta: {
			title: 'NBAA | JetSmarter',
			description: 'National Business Aviation Association',
			keywords: 'nbaa; JetSmarter'
		}
	}, {
		slug: 'form-owners',
		meta: {
			title: 'Owners Program | JetSmarter',
			description: 'Owners Program request form',
			keywords: 'Owners Program; JetSmarter, form, request form, fleet'
		}
	}, {
		slug: 'experience',
		meta: {
			title: 'Experience | JetSmarter',
			description: 'Experience JetSmarter',
			keywords: 'Experience; JetSmarter'
		}
	}, {
		slug: 'about',
		meta: {
			title: 'About Us | JetSmarter',
			description: 'JetSmarter is the world\'s largest members-only private jet travel and lifestyle community. We use advanced mobile technology and a members-only approach to connect leaders in business, sports, entertainment, and culture with socially-powered travel experiences.',
			keywords: 'jetsmarter, private jet travel, private jet company, jet charter, private charter flights, about jetsmarter'
		}
	}, {
		slug: 'about-detail',
		meta: function meta(el) {
			return {
				// !READ! view component should have static getter "lastElement" to use dynamic like this
				title: el.name + ' | JetSmarter',
				description: el.name + ' of JetSmarter',
				keywords: el.name + ', JetSmarter, Board Member'
			};
		}
	}, {
		slug: 'news',
		meta: {
			title: 'News | JetSmarter',
			description: 'Read the latest news about private jet air travel and watch videos from JetSmarter',
			keywords: 'jetsmarter, jetsmarter news, jetsmarter press releases, private jet aviation news, private jet industry news'
		}
	}, {
		slug: 'blog',
		meta: {
			title: 'Blog | JetSmarter',
			description: 'Read the latest news about private jet air travel and watch videos from JetSmarter',
			keywords: 'jetsmarter, jetsmarter blogs, jetsmarter press releases, private jet aviation blog, private jet industry blog'
		}
	}, {
		slug: 'blog-detail',
		meta: function meta(el) {
			return {
				// !READ! view component should have static getter "lastElement" to use dynamic like this
				title: el.title + ' | JetSmarter',
				description: el.title + '. Read the latest news about private jet air travel from JetSmarter',
				keywords: 'jetsmarter, jetsmarter blogs, jetsmarter press releases, private jet aviation blog, private jet industry blog',
				image: el.image
			};
		}
		// jsonld: blogpost => {
		// 	console.log(blogpost)
		// 	return {
		// 		"@context": "http://schema.org",
		// 		"@type": "NewsArticle",
		// 		"mainEntityOfPage": {
		// 			"@type": "WebPage",
		// 			"@id": `${ SERVER_NAME }/blog/${ blogpost.slug }`
		// 		},
		// 		"headline": blogpost.title,
		// 		"image": {
		// 			"@type": "ImageObject",
		// 			"url": `${ SERVER_NAME }${ blogpost.image.url }`,
		// 			"height": blogpost.image.height,
		// 			"width": blogpost.image.width
		// 		},
		// 		"datePublished": blogpost.updated_at,
		// 		"dateModified": blogpost.updated_at,
		// 		"author": {
		// 			"@type": "Organization",
		// 			"name": "JetSmarter"
		// 		},
		// 		"publisher": {
		// 			"@type": "Organization",
		// 			"name": "JetSmarter",
		// 			"logo": {
		// 				"@type": "ImageObject",
		// 				"url": "https://jetsmarter.com/data/site-v4/images/logo-golden.png",
		// 				"width": 230,
		// 				"height": 48
		// 			}
		// 		},
		// 		"description": blogpost.page_description
		// 	}
		// }
	}, {
		slug: 'career',
		meta: {
			title: 'Careers | JetSmarter',
			description: 'JetSmarter team is transforming the way people travel, reducing the costs of private jet flights through shared economy',
			keywords: 'jetsmarter, jetsmarter careers,private aviation careers,jet careers,private aviation jobs,jet jobs'
		}
	}, {
		slug: 'how-it-works',
		meta: {
			title: 'How it works | JetSmarter',
			description: 'How it works | JetSmarter',
			keywords: 'jetsmarter, jetsmarter how it works,how private aviation works,jet how it works,private aviation works,jet how it works'
		}
	}, {
		slug: 'reviews',
		meta: {
			title: 'Community | JetSmarter',
			description: 'Community | JetSmarter',
			keywords: 'JetSmarter, Members Testimonials, Community, Events, Benefits'
		}
	}, {
		slug: 'contact-us',
		meta: {
			title: 'Contacts | JetSmarter',
			description: 'JetSmarter looks forward to connecting with you. Please send us an email, and we\u2019ll be in touch soon.',
			keywords: 'jetsmarter contact, jetsmarter get in touch, jetsmarter feedback',
			image: 'https://jetsmarter.com/data/site-v4/images/share/contact.jpg'
		}
	}, {
		slug: 'download',
		meta: {
			title: 'Download the app | JetSmarter',
			description: 'Download the app',
			keywords: 'JetSmarter, Download the app'
		}
	}, {
		slug: 'safety-security',
		meta: {
			title: 'Safety & Security | JetSmarter',
			description: 'Safety & Security',
			keywords: 'JetSmarter, Safety, Security'
		}
	}, {
		slug: 'safety-security-detail',
		meta: function meta(el) {
			return {
				// !READ! view component should have static getter "lastElement" to use dynamic like this
				title: el.title + ' Safety & Security | JetSmarter',
				description: el.title + ' Safety & Security | JetSmarter',
				keywords: 'JetSmarter, Safety, Security, ' + el.title
			};
		}
	}, {
		slug: 'owners',
		meta: {
			title: 'Owners Program | JetSmarter',
			description: 'Owners Program request form',
			keywords: 'JetSmarter, Owners Program, request form'
		}
	}, {
		slug: 'fleet',
		meta: {
			title: 'Fleet | JetSmarter',
			description: 'Fleet | JetSmarter',
			keywords: 'JetSmarter, fleet, owners program'
		}
	}, {
		slug: 'my-trips',
		meta: {
			title: 'My Trips | JetSmarter'
		}
	}, {
		slug: 'flights',
		meta: {
			title: 'Flights | JetSmarter',
			description: 'Flights | JetSmarter',
			keywords: 'JetSmarter, Flights'
		}
	}];

	exports.default = seoblock;
	exports.seoblocks = seoblocks;

	Object.defineProperty(exports, '__esModule', { value: true });

});
