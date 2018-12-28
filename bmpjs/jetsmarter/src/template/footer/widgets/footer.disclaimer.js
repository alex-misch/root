import Core from 'bmpjs/core'
import { BmpAnchor as Link } from 'bmpjs/router'

import Layout from "../../../theme/layout.js";

class FooterDisclaimer extends Core.StatelessWidget {

	static get tagname() {
		return 'footer-disclaimer'
	}

	content() {
		return Layout.grid({
			child: Layout.col({
				mod: { common: 12, align: 'top' },
				child: this.html`
					<p style="font-size: 10px; line-height: 13px; color: #CECBC3;">
						© 2018 JetSmarter Inc.<br />JetSmarter does not own or operate any aircraft.
						All flights are performed by FAA-licensed and DOT-registered air carriers.
						JetSmarter offers a number of programs including private charters, for which
						JetSmarter acts solely as your agent in arranging the flight, and Public Charters,
						for which JetSmarter acts as principal in buying and reselling the air transportation.
						Seats made available under the Public Charter Program are subject to the Public Charter rules
						contained in 14 CFR 380. All flights are subject to availability and such other terms and conditions
						available at ${ Link.widget({ href: "/legal/", target: "_blank", inner: 'jetsmarter.com/legal/' }) }
					</p>`
			})
		})
	}
}

export { FooterDisclaimer }
