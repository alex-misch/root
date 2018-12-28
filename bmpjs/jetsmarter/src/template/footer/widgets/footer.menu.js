
import Core from 'bmpjs/core'
import Layout from '../../../theme/layout';

import { menusList } from '../../../models/menu';
import { BmpAnchor as Link } from 'bmpjs/router'

class FooterMenu extends Core.StatelessWidget {

	static get tagname() {
		return 'footer-menu'
	}

	content() {
		return Layout.row({
			child: menusList.map(linksGroup =>
				Layout.col({
					mod: { common: 4, tablet: 4, phone: 12, align: 'top' },
					child: Layout.row({
						child: linksGroup.map(link => Layout.col({
								mod: { common: 12, tablet: 12, phone: 12, align: 'top' },
								child: Link.widget({ ...link, className: `footer-link` })
							})
						)
					})
				})
			)
		})
	}

}

export { FooterMenu }
