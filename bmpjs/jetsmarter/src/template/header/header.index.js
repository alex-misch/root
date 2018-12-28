/** @jsx BMPVD.createBMPVirtulaDOMElement */
import Core from 'bmpjs/core'
import { BmpAnchor as Link } from 'bmpjs/router'
import { HeaderDesktopNav } from './widgets/header.desktop-nav.js';
import { HeaderMobNav } from './widgets/header.mob-nav.js';
import Layout from '../../theme/layout.js';
import svgIcon from '../../tools/svg-icons.js';

import styles from './header.sass'
Core.CssJS.inject(styles)

class Header extends Core.StatelessWidget {

	constructor() {
		super()
		this.reactModal = document.getElementById('reactmodal')
		this.updateUser = user => {
			if (user.isAuthorized)
				Track.auth(user.id)
			else
				SendGA.logout()
		}
	}

	static get tagname() {
		return 'jetsm-header'
	}

	disconnectedCallback() {
		super.disconnectedCallback()

		bmpStorageInstance.unsubscribe('user', this.subID)
		ReactApp.disconnect(this.reactModal)
		window.removeEventListener('resize', this.resizeCallback)
		window.removeEventListener('scroll', this.checkSticky)
		window.removeEventListener('scroll', this.resizeCallback)
	}

	onAttached() {
		styles.attach(this)
		this.subID = bmpStorageInstance.subscribe('user', this.updateUser)
	}

	resizeCallback() {
		this.checkSticky()
	}

	checkSticky() {
		const scrolled = window.pageYOffset
		if (scrolled > window.jetsmarter.offsetTop && !this.classList.contains('shadow'))
			this.classList.add('shadow')
		else if (scrolled <= window.jetsmarter.offsetTop && this.classList.contains('shadow'))
			this.classList.remove('shadow')
	}

	beforeAttach() {

		if (window.hidenav) {
			this.parentElement.classList.add('hidenav')
		}

		window.addEventListener('resize', this.resizeCallback.bind(this))
		window.addEventListener('scroll', this.checkSticky.bind(this), false)
		window.addEventListener('scroll', this.resizeCallback.bind(this), false)

	}

	async getUser() {
		const response = await Resource.get('/getprofile')
		const user = JSON.parse(response)
		if (user && user.client) {
			user.client.isAuthorized = true
			this.context.user = user.client
			Resource.cache('user', user.client)
		} else {
			Resource.cache('user', { isAuthorized: false })
		}
	}



	content() {
		const { user } = this.context

		return this.html`
			<nav>${
				user && user.impersonatorId && this.html`
					<div id="web-cinderella">
						${textSmall('', `CINDERELLA: ${user.impersonatorName} as ${user.name} (${user.membershipTier ? user.membershipTier : 'NON MEMBER'})`)}
					</div>
				`}
				${
					!window.hidenav && Layout.grid({
						child: Layout.col({
							mod: { common: 12, align: 'middle' },
							child: this.html`
								<div class="nav">
									<div class="nav-pages-link">
										${ Link.widget({ href: "/", inner: 'Home' }) }
										${ Link.widget({ href: "/how-it-works/", inner: 'How it Works' }) }
										${ Link.widget({ href: "/experience/", inner: 'The Experience' }) }
										${ Link.widget({ href: "/reviews/", inner: 'Community' }) }
										<a class="phone-call" href="tel:+18889VIPJET">+1 (888) 9 VIP JET</a>
									</div>
									${ HeaderDesktopNav.widget({ user: this.context.user }) }
								</div>
								<div class="mobile-navigation">
									${ HeaderMobNav.widget({ user: this.context.user }) }
								</div>
							`
						})
					})
				}
			</nav>
		`
	}

}

export { Header }
