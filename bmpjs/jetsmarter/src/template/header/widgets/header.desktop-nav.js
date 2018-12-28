
import Core from 'bmpjs/core'
import { isActive } from '../../../helpers/url.js'
import { ReactCaller } from '../../../tools/react-caller.js';
import { BmpAnchor as Link } from 'bmpjs/router'

const default_avatar_url = './assets/img/avatar.gif'

class HeaderDesktopNav extends Core.StatelessWidget {

	static get tagname() {
		return 'header-desktop-nav'
	}

	constructor() {
		super()
		this.storage = new Core.BaseStorage()
	}

	handleLoginClick() {
		ReactCaller.run('modal', this.reactEl, this.storage, 'login')
	}

	handleSignupClick() {
		ReactCaller.run('modal', this.reactEl, this.storage, 'signup')
	}

	handleProfileClick() {
		ReactCaller.run('offcanvasProfile', this.reactEl, this.storage)
	}

	content() {
		return this.context.user.isAuthorized ?
			this.authorizedContent(this.context.user) :
				this.nonAuthorizedContent(this.context.user)
	}

	authtorizedContent(user) {
		return this.html`
			<div class="auth-user">
				${ Link.widget({ inner: 'My trips', href: "/my-trips/", style: "margin-right: 27px;" }) }
				<span class="auth-link-sign">
					<a class="user-link" href="/profile/" @click="${ev => { ev.preventDefault(); this.handleProfileClick(); } }">
						<span class="user-name">${user.name}</span>
						<div class="user-avatar" style="${`background-image: url('${user.avatar_url || default_avatar_url}')`}"></div>
					</a>
				</span>
			</div>
		`
	}

	nonAuthorizedContent(user) {
		return this.html`
			<div class="auth-link">
				<button class="open-modal-btn auth-link-sign" @click="${this.handleSignupClick.bind(this)}">Start 14 day trial</button>
				<i class="auth-link-divider">|</i>
				<button class="open-modal-btn auth-link-login" @click="${this.handleLoginClick.bind(this)}">Log in</button>
				<span class="tooltip">Already a member?<br /> Log in to access member pricing.</span>
			</div>
		`
	}


}

export { HeaderDesktopNav }
