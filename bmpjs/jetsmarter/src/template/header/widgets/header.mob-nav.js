
import Core from 'bmpjs/core'
import { BmpAnchor as Link } from 'bmpjs/router'
import svgIcon from '../../../tools/svg-icons';

class HeaderMobNav extends Core.StatelessWidget {

	static get tagname() {
		return 'header-mobile-nav'
	}

	showMobileNav() {
		new ModalMenuBar()
			.show({ animateName: 'slide-in-left' })
			.then(r => console.log(''))
			.catch(err => console.log(''))
	}

	content() {
		return this.html`
			<div class="mobile-navigation">
				${ Link.widget({ className: 'mobile-search', href: '/?focus=origin', inner: svgIcon.searchHeader() }) }
				${ Link.widget({ className: 'mobile-logo', href: '/', inner: svgIcon.logo() }) }
				<div class="mobile-hamburger" @click="${e => this.showMobileNav() }">
					${ svgIcon.hamburger() }
				</div>
			</div>
		`
	}


}

export { HeaderMobNav }
