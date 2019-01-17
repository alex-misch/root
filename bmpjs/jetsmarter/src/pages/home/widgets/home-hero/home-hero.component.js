import Core from 'bmpjs/core'

import styles from './home-hero.sass'
import Layout from '../../../../theme/layout';
import svgIcon from "../../../../tools/svg-icons"
import { FlightSearch } from '../../../../widgets/flights-search/flights-search';

Core.CssJS.inject(styles)

class HomeHero extends Core.StatelessWidget {

	static get tagname() {
		return 'home-hero'
	}

	content() {
		return Layout.container({
			mod: { class: 'home-hero-wrapper' },
			child: [
				Layout.container({
					mod: { class: 'jet-search-homepage' },
					child: FlightSearch.widget()
				}),
				this.html`
					<div @click="${ () => smoothScroll({ element: 'popular-routes' })}" class="scroll-arrow">
						${ svgIcon.clickMe() }
					</div>
				`
			]
		})
	}


}

export { HomeHero }
