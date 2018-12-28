import Core from 'bmpjs/core'
import { BmpAnchor as Link } from 'bmpjs/router'

import { safetyCompanyFooter } from '../../../models/safety.js'
import Layout from "../../../theme/layout.js";
import svgIcon from '../../../tools/svg-icons.js';

class FooterButtons extends Core.StatelessWidget {


	static get tagname() {
		return 'footer-buttons'
	}

	content() {
		return Layout.row({
			child: Layout.col({
				mod: { common: 12, align: 'middle' },
				child: [
					this.html`
						<div class="footer-block">
							<div class="store-button">
								<a href="https://itunes.apple.com/us/app/jetsmarter-book-private-jets/id562937375?mt=8" rel="noopener" target="_blank">
									${ svgIcon.appStore() }
								</a>
								<a href="https://play.google.com/store/apps/details?id=com.jetsmarter.SmartJets&hl=en" rel="noopener" target="_blank">
									${ svgIcon.googlePlay() }
								</a>
							</div>

							<div class="site-button">
								${ Link.widget({ inner: 'Connect your business', href: "/partnership/", className: "site-button-item", style: "background: #FE6A57; color: #fff; margin-bottom: 10px;" }) }
								${ Link.widget({ inner: 'Become a preferred operator', href: "/nbaa17/", className: "site-button-item", style: "background: #EEECE7; color: #FE6A57; margin-bottom: 10px;" }) }
								${ Link.widget({ inner: 'For aircraft owners', href: "/owners/request-form/", className: "site-button-item", style: "background: #EEECE7; color: #FE6A57;" }) }
							</div>

							<div>
								<p style="font-size: 10px; line-height: 13px; color: #CECBC3; margin-bottom: 10px">JetSmarter contracts with operators who employ industry-leading metrics, training, safety, and maintenance.</p>
							</div>
							<div class="partners-logo">
								${ safetyCompanyFooter.map(({ image, link, title }) =>
										Link.widget({
											href: link,
											inner: this.html`<img src="${image}" alt="${title}" />`
										})
									)
								}
							</div>
						</div>
					`,
					Layout.col({
						mod: { common: 12, align: 'top' },
						child: this.html`
							<ul class="social-icons social-icons-mobile">
								<li>
									<a target="_blank" rel="noopener" href="https://www.facebook.com/JetSmarter/">
										${ svgIcon.facebook() }
									</a>
								</li>
								<li>
									<a target="_blank" rel="noopener" href="https://www.instagram.com/jetsmarter/">
										${ svgIcon.instagram() }
									</a>
								</li>
								<li>
									<a target="_blank" rel="noopener" href="https://twitter.com/JetSmarter">
										${ svgIcon.twitter() }
									</a>
								</li>
								<li>
									<a target="_blank" rel="noopener" href="https://www.linkedin.com/company/jetsmarter">
										${ svgIcon.linkedin() }
									</a>
								</li>
							</ul>
						`
					})
				]
			})
		})
	}

}
export { FooterButtons }
