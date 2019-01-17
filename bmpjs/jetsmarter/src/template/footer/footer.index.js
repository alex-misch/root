
import Core from 'bmpjs/core'
import Layout from '../../theme/layout.js'
import { FooterDisclaimer } from './widgets/footer.disclaimer.js';
import { FooterSocial } from './widgets/footer.social.js';
import { FooterMenu } from './widgets/footer.menu.js';

import styles from './footer.sass'
import { FooterButtons } from './widgets/footer.buttons.js';
Core.CssJS.inject(styles)

class Footer extends Core.StatelessWidget {

	static get tagname() {
		return 'jetsm-footer'
	}


	content() {
		return !this.context.show && [
				/** Menu and social share */
				Layout.grid({
					child: Layout.col({
						mod: { common: 12, className: 'footer-top-block' },
						child: Layout.grid({
							child:  [
								Layout.col({
									mod: { common: 6, tablet: 12, align: 'bottom' },
									child: FooterMenu.widget()
								}),

								Layout.col({
									mod: { common: 3, align: 'top' }
								}),

								Layout.col({
									mod: { common: 3, align: 'top' },
									child: FooterSocial.widget()
								})
							]
						})
					})
				}),
				/** Buttons & partners */
				Layout.grid({
					child: Layout.col({
						mod: { common: 12 },
						child: Layout.grid({
							child: Layout.col({
								mod: { common: 12, tablet: 12, align: 'bottom' },
								child: FooterButtons.widget()
							})
						})
					})
				}),
				/** Disclaimer */
				Layout.grid({
					child: Layout.col({
						mod: { common: 12 },
						child: FooterDisclaimer.widget()
					})
				})
			]
	}

}

export { Footer }
